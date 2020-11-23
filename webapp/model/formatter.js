sap.ui.define([], function () {
	"use strict";

	return {

		descriptionAndKey: function (sKey, sDescription) {
			if (sKey && sKey !== "") {
				return sDescription + " (" + sKey + ")";
			}
			return "";
		}

	};
});