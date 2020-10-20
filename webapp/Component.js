sap.ui.define([
	"sap/ui/core/UIComponent",
	"zvgt/hppm/delivery_create/model/models"
], function (UIComponent, models) {
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
		}

	});
});