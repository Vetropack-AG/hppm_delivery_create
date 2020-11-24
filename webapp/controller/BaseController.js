sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/base/i18n/ResourceBundle"
], function (Controller, MessageBox, ResourceBundle) {
	"use strict";

	/**
	 * @constructor zvgt.hppm.delivery_create.controller.BaseController
	 * 
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * 
	 * @classdesc
	 * Constructor for a new <code>BaseController</code>.
	 * 
	 * The base controller which is accessible for all controllers.
	 * 
	 * @author Herbert Kaintz
	 * @extends sap.ui.core.mvc.Controller
	 *
	 * @public
	 * @alias zvgt.hppm.delivery_create.controller.BaseController
	 * @class 
	 */

	return Controller.extend("zvgt.hppm.delivery_create.controller.BaseController", {

		/* =========================================================== */
		/* public methods                                              */
		/* =========================================================== */

		/**
		 * Adds a message to the message manager.
		 * @param {object} mSettings The settings for the message.
		 * @name zvgt.hppm.delivery_create.controller.BaseController#addMessage
		 * @public
		 * @method
		 */
		addMessage: function (mSettings) {
			sap.ui.getCore().getMessageManager().addMessages(
				new sap.ui.core.message.Message({
					message: mSettings.message,
					type: mSettings.type,
					target: mSettings.target
				})
			);
		},

		/**
		 * Adds an error message to the message manager.
		 * @param {string} sMessage The message to display.
		 * @param {string} sTarget The single message target.
		 * @name zvgt.hppm.delivery_create.controller.BaseController#addErrorMessage
		 * @public
		 * @method
		 */
		addErrorMessage: function (sMessage, sTarget) {
			this.addMessage({
				message: sMessage,
				type: sap.ui.core.MessageType.Error,
				target: sTarget
			});
		},

		/**
		 * Adds an success message to the message manager.
		 * @param {string} sMessage The message to display.
		 * @param {string} sTarget The single message target.
		 * @name zvgt.hppm.delivery_create.controller.BaseController#addSuccessMessage
		 * @public
		 * @method
		 */
		addSuccessMessage: function (sMessage, sTarget) {
			this.addMessage({
				message: sMessage,
				type: sap.ui.core.MessageType.Success,
				target: sTarget
			});
		},

		/**
		 * Gets a fragment instance with singleton pattern.
		 * @param {string} sFragmentId The ID of the fragment to get.
		 * @param {string} oContext The context of the fragment.
		 * @returns {sap.ui.xmlfragment} The fragment instance.
		 * @name zvgt.hppm.delivery_create.controller.BaseController#getFragment
		 * @public
		 * @method
		 */
		getFragment: function (sFragmentId, oContext) {
			if (!oContext[sFragmentId]) {
				oContext[sFragmentId] = sap.ui.xmlfragment("zvgt.hppm.delivery_create.view.fragment." + sFragmentId, oContext);
				oContext.getView().addDependent(oContext[sFragmentId]);
			}
			return oContext[sFragmentId];
		},

		showErrorMessage: function (sMessage, bPreventAddToMessageContainer) {
			MessageBox.error(sMessage);

			if (!bPreventAddToMessageContainer) {
				this.addErrorMessage(sMessage);
			}
		},

		showSuccessMessage: function (sMessage, bPreventAddToMessageContainer) {
			MessageBox.success(sMessage);

			if (!bPreventAddToMessageContainer) {
				this.addErrorMessage(sMessage);
			}
		},

		showRequestErrorMessage: function (oError) {
			var oResponse = JSON.parse(oError.responseText);
			MessageBox.error(oResponse.error.message.value);
		},

		closeDialogByEvent: function (oEvent) {
			oEvent.getSource().getParent().close();
		},

		getBindingContextProperty: function (oContext, sProperty) {
			return oContext.getModel().getProperty(oContext.getPath() + "/" + sProperty);
		},

		validateFieldGroup: function (oEvent) {
			var sFieldGroupId = oEvent.getParameter("fieldGroupIds")[0];
			var oForm = this.getView().byId("LoadingInformationSimpleForm");
			return this.validateForm(oForm, sFieldGroupId);
		},

		validateForm: function (oForm, sFieldGroupId) {
			var aControls = oForm.getControlsByFieldGroupId(sFieldGroupId);
			return this._validateControls(aControls);
		},

		getResourceBundle: function () {
			if (!this._oBundle) {
				this._oBundle = ResourceBundle.create({
					url: jQuery.sap.getModulePath("zvgt.hppm.delivery_create") + "/i18n/i18n.properties",
					async: false
				});
			}
			return this._oBundle;
		},

		translateText: function (sText, aParams) {
			var oBundle = this.getResourceBundle();
			return oBundle.getText(sText, aParams);
		},

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */

		_validateControls: function (aControls) {
			var aMapping = aControls.map(this._validateControl, this);
			return aMapping.every(function (bMapping) {
				return bMapping === true;
			});
		},

		_validateControl: function (oControl) {
			switch (oControl.getMetadata().getName()) {
			case "sap.m.Input" || "sap.m.StepInput":
				return this._validateInputBase(oControl);
			case "sap.m.DateTimePicker":
				return this._validateDateTimePicker(oControl);
			case "sap.m.Select":
				return this._validateSelect(oControl);
			case "sap.m.ComboBox":
				return this._validateComboBox(oControl);
			default:
				return true;
			}
		},

		_validateInputBase: function (oControl) {
			var sValueState = "None";
			var oBinding = oControl.getBinding("value");
			var oType = oBinding.getType();
			if (oType) {
				try {
					oType.validateValue(oControl.getValue());
				} catch (err) {
					sValueState = "Error";
				}
			}
			if (oControl.getRequired() && (!oControl.getValue() || oControl.getValue() === "")) {
				sValueState = "Error";
			}
			oControl.setValueState(sValueState);
			return sValueState === "Error" ? false : true;
		},

		_validateDateTimePicker: function (oControl) {
			var sValueState = "None";
			if (oControl.getRequired() && (!oControl.getValue() || oControl.getValue() === "")) {
				sValueState = "Error";
			}
			oControl.setValueState(sValueState);
			return sValueState === "Error" ? false : true;
		},

		_validateSelect: function (oControl) {
			var sValueState = "None";
			if (!oControl.getSelectedKey() || oControl.getSelectedKey() === "") {
				sValueState = "Error";
			}
			oControl.setValueState(sValueState);
			return sValueState === "Error" ? false : true;
		},

		_validateComboBox: function (oControl) {
			var sValueState = "None";
			if (oControl.getRequired() && (!oControl.getSelectedKey() || oControl.getSelectedKey() === "")) {
				sValueState = "Error";
			}
			oControl.setValueState(sValueState);
			return sValueState === "Error" ? false : true;
		}
	});
});