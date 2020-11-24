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
			this._addPallet({}); // add empty pallet
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
			if (!this._validateInputs()) {
				return;
			}

			this._createDelivery()
				.then(this._handleCreationSuccess.bind(this))
				.catch(this._handleCreationError.bind(this));
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

		onOpenCalulatorPress: function (oEvent) {
			var oRow = oEvent.getSource().getParent().getParent(); // Button --> HBox --> Row
			var oComboBox = this._getSpecialLoadCarrierTypeComboBoxFromRow(oRow);
			var oContext = oComboBox.getSelectedItem().getBindingContext("Utils");
			var sMaterialGroup = this.getBindingContextProperty(oContext, "MaterialGroup");
			this._openCalculator(sMaterialGroup);

			this._oCalculatorResultContext = oRow.getBindingContext("Pallets");
		},

		onCalculatorOkPress: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			oDialog.close();
			var iResult = oDialog.getContent()[0].getResult();
			this._oCalculatorResultContext.getModel().setProperty(this._oCalculatorResultContext.getPath() + "/Quantity", iResult);
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

		onLoadCarrierTypeSelectionChange: function (oEvent) {
			var oRow = oEvent.getSource().getParent();
			var oItem = oEvent.getParameter("selectedItem");
			var oContext = oItem.getBindingContext("Utils");
			var sStock = this.getBindingContextProperty(oContext, "SpecialStock");

			if (sStock.length === 1) {
				this._validateSpecialStock(oRow, sStock);
			}
		},

		onSpecialStockChange: function (oEvent) {
			var oRow = oEvent.getSource().getParent();
			var oComboBox = this._getSpecialLoadCarrierTypeComboBoxFromRow(oRow);
			var oItem = oComboBox.getSelectedItem();
			if (oItem) {
				var oContext = oItem.getBindingContext("Utils");
				var sStock = this.getBindingContextProperty(oContext, "SpecialStock");
				if (sStock.length === 1) {
					this._validateSpecialStock(oRow, sStock);
				}
			}
		},

		onAddPalletPress: function () {
			this._addPallet({});
		},

		onPalletDelete: function (oEvent) {
			var oItem = oEvent.getParameter("listItem");
			var oContext = oItem.getBindingContext("Pallets");
			var sItemKey = oContext.getProperty("ItemKey");
			this._removePallet(sItemKey);
		},

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */

		_validateSpecialStock: function (oRow, sStock) {
			var oSelect = this._getSpecialStockSelectFromRow(oRow);
			var oItem = oSelect.getSelectedItem();
			if (oItem) {
				var oContext = oItem.getBindingContext("Pallets");
				var sSelectedStock = this.getBindingContextProperty(oContext, "SpecialStock");
				Log.warning("Comparing stock types. Selected: " + sSelectedStock + " vs. MaterialStock: " + sStock);
				if (sSelectedStock !== sStock) {
					oSelect.setValueState("Warning");
					oSelect.setValueStateText(this.translateText("warning.stockTypeNotMatching"));
					return;
				}
			}
			oSelect.setValueState("None");
			oSelect.setValueStateText("");
		},

		_validateInputs: function () {
			var oForm = this.getView().byId("LoadingInformationSimpleForm");
			if (!this.validateForm(oForm, "LoadingInformation")) {
				this.showErrorMessage(this.translateText("error.inputInvalid"));
				return false;
			}
			if (!this._validatePallets()) {
				this.showErrorMessage(this.translateText("error.palletsInvalid"));
				return false;
			}
			return true;
		},

		_handleCreationSuccess: function (oData) {
			var sMessage = this.translateText("success.deliveryCreated", [oData.DeliveryKey]);
			this.showSuccessMessage(sMessage, /* bPreventAddToMessageContainer => */ true);
		},

		_handleCreationError: function (oError) {
			Log.error(oError);
			this.showRequestErrorMessage(oError);
		},

		_createDelivery: function () {
			var oData = this._getDeliveryHeaderData();
			oData.Items = this._getPallets();
			oData.Files = this._getFiles();

			return new Promise(function (resolve, reject) {
				this._oDeliveryContext.getModel().create("/DeliveryHeadSet", oData, {
					success: resolve,
					error: reject
				});
			}.bind(this));
		},

		_getFiles: function () {
			var oUploadCollection = this.getView().byId("UploadCollection");
			return oUploadCollection.getBinaryFiles().map(function (oFile) {
				return {
					MimeType: oFile.mimeType,
					Filename: oFile.fileName,
					Base64Data: oFile.content
				};
			});
		},

		_validatePallets: function () {
			if (this._getPallets().length === 0 || !this._getPallets()) {
				return false;
			}
			var aControls = [];
			this.getView().byId("Pallets").getItems().forEach(function (oItem) {
				aControls = aControls.concat(oItem.getCells());
			});
			return this._validateControls(aControls);
		},

		_removePallet: function (sKey) {
			var aPallets = this._getPallets();
			for (var i = 0; i < aPallets.length; i++) {
				var oPallet = aPallets[i];
				if (oPallet.ItemKey === sKey) {
					aPallets.splice(i, 1);
					break;
				}
			}
			this._setPallets(aPallets);
		},

		_setPallets: function (aPallets) {
			this.getView().getModel("Pallets").setProperty("/", aPallets);
		},

		_getPallets: function () {
			return this.getView().getModel("Pallets").getProperty("/");
		},

		_addPallet: function (oPallet) {
			var aPallets = this.getView().getModel("Pallets").getProperty("/");
			if (!aPallets || !aPallets.length) {
				aPallets = [];
			}
			oPallet.ItemKey = (aPallets.length + 1).toString();
			aPallets.push(oPallet);
			this.getView().getModel("Pallets").setProperty("/", aPallets);
		},

		_openCalculator: function (sMaterialGroup) {
			var sId = this._determineCalculatorFragment(sMaterialGroup);
			if (sId) {
				var oDialog = this.getFragment(sId, this);
				oDialog.getContent()[0].initialize();
				oDialog.open();
			}
		},

		_determineCalculatorFragment: function (sMaterialGroup) {
			if (!sMaterialGroup) {
				return undefined;
			}
			if (sMaterialGroup.indexOf("PALLE") !== -1) {
				return "PalletsCalculatorDialog";
			} else if (sMaterialGroup.indexOf("LAYER") !== -1) {
				return "LayersCalculatorDialog";
			}
			return undefined;
		},

		_getSpecialStockSelectFromRow: function (oRow) {
			return this._getCellFromRow(oRow, "SpecialStock");
		},

		_getSpecialLoadCarrierTypeComboBoxFromRow: function (oRow) {
			return this._getCellFromRow(oRow, "LoadCarrierType");
		},

		_getCellFromRow: function (oRow, sId) {
			return oRow.getCells().find(function (oCell) {
				return oCell.getId().indexOf(sId) !== -1;
			});
		},

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

		_getDeliveryProperty: function (sProperty) {
			return this._oDeliveryContext.getModel().getProperty(this._oDeliveryContext.getPath() + "/" + sProperty);
		},

		_getDeliveryHeaderData: function () {
			return this._oDeliveryContext.getModel().getProperty(this._oDeliveryContext.getPath() + "/");
		},

		_bindView: function () {
			var oModel = this.getView().getModel();
			this._oDeliveryContext = oModel.createEntry("/DeliveryHeadSet");
			this.getView().setBindingContext(this._oDeliveryContext);
		}

	});
});