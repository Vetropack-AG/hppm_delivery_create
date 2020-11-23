sap.ui.define([
	"zvgt/hppm/delivery_create/controller/BaseController",
	"sap/base/Log",
	"zvgt/hppm/delivery_create/model/formatter"
], function (BaseController, Log, formatter) {
	"use strict";

	/**
	 * @constructor zvgt.hppm.delivery_create.controller.Main
	 * 
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * 
	 * @classdesc
	 * Constructor for a new <code>Main Controller</code>.
	 * 
	 * The controller for the main view.
	 *
	 * @author Herbert Kaintz
	 * @extends zvgt.hppm.delivery_create.controller.BaseController
	 *
	 * @public
	 * @alias zvgt.hppm.delivery_create.controller.Main
	 * @class 
	 */

	return BaseController.extend("zvgt.hppm.delivery_create.controller.Main", {
		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when a controller is instantiated.
		 * Can be used to modify the control before it is displayed, to bind event handlers and do other one-time initialization.
		 * @name zvgt.hppm.delivery_create.controller.Main#init
		 * @override
		 * @public
		 * @method
		 */
		onInit: function () {
			this.getView().getModel().metadataLoaded().then(this._bindView.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Eventhandler when the save button is pressed.
		 * @listens sap.m.Button#press
		 * @method
		 * @name zvgt.hppm.delivery_create.controller.Main#onSavePress
		 */
		onSavePress: function () {

			var oUploadCollection = this.getView().byId("UploadCollection");
			var aFiles = oUploadCollection.getBinaryFiles();
			console.log(aFiles);

			if (!this._bLoadingInfoValid) {
				this.addErrorMessage(this.translateText("error.inputInvalid"));
				return;
			}
			this.addSuccessMessage("test");
		},

		onDuplicateFileNameError: function () {
			this.showErrorMessage("Duplicate filenames are not allowed");
		},

		/**
		 * Eventhandler when the LoadingInformation form is validated.
		 * @param {object} oEvent The event issued by the control.
		 * @listens sap.ui.layout.form.SimpleForm#validateFieldGroup
		 * @method
		 * @name zvgt.hppm.delivery_create.controller.Main#onLoadingInformationValidate
		 */
		onLoadingInformationValidate: function (oEvent) {
			this._bLoadingInfoValid = this.validateFieldGroup(oEvent);
		},

		/**
		 * Eventhandler when the save message popover button is pressed.
		 * @param {object} oEvent The event issued by the control.
		 * @listens sap.m.Button#press
		 * @method
		 * @name zvgt.hppm.delivery_create.controller.Main#onSavePress
		 */
		onMessagePopoverPress: function (oEvent) {
			this.getFragment("MessagePopover", this).openBy(oEvent.getSource());
		},

		onOpenCalulatorPress: function () {
			var oDialog = this.getFragment("PalletsCalculatorDialog", this);
			//	var oDialog = this.getFragment("LayersCalculatorDialog", this);
			oDialog.getContent()[0].initialize();
			oDialog.open();
		},

		onCalculatorOkPress: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			oDialog.close();
			var iResult = oDialog.getContent()[0].getResult();
			console.log(iResult)
		},

		onLoadAtCustomerValueHelpRequest: function () {
			var oDialog = this.getFragment("CustomerValueHelpDialog", this);
			oDialog.getBinding("items").filter([]);
			oDialog.open();

			oDialog.removeAllCustomData();
			oDialog.addCustomData(new sap.ui.core.CustomData({
				key: "load",
				value: true
			}));
		},

		onUnloadAtCustomerValueHelpRequest: function () {
			var oDialog = this.getFragment("CustomerValueHelpDialog", this);
			oDialog.getBinding("items").filter([]);
			oDialog.open();

			oDialog.removeAllCustomData();
			oDialog.addCustomData(new sap.ui.core.CustomData({
				key: "unload",
				value: true
			}));
		},

		onOwnerValueHelpRequest: function () {
			var oDialog = this.getFragment("CustomerValueHelpDialog", this);
			oDialog.getBinding("items").filter([]);
			oDialog.open();

			oDialog.removeAllCustomData();
			oDialog.addCustomData(new sap.ui.core.CustomData({
				key: "owner",
				value: true
			}));
		},

		onCustomerValueHelpSearch: function (oEvent) {
			var oFilter = [
				new sap.ui.model.Filter({
					path: "Description",
					operator: "Contains",
					value1: oEvent.getParameter("value")
				}),
				new sap.ui.model.Filter({
					path: "Key",
					operator: "Contains",
					value1: oEvent.getParameter("value")
				})
			];
			oEvent.getParameter("itemsBinding").filter(oFilter);
		},

		onCustomerValueHelpConfirm: function (oEvent) {
			var oDialog = this.getFragment("CustomerValueHelpDialog", this);
			var oCustomData = oDialog.getCustomData()[0];
			var sProperty = this._getCustomerProperty(oCustomData);
			var oContext = oEvent.getParameter("selectedContexts")[0];
			var sKey = this.getBindingContextProperty(oContext, "Key");
			var sDescription = this.getBindingContextProperty(oContext, "Description");
			this._setDeliveryProperty(sProperty, sKey);
			this._setDeliveryProperty(sProperty + "Text", sDescription);
		},

		onLoadAtCustomerChange: function (oEvent) {
			this._handleCustomerChange(oEvent, "ShipToParty");
		},

		onUnloadAtCustomerChange: function (oEvent) {
			this._handleCustomerChange(oEvent, "SoldToParty");
		},

		onOwnerChange: function (oEvent) {
			this._handleCustomerChange(oEvent, "Owner");
		},

		onTransportByVetropackSelect: function (oEvent) {
			if (oEvent.getParameter("selected")) {
				this._setDeliveryProperty("Incoterm", "FCA");
				this.getView().byId("Incoterm").setEnabled(false);
			} else {
				this._setDeliveryProperty("Incoterm", undefined);
				this.getView().byId("Incoterm").setEnabled(true);
			}
		},

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */

		_handleCustomerChange: function (oEvent, sProperty) {
			var sValue = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			if (sValue) {
				this._getCustomer(sValue)
					.then(function (oData) {
						this._setDeliveryProperty(sProperty, oData.Key);
						this._setDeliveryProperty(sProperty + "Text", oData.Description);
						oInput.setValueState("None");
					}.bind(this))
					.catch(function () {
						oInput.setValueState("Error");
					});
			}
		},

		_getCustomer: function (sKey) {
			var oUtilsModel = this.getView().getModel("Utils");
			var sPath = oUtilsModel.createKey("/CustomerSet", {
				Key: sKey
			});
			return new Promise(function (resolve, reject) {
				oUtilsModel.read(sPath, {
					success: resolve,
					error: reject
				});
			});
		},

		_getCustomerProperty: function (oCustomData) {
			switch (oCustomData.getKey()) {
			case "load":
				return "ShipToParty";
			case "unload":
				return "SoldToParty";
			case "owner":
				return "Owner";
			default:
				throw new Error("Customer property not known: " + oCustomData.getKey());
			}
		},

		_setDeliveryProperty: function (sProperty, value) {
			this._oDeliveryContext.getModel().setProperty(this._oDeliveryContext.getPath() + "/" + sProperty, value);
		},

		_bindView: function () {
			var oModel = this.getView().getModel();
			this._oDeliveryContext = oModel.createEntry("/DeliveryHeadSet");
			this.getView().setBindingContext(this._oDeliveryContext);
		}
	});
});