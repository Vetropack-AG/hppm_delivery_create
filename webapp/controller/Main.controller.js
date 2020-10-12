sap.ui.define([
	"zvgd/hppm/delivery_create/controller/BaseController"
], function (BaseController) {
	"use strict";

	/**
	 * @constructor zvgd.hppm.delivery_create.controller.Main
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
	 * @extends zvgd.hppm.delivery_create.controller.BaseController
	 *
	 * @public
	 * @alias zvgd.hppm.delivery_create.controller.Main
	 * @class 
	 */

	return BaseController.extend("zvgd.hppm.delivery_create.controller.Main", {

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when a controller is instantiated.
		 * Can be used to modify the control before it is displayed, to bind event handlers and do other one-time initialization.
		 * @name zvgd.hppm.delivery_create.controller.Main#init
		 * @override
		 * @public
		 * @method
		 */
		onInit: function () {

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Eventhandler when the save button is pressed.
		 * @listens sap.m.Button#press
		 * @method
		 * @name zvgd.hppm.delivery_create.controller.Main#onSavePress
		 */
		onSavePress: function () {
			this.addSuccessMessage("test");
		},

		/**
		 * Eventhandler when the LoadingInformation form is validated.
		 * @param {object} oEvent The event issued by the control.
		 * @listens sap.ui.layout.form.SimpleForm#validateFieldGroup
		 * @method
		 * @name zvgd.hppm.delivery_create.controller.Main#onLoadingInformationValidate
		 */
		onLoadingInformationValidate: function (oEvent) {
			// var sId = oEvent.getParameter("fieldGroupIds")[0];
			// var oForm = this.getView().byId("LoadingInformationSimpleForm");
			// var aControls = oForm.getControlsByFieldGroupId(sId);

		},

		/**
		 * Eventhandler when the save message popover button is pressed.
		 * @param {object} oEvent The event issued by the control.
		 * @listens sap.m.Button#press
		 * @method
		 * @name zvgd.hppm.delivery_create.controller.Main#onSavePress
		 */
		onMessagePopoverPress: function (oEvent) {
			this.getFragment("MessagePopover", this).openBy(oEvent.getSource());
		}

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */
	});
});