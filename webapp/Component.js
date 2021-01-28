sap.ui.define([
	"sap/ui/core/UIComponent",
	"zvgt/hppm/delivery_create/model/models",
	"sap/ui/Device"
], function (UIComponent, models, Device) {
	"use strict";

	/**
	 * @constructor zvgt.hppm.delivery_create.Component
	 * 
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * 
	 * @classdesc
	 * Constructor for a new <code>Component</code>.
	 * 
	 * The app component.
	 *
	 * @author Herbert Kaintz
	 * @extends sap.ui.core.UIComponent
	 *
	 * @public
	 * @alias zvgt.hppm.delivery_create.Component
	 * @class 
	 */

	return UIComponent.extend("zvgt.hppm.delivery_create.Component", {

		metadata: {
			manifest: "json"
		},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 * @name zvgt.hppm.delivery_create.Component#init
		 * @method
		 */
		init: function () {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			this.setModel(models.createDeviceModel(), "device");
			this._registerMessageManager();
		},

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */

		registerLib: function () {
			if (window.location.href.indexOf("webidetesting") === -1) {
				jQuery.sap.registerModulePath("zvgt.hppm", "/sap/bc/ui5_ui5/sap/zvgt_controls/");
				jQuery.sap.require("zvgt_controls.library-preload");
			}
		},

		/**
		 * Registers the messsage manager to the app.
		 * @private
		 * @name zvgt.hppm.delivery_create.Component#_registerMessageManager
		 * @method
		 */
		_registerMessageManager: function () {
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(this, true);
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			this.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
		},

		/**
		 * Getter for the contentDensity CSS class for the application.
		 * @returns {string} The CSS class.
		 * @name zvgt.hppm.delivery_create.Component#getContentDensityClass
		 * @public
		 * @method
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return "sapUiSizeCompact";
		}

	});
});