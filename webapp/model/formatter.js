sap.ui.define([
	"sap/ui/core/format/DateFormat"
], function(DateFormat) {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function(sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		formatDate: function(date) {
			if (date !== null && date !== undefined && date !== "") {
				var oDate;
				var oFormat = DateFormat.getDateInstance({
					oFormatOptions: {
						pattern: "yyyy/MM/dd"
							// style: "medium"
					}
				});
				oDate = oFormat.format(date);
			} else {
				oDate = date;
			}
			return oDate;
		},

		formatTime: function(time) {
			var oTime;
			if (time !== null && time !== undefined && time !== "") {
				if (time.ms === 0) {
					return "";
				}
				var oFormat = DateFormat.getTimeInstance({
					oFormatOptions: {
						// pattern: "yyyy/MM/dd"
						style: "medium"
					}
				});
				oTime = oFormat.format(new Date(time.ms), true);
			} else {
				oTime = "";
			}
			return oTime;
		},

		delIndProperty: function(mode, fat, sat) {
			if (mode === false) {
				return false;
			}
			if (fat === "X" || sat === "X") {
				return false;
			}
			return true;
		},

		fatsatProperty: function(mode, delInd) {
			if (mode === false) {
				return false;
			}
			if (delInd === "X") {
				return false;
			}
			return true;
		},

		setHeaderStatusColors: function(sStatus) {
			var sClass = "";
			switch (sStatus) {
				case "CLR":
					sClass = "yellowColor";
					break;
				case "APP":
					sClass = "greenColor";
					break;
				case "REJ":
					sClass = "redColor";
					break;
				case "REVIEW":
					sClass = "orangeColor";
					break;
				case "SUB":
					sClass = "lightGreenColor";
					break;
					// case "YET":
					// 	sClass = "yellowColor";
					// 	break;
					// case "RESUB":
					// 	sClass = "lightBlueColor";
					// 	break;
					// case "CLOSED":
					// 	sClass = "darkRedColor";
					// 	break;
				case "INA":
					sClass = "orangeColor";
					break;
				default:
					sClass = "blueColor";
					// this.addStyleClass("blueColor");
					break;
			}
			return sClass;
		},

		setHeaderStatusState: function(sStatus) {
			var sClass = "";
			switch (sStatus) {
				case "CLR":
					// sClass = "Information";
					sClass = "None";
					break;
				case "APP":
					sClass = "Success";
					break;
				case "REJ":
					sClass = "Error";
					break;
				case "REVIEW":
					sClass = "Warning";
					break;
				case "SUB":
					sClass = "Success";
					break;
					// case "YET":
					// 	sClass = "yellowColor";
					// 	break;
					// case "RESUB":
					// 	sClass = "lightBlueColor";
					// 	break;
					// case "CLOSED":
					// 	sClass = "darkRedColor";
					// 	break;
				case "INA":
					sClass = "Warning";
					break;
				default:
					// sClass = "Information";
					sClass = "None";
					break;
			}
			return sClass;
		},

		setStatusIconSrc: function(sStatus) {
			var icon = "";
			switch (sStatus) {
				case "CLR":
					icon = "sap-icon://undo";
					break;
				case "APP":
					icon = "sap-icon://accept";
					break;
				case "REJ":
					icon = "sap-icon://decline";
					break;
				case "REVIEW":
					icon = "sap-icon://to-be-reviewed";
					break;
				case "YET":
					icon = "sap-icon://status-inactive";
					break;
				default:
					icon = "sap-icon://order-status";
					break;
			}
			return icon === "" ? null : icon;
		},

		setStatusIconColor: function(sStatus) {
			var color = "";
			switch (sStatus) {
				case "CLR":
					color = "#3333ff"; // Blue
					break;
				case "APP":
					color = "#00cc00"; // Green
					break;
				case "REJ":
					color = "#ff0000"; // Red
					break;
				case "REVIEW":
					color = "#ff9900"; // Orange
					break;
				case "YET":
					color = "#BCC203"; //"#F9FF33";	// Yellow
					break;
			}
			return color;
		},

		setStatusColors: function(sStatus) {
			var sClass = "";
			switch (sStatus) {
				case "CLR":
					sClass = "blueColor";
					break;
				case "APP":
					sClass = "greenColor";
					break;
				case "REJ":
					sClass = "redColor";
					break;
				case "REVIEW":
					sClass = "orangeColor";
					break;
				case "SUB":
					sClass = "lightGreenColor";
					break;
				case "YET":
					sClass = "yellowColor";
					break;
				case "RESUB":
					sClass = "lightBlueColor";
					break;
				case "CLOSED":
					sClass = "darkRedColor";
					break;
			}
			return sClass;
		},

		setTreeTableRowColors: function(sStatus) {
			var sClass = "";
			switch (sStatus) {
				case "ALL":
					sClass = "#22E215";
					break;
				case "PAR":
					sClass = "#FEFA01";
					break;
				case "":
					sClass = "#FE0110";
					break;
				default:
					sClass = "#FE0110";
					break;
			}
			return sClass;
		},

		formatAmount: function(amount) {
			if (amount !== undefined && amount !== null && amount !== "") {
				return parseFloat(amount);
			} else {
				return undefined;
			}
		}

		// formatMaterial: function(matnr){
		// 	// return parseInt(matnr, 10);
		// 	return matnr;
		// }

		// calculateTotalQuantity: function(bomQuantity, itemQuantity){

		// }

	};

});