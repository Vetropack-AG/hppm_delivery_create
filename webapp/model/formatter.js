sap.ui.define([], function () {
	"use strict";

	return {

		descriptionAndKey: function (sKey, sDescription) {
			if (sKey && sKey !== "") {
				return sDescription + " (" + sKey + ")";
			}
			return "";
		},

		// Display the button type according to the message with the highest severity
		// The priority of the message types are as follows: Error > Warning > Success > Info
		messageButtonTypeFormatter: function (aMessages) {
			var sHighestSeverityIcon = sap.m.ButtonType.Emphasized;
			aMessages.forEach(function (sMessage) {
				switch (sMessage.type) {
				case "Error":
					sHighestSeverityIcon = sap.m.ButtonType.Reject; // eslint-disable-line
					break;
				case "Warning":
					sHighestSeverityIcon = sHighestSeverityIcon !== "Reject" ? sap.m.ButtonType.Critical : sHighestSeverityIcon;
					break;
				case "Success":
					sHighestSeverityIcon = sHighestSeverityIcon !== "Reject" && sHighestSeverityIcon !== "Critical" ? sap.m.ButtonType.Accept :
						sHighestSeverityIcon;
					break;
				default:
					sHighestSeverityIcon = !sHighestSeverityIcon ? sap.m.ButtonType.Emphasized : sHighestSeverityIcon;
					break;
				}
			});
			return sHighestSeverityIcon;
		},

		// Set the button icon according to the message with the highest severity
		messageButtonIconFormatter: function (aMessages) {
			var sIcon = "sap-icon://message-information";
			aMessages.forEach(function (sMessage) {
				switch (sMessage.type) {
				case "Error":
					sIcon = "sap-icon://message-error";
					break;
				case "Warning":
					sIcon = sIcon !== "sap-icon://message-error" ? "sap-icon://message-warning" : sIcon;
					break;
				case "Success":
					sIcon = "sap-icon://message-error" && sIcon !== "sap-icon://message-warning" ? "sap-icon://message-success" : sIcon;
					break;
				default:
					sIcon = !sIcon ? "sap-icon://message-information" : sIcon;
					break;
				}
			});
			return sIcon;
		}

	};
});