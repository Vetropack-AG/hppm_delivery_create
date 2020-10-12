sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	/**
	 * @constructor zvgd.hppm.delivery_create.controller.BaseController
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
	 * @alias zvgd.hppm.delivery_create.controller.BaseController
	 * @class 
	 */

	return Controller.extend("zvgd.hppm.delivery_create.controller.BaseController", {

		/* =========================================================== */
		/* public methods                                              */
		/* =========================================================== */

		/**
		 * Adds a message to the message manager.
		 * @param {object} mSettings The settings for the message.
		 * @name zvgd.hppm.delivery_create.controller.BaseController#addMessage
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
		 * @name zvgd.hppm.delivery_create.controller.BaseController#addErrorMessage
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
		 * @name zvgd.hppm.delivery_create.controller.BaseController#addSuccessMessage
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
		 * @name zvgd.hppm.delivery_create.controller.BaseController#getFragment
		 * @public
		 * @method
		 */
		getFragment: function (sFragmentId, oContext) {
			if (!oContext[sFragmentId]) {
				oContext[sFragmentId] = sap.ui.xmlfragment("zvgd.hppm.delivery_create.view.fragment." + sFragmentId, oContext);
				oContext.getView().addDependent(oContext[sFragmentId]);
			}
			return oContext[sFragmentId];
		}

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */
	});
});