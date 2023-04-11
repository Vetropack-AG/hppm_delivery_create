sap.ui.define([
	"sap/ui/core/UIComponent",
	"zvgt/hppm/delivery_create/model/models",
	"sap/ui/Device",
	"sap/ui/fl/FakeLrepConnectorLocalStorage",
	"zvgt/hppm/library"
], function (UIComponent, models, Device, FakeLrepConnectorLocalStorage, hppmLibrary) {
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

			if (this.isInTestEnvironment()) {
				this.enableFakeLrep();
			}
			this._addShellHeaderHomeButton();

			hppmLibrary.addBTPCustomerNumberToHttpHeader(this);


		},

		getBaseURL: function () {
            var appId = this.getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath;
        },   

		destroy: function () {
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);

			if (this.isInTestEnvironment()) {
				FakeLrepConnectorLocalStorage.disableFakeConnector();
			}
		},

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */

		registerLib: function () {
			if (window.location.href.indexOf("webidetesting") === -1) {
			//	jQuery.sap.registerModulePath("zvgt.hppm", "/sap/bc/ui5_ui5/sap/zvgt_controls/");
			//	jQuery.sap.require("zvgt_controls.library-preload");
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
		},

		enableFakeLrep: function () {
			FakeLrepConnectorLocalStorage.enableFakeConnector(
				null,
				this.getAppId(),
				this.getVersion()
			);
		},

		getAppId: function () {
			return this.getManifestEntry("/sap.app").id;
		},

		getVersion: function () {
			return this.getManifestEntry("/sap.app/applicationVersion").version;
		},

		isInTestEnvironment: function () {
			return window.location.hostname.indexOf("webidetesting") !== -1;
		},

		_addShellHeaderHomeButton: function () {
			var rendererPromise = this._getShellRenderer();
			rendererPromise.then(function (oRenderer) {
				oRenderer.addHeaderItem("sap.ushell.ui.shell.ShellHeadItem", {
					icon: "sap-icon://home",
					press: this._navHome
				}, true, true);
			}.bind(this));
		},

		_navHome: function () {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({ // eslint-disable-line
				target: {
					semanticObject: "#"
				}
			});
		},

		_getShellRenderer: function () {
			var that = this,
				oDeferred = new jQuery.Deferred(),
				oRenderer;

			that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
			if (!that._oShellContainer) {
				oDeferred.reject(
					"Illegal state: shell container not available; this component must be executed in a unified shell runtime context.");
			} else {
				oRenderer = that._oShellContainer.getRenderer();
				if (oRenderer) {
					oDeferred.resolve(oRenderer);
				} else {
					// renderer not initialized yet, listen to rendererCreated event
					that._onRendererCreated = function (oEvent) {
						oRenderer = oEvent.getParameter("renderer");
						if (oRenderer) {
							oDeferred.resolve(oRenderer);
						} else {
							oDeferred.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.");
						}
					};
					that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
				}
			}
			return oDeferred.promise();
		}

	});
});