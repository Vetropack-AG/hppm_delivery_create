sap.ui.define([
	"zvgt/hppm/delivery_create/controller/BaseController",
	"sap/base/Log",
	"zvgt/hppm/delivery_create/model/formatter",
	"sap/ushell/services/URLParsing",
	"sap/ui/core/routing/HashChanger",
	"zvgt/hppm/library"
], function (BaseController, Log, formatter, URLParsing, HashChanger, hppm) {
	"use strict";

	var aSaveProperties = [
		"Comment",
		// "CustomerDelivery",
		// "DeliveryDateFrom",
		// "DeliveryDateUntil",
		"DeliveryKey",
		"Description",
		"Incoterm",
		"Owner",
		"OwnerText",
		// "PickUpDateFrom",
		// "PickUpDateUntil",
		"ShipToParty",
		"ShipToPartyText",
		"SoldToParty",
		"SoldToPartyText",
		"TruckNumber",
		"Pallets"
	];

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
			this.getOwnerComponent().getRouter().getRoute("Main").attachPatternMatched(this.onPatternMatched, this);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.getOwnerComponent().getModel().metadataLoaded().then(this._bindView.bind(this));
			this._addPallet({}); // add empty pallet
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		onPatternMatched: function () {
			this.getView().setModel(new sap.ui.model.json.JSONModel(), "ViewSettings");
			this._setDeliveryType();
		},

		onFetchVariant: function () {
			var oSaveData = {};
			aSaveProperties.forEach(function (property) {
				if (this._getDeliveryProperty(property) && aSaveProperties.indexOf(property) !== -1) {
					oSaveData[property] = this._getDeliveryProperty(property);
				}
			}, this);

			if (this._getPallets().length > 0) {
				oSaveData.Pallets = this._getPallets();
			}
			return oSaveData;
		},

		onApplyVariant: function (oEvent) {
			var oVariantData = oEvent.getParameter("variantData");
			delete oVariantData.executeOnSelection;
			this.getView().byId("incotermGroup").setSelectedIndex(-1);
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				this._bindView();
				this._applyVariantData(oVariantData);
			}.bind(this));
		},

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
			var oSelectedItem = oComboBox.getSelectedItem();
			if (oSelectedItem) {
				var oContext = oSelectedItem.getBindingContext();
				var sMaterialGroup = this.getBindingContextProperty(oContext, "MaterialGroup");
				this._openCalculator(sMaterialGroup);
				this._oCalculatorResultContext = oRow.getBindingContext("Pallets");
			} else {
				Log.warning("Could not open calculator because no material was selected");
				oComboBox.setValueState("Error");
			}
		},

		onCalculatorOkPress: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			oDialog.close();
			var iResult = oDialog.getContent()[0].getResult();
			this._oCalculatorResultContext.getModel().setProperty(this._oCalculatorResultContext.getPath() + "/Quantity", iResult.toString());
			this.setVariantDirty();
		},

		onLoadAtCustomerValueHelpRequest: function () {
			var oDialog = this.getFragment("CustomerValueHelpDialog", this);
			if (this._isOutboundDelivery()) {
				oDialog.getBinding("items").filter([]);
			} else {
				oDialog.getBinding("items").filter(this._getUnloadAtCustomerFilter());
			}
			oDialog.open();

			oDialog.removeAllCustomData();
			oDialog.addCustomData(new sap.ui.core.CustomData({
				key: "load",
				value: true
			}));
		},

		onUnloadAtCustomerValueHelpRequest: function () {
			var oDialog = this.getFragment("CustomerValueHelpDialog", this);
			oDialog.getBinding("items").filter(this._getUnloadAtCustomerFilter());
			oDialog.open();

			oDialog.removeAllCustomData();
			oDialog.addCustomData(new sap.ui.core.CustomData({
				key: "unload",
				value: true
			}));
		},

		onOwnerValueHelpRequest: function () {
			var oDialog = this.getFragment("PlantValueHelpDialog", this);
			oDialog.getBinding("items").filter([]);
			oDialog.open();
		},

		onOwnerValueHelpConfirm: function (oEvent) {
			var oContext = oEvent.getParameter("selectedContexts")[0];
			var sKey = this.getBindingContextProperty(oContext, "Key");
			var sDescription = this.getBindingContextProperty(oContext, "Description");
			this._setDeliveryProperty("Owner", sKey);
			this._setDeliveryProperty("OwnerText", sDescription);
			this.setVariantDirty();
		},

		onOwnerValueHelpSearch: function (oEvent) {
			this._handleStandardValueHelpSearch(oEvent);
		},

		onCustomerValueHelpSearch: function (oEvent) {
			this._handleStandardValueHelpSearch(oEvent, true);
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
			this.setVariantDirty();

			if (sProperty === "SoldToParty") {
				this._setFieldsForCustomer(sKey);
				this._filterLoadCarrierTypesForCustomer(sKey);
			}
		},

		onLoadAtCustomerChange: function (oEvent) {
			this._handleCustomerChange(oEvent, "SoldToParty");
			this.setVariantDirty();

			var sValue = oEvent.getParameter("value");
			this._setFieldsForCustomer(sValue);
			this._filterLoadCarrierTypesForCustomer(sValue);
		},

		setVariantDirty: function () {
			this.getVariantManagement().setModified(true);
		},

		getVariantManagement: function () {
			return this.getView().byId("variantManagement");
		},

		onUnloadAtCustomerChange: function (oEvent) {
			this._handleCustomerChange(oEvent, "ShipToParty");
			this.setVariantDirty();
		},

		onOwnerChange: function (oEvent) {
			this._handleOwnerChange(oEvent);
			this.setVariantDirty();
		},

		onTransportBySelect: function (oEvent) {
			var sIncoterm = oEvent.getParameter("selectedIndex") === 0 ? "DAP" : "FCA";
			this._setDeliveryProperty("Incoterm", sIncoterm);
			this.setVariantDirty();
		},

		onLoadCarrierTypeSelectionChange: function (oEvent) {
			var oRow = oEvent.getSource().getParent();
			var oItem = oEvent.getParameter("selectedItem");
			if (oItem) {
				var oContext = oItem.getBindingContext();
				var sStock = this.getBindingContextProperty(oContext, "SpecialStock");
				oEvent.getSource().setValueState("None");

				var bPrefilled = this._prefillQuantityWithStock(oRow);
				if (!bPrefilled) {
					this._doCheckRentStockQuantity(oRow);
				}
				if (sStock.length === 1) {
					this._validateSpecialStock(oRow, sStock);
				}

				this.setVariantDirty();
			}
		},

		onMaterialQuantityChange: function (oEvent) {
			var oRow = oEvent.getSource().getParent().getParent();
			this._doCheckRentStockQuantity(oRow);
			this.setVariantDirty();
		},

		onSpecialStockChange: function (oEvent) {
			var oRow = oEvent.getSource().getParent();
			var oComboBox = this._getSpecialLoadCarrierTypeComboBoxFromRow(oRow);
			var oItem = oComboBox.getSelectedItem();
			if (oItem) {
				var oContext = oItem.getBindingContext();
				var sStock = this.getBindingContextProperty(oContext, "SpecialStock");
				if (sStock.length === 1) {
					this._validateSpecialStock(oRow, sStock);
				}
			}
			this._doCheckRentStockQuantity(oRow);
			this.setVariantDirty();
		},

		onAddPalletPress: function () {
			this._addPallet({});
			this.setVariantDirty();
			var sCustomer = this._getDeliveryProperty("SoldToParty");
			this._filterLoadCarrierTypesForCustomer(sCustomer);
		},

		onPalletDelete: function (oEvent) {
			var oItem = oEvent.getParameter("listItem");
			// var oContext = oItem.getBindingContext("Pallets");
			// var sItemKey = oContext.getProperty("ItemKey");
			this._removePallet(oItem);
			this.setVariantDirty();
		},

		onCancelPress: function () {
			this.getVariantManagement().applyInitialVariant();
		},

		onDeliveryDateFromChange: function (oEvent) {
			this._handleLoadingInfoDateChange(oEvent, "PickUpDateFrom");
		},

		onDeliveryDateUntilChange: function (oEvent) {
			this._handleLoadingInfoDateChange(oEvent, "PickUpDateUntil");
		},

		onPickupDateFromChange: function (oEvent) {
			this._handleLoadingInfoDateChange(oEvent, "DeliveryDateFrom");
		},

		onPickupDateUntilChange: function (oEvent) {
			this._handleLoadingInfoDateChange(oEvent, "DeliveryDateUntil");
		},

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */

		_filterLoadCarrierTypesForCustomer: function (sCustomer) {
			var oTable = this.getView().byId("Pallets");
			oTable.getItems().forEach(function (oItem) {
				oItem.getCells()[0].getBinding("items").filter([new sap.ui.model.Filter("Customer", "EQ", sCustomer)]);
			}, this);
		},

		_handleLoadingInfoDateChange: function (oEvent, sProperty) {
			var oValue = oEvent.getSource().getDateValue();
			var oNewDate = this.addDaysToDate(oValue, 1);
			this._setDeliveryProperty(sProperty, oNewDate);
			this.setVariantDirty();
		},

		_doCheckRentStockQuantity: function (oRow) {
			if (this._sDeliveryType === hppm.DELIVERY_TYPE.EXTERNAL) {
				var oSelect = this._getSpecialStockSelectFromRow(oRow);
				var oItem = oSelect.getSelectedItem();
				if (oItem) {
					this._getRentStock(oItem)
						.then(function (sStockQuantity) {
							this._checkRentStockQuantity(oRow, sStockQuantity);
						}.bind(this));
				}
			}
		},

		_checkRentStockQuantity: function (oRow, sStockQuantity) {
			var oSelect = this._getSpecialStockSelectFromRow(oRow);
			var sStock = oSelect.getSelectedKey();
			var oInput = this._getQuantityInputFromRow(oRow);
			var sQuantity = oInput.getValue();
			if (sQuantity && sQuantity !== "" && parseFloat(sQuantity, 10) > parseFloat(sStockQuantity, 10) && sStock === hppm.STOCK_TYPE.RENT) {
				oInput.setValueState("Warning");
				oInput.setValueStateText(this.translateText("warning.notOnStock"));
			} else {
				oInput.setValueState("None");
				oInput.setValueStateText();
			}
		},

		_prefillQuantityWithStock: function (oRow, sStockQuantity) {
			if (parseFloat(sStockQuantity, 10) > 0) {
				var oInput = this._getQuantityInputFromRow(oRow);
				var oContext = oInput.getBindingContext("Pallets");
				this.setBindingContextProperty(oContext, "Quantity", sStockQuantity);
				return true;
			}
			return false;
		},

		_getRentStock: function (oItem) {
			var oContext = oItem.getBindingContext();
			var oModel = this.getView().getModel();
			var sKey = oModel.createKey("/MaterialStockSet", {
				Customer: this._getDeliveryProperty("SoldToParty"),
				Plant: this._getDeliveryProperty("Owner"),
				Material: this.getBindingContextProperty(oContext, "Key"),
				SpecialStock: hppm.STOCK_TYPE.RENT
			});

			return new Promise(function (resolve, reject) {
				oModel.read(sKey, {
					success: function (oData) {
						resolve(oData.Quantity);
					},
					error: reject
				});
			}.bind(this));
		},

		_setFieldsForCustomer: function (sCustomerNumber) {
			var oModel = this.getView().getModel();
			var sKey = oModel.createKey("/CustomerValueHelpSet", {
				Key: sCustomerNumber
			});
			oModel.read(sKey, {
				success: function (oData) {
					if (oData.Incoterm && oData.Incoterm !== "") {
						this.getView().byId("incotermGroup").setSelectedIndex(oData.Incoterm === "DAP" ? 0 : 1);
						this._setDeliveryProperty("Incoterm", "DAP");
					}
					if (oData.Location && oData.Location !== "") {
						this.getView().byId("LocationInput").fireChange({
							value: oData.Location
						});
					}
					if (oData.Owner && oData.Owner !== "") {
						this.getView().byId("OwnerInput").fireChange({
							value: oData.Owner
						});
					}
				}.bind(this)
			});
		},

		_setDeliveryType: function () {
			this._sDeliveryType = this._isOutboundDelivery() ? hppm.DELIVERY_TYPE.EXTERNAL : hppm.DELIVERY_TYPE.INTERNAL;
			this.getView().getModel("ViewSettings").setProperty("/DeliveryType", this._sDeliveryType);
		},

		_isOutboundDelivery: function () {
			var sHash = new HashChanger().getHash();
			var oShellHash = new URLParsing().parseShellHash(sHash);
			return oShellHash.semanticObject === "OutboundDelivery";
		},

		_applyVariantData: function (oVariantData) {
			for (var property in oVariantData) {

				if (oVariantData.hasOwnProperty(property)) {
					if (property === "Incoterm") {
						this.getView().byId("incotermGroup").setSelectedIndex(oVariantData[property] === "DAP" ? 0 : 1);
					}
					if (property.toUpperCase().indexOf("DATE") !== -1) {
						oVariantData[property] = new Date(oVariantData[property]);
					}
					if (property === "Pallets") {
						this._setPallets(oVariantData[property]);
					} else {
						this._setDeliveryProperty(property, oVariantData[property]);
					}
				}
			}
		},

		_handleStandardValueHelpSearch: function (oEvent, bToUpperCase) {
			var oFilter = [
				new sap.ui.model.Filter({
					path: "Description",
					operator: "Contains",
					value1: bToUpperCase ? oEvent.getParameter("value").toUpperCase() : oEvent.getParameter("value")
				}),
				new sap.ui.model.Filter({
					path: "Key",
					operator: "Contains",
					value1: oEvent.getParameter("value")
				})
			];
			oEvent.getParameter("itemsBinding").filter(oFilter);
		},

		_resetData: function () {
			this.getOwnerComponent().getModel().resetChanges();
			this._resetPallets();
			this._resetFiles();
		},

		_resetPallets: function () {
			this._setPallets([]);
			this._addPallet({}); // add empty pallet
		},

		_resetFiles: function () {
			var oUploadCollection = this.getView().byId("UploadCollection");
			if (oUploadCollection) {
				oUploadCollection.removeAllItems();
			}
		},

		_getUnloadAtCustomerFilter: function () {
			return [
				new sap.ui.model.Filter({
					path: "AccountGroup",
					operator: "EQ",
					value1: "0120"
				})
			];
		},

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
			} else {
				this.setBindingContextProperty(oRow.getBindingContext("Pallets"), "SpecialStock", sStock);
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
			sap.ui.core.BusyIndicator.hide();

			var oDialog = new sap.m.Dialog({
				title: "{i18n>general.success}",
				type: "Message",
				state: "Success",
				content: new sap.m.Text({
					text: this.translateText("success.deliveryCreated", [oData.DeliveryKey])
				}),
				beginButton: new sap.m.Button({
					type: "Emphasized",
					text: "{i18n>general.goBack}",
					press: function () {
						oDialog.close();
						this.goBack();
					}.bind(this)
				}),
				endButton: new sap.m.Button({
					text: "{i18n>general.close}",
					press: function () {
						this.getVariantManagement().applyInitialVariant();
						oDialog.close();
					}.bind(this)
				}),
				afterClose: function () {
					oDialog.destroy();
				}
			});

			this.getView().addDependent(oDialog);
			oDialog.open();
		},

		_handleCreationError: function (oError) {
			sap.ui.core.BusyIndicator.hide();
			Log.error(oError);
			this.showRequestErrorMessage(oError);
		},

		_createDelivery: function () {
			var oData = this._getDeliveryHeaderData();
			oData.Items = this._getPallets();
			oData.Files = this._getFiles();

			sap.ui.core.BusyIndicator.show(0);
			return new Promise(function (resolve, reject) {
				this._oDeliveryContext.getModel().create("/DeliveryHeadSet", oData, {
					success: resolve,
					error: reject
				});
			}.bind(this));
		},

		_getFiles: function () {
			var oUploadCollection = this.getView().byId("UploadCollection");
			if (!oUploadCollection) {
				return [];
			}
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

		_removePallet: function (oItem) {
			var aPallets = this._getPallets();
			var aItems = this.getView().byId("Pallets").getItems();
			for (var i = 0; i < aItems.length; i++) {
				if (oItem.getId() === aItems[i].getId()) {
					aPallets.splice(i, 1);
					break;
				}
			}
			this._setPallets(aPallets);
		},

		_setPallets: function (aPallets) {
			this.getOwnerComponent().getModel("Pallets").setProperty("/", aPallets);
		},

		_getPallets: function () {
			return this.getOwnerComponent().getModel("Pallets").getProperty("/");
		},

		_addPallet: function (oPallet) {
			var aPallets = this.getOwnerComponent().getModel("Pallets").getProperty("/");
			if (!aPallets || !aPallets.length) {
				aPallets = [];
			}
			aPallets.push(oPallet);
			this.getOwnerComponent().getModel("Pallets").setProperty("/", aPallets);
		},

		_openCalculator: function (sMaterialGroup) {
			var sId = this._determineCalculatorFragment(sMaterialGroup);
			if (sId) {
				var oDialog = this.getFragment(sId, this);
				var oCalculator = oDialog.getContent()[0];
				oCalculator.initialize();
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

		_getQuantityInputFromRow: function (oRow) {
			return this._getCellFromRow(oRow, "Quantity").getItems()[0];
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

		_handleOwnerChange: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oInput = oEvent.getSource();
			if (sValue) {
				this._getOwner(sValue)
					.then(function (oData) {
						this._setDeliveryProperty("Owner", oData.Key);
						this._setDeliveryProperty("OwnerText", oData.Description);
						oInput.setValueState("None");
					}.bind(this))
					.catch(function () {
						oInput.setValueState("Error");
					});
			}
		},

		_getOwner: function (sKey) {
			return this._getValueHelpEntity(sKey, "PlantValueHelpSet");
		},

		_getCustomer: function (sKey) {
			return this._getValueHelpEntity(sKey, "CustomerValueHelpSet");
		},

		_getValueHelpEntity: function (sKey, sEntitySet) {
			var oUtilsModel = this.getOwnerComponent().getModel();
			var sPath = oUtilsModel.createKey("/" + sEntitySet, {
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
				return "SoldToParty";
			case "unload":
				return "ShipToParty";
			default:
				throw new Error("Customer property not known: " + oCustomData.getKey());
			}
		},

		_setDeliveryProperty: function (sProperty, value) {
			if (this._oDeliveryContext) {
				return this._oDeliveryContext.getModel().setProperty(this._oDeliveryContext.getPath() + "/" + sProperty, value);
			}
			return undefined;
		},

		_getDeliveryProperty: function (sProperty) {
			if (this._oDeliveryContext) {
				return this._oDeliveryContext.getModel().getProperty(this._oDeliveryContext.getPath() + "/" + sProperty);
			}
			return undefined;
		},

		_getDeliveryHeaderData: function () {
			if (this._oDeliveryContext) {
				var oData = this._oDeliveryContext.getModel().getProperty(this._oDeliveryContext.getPath() + "/");
				oData.DeliveryType = this._sDeliveryType;
				return oData;
			}
			return undefined;
		},

		_bindView: function () {
			var oModel = this.getOwnerComponent().getModel();
			if (this._oDeliveryContext) {
				oModel.deleteCreatedEntry(this._oDeliveryContext);
				this._oDeliveryContext.destroy();
				this._oDeliveryContext = undefined;
			}
			this._oDeliveryContext = oModel.createEntry("/DeliveryHeadSet");
			this.getView().setBindingContext(this._oDeliveryContext);

			var bOutbound = this._isOutboundDelivery();
			if (!bOutbound) {
				this._setDeliveryProperty("Incoterm", "DAP");
				var oRadioGroup = this.getView().byId("incotermGroup");
				oRadioGroup.setEditable(false);
				oRadioGroup.setSelectedIndex(0);
			}
		}

	});
});