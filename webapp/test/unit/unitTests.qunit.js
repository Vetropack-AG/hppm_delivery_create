/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zvgd/hppm/delivery_create/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});