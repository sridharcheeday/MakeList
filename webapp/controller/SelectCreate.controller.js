sap.ui.define([
	"ps/dewa/makelist/MakeList/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	// "sap/ui/core/routing/History",
	"ps/dewa/makelist/MakeList/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"ps/dewa/makelist/MakeList/model/GetData"
], function(BaseController, JSONModel, formatter, Filter, FilterOperator, MessageBox, Data) { // History
	"use strict";

	return BaseController.extend("ps.dewa.makelist.MakeList.controller.SelectCreate", {
		formatter: formatter,
		onInit: function() {
			var oViewModel;
			// Model used to manipulate control states
			oViewModel = new JSONModel({
				PoNum: "",
				Vendor: "",
				Name: "",
				vendorInputState: "None",
				poInputState: "None",
				bPOEnabled: false,
				bCreateButtonEnabled: false
			});
			this.setModel(oViewModel, "SelectCreate");

			// Add the Create page to the flp routing history
			this._addRouteHistory(this.getResourceBundle().getText("SelectMatViewTitle"), "/selectcreate", true);

			if (this.getOwnerComponent().getModel("Auth"))
				this.bAuthEditable = this.getOwnerComponent().getModel("Auth").getProperty("/bAuthEditable");
			// if (this.bAuthEditable === undefined) {
			// 	var getAuth = this._getAuthorization();
			// 	getAuth.then(jQuery.proxy(function(data) {
			// 		// this.bAuthEditable = (data.Accessable === 'E' || data.Accessable === 'C') ? true : false;
			// 		if (this.bAuthEditable === true) {
			// 			oViewModel.setProperty("/bCreateButtonEnabled", true);
			// 		}
			// 	}, this));
			// } else {
			// if (this.bAuthEditable === true) {
			oViewModel.setProperty("/bCreateButtonEnabled", true);
			// }
			// }
			this._getBusyDialog();
			this.getOwnerComponent().getModel().setSizeLimit(50000);
		},

		onPressMatSel: function(oEvent) {
			// The source is the list item that got pressed
			if (this.validateMandats() === false) {
				return;
			}
			Data.validateInputs(this);
		},

		validateMandats: function() {
			var oViewModel = this.getModel("SelectCreate");
			var vendor = oViewModel.getProperty("/Vendor");
			var po = oViewModel.getProperty("/PoNum");
			if (vendor === undefined || vendor === null || vendor === "") {
				oViewModel.setProperty("/vendorInputState", "Error");
				MessageBox.error(this.getResourceBundle().getText("VENDOR_MAND"), { // Please enter mandatory Vendor..
					// title: "Error"
				});
				return false;
			} else {
				oViewModel.setProperty("/vendorInputState", "None");
				return true;
			}
			if (po === undefined || po === null || po === "") {
				oViewModel.setProperty("/poInputState", "Error");
				MessageBox.error(this.getResourceBundle().getText("PO_MAND"), { // Please enter mandatory PO Number..
					// title: "Error"
				});
				return false;
			} else {
				oViewModel.setProperty("/poInputState", "None");
				return true;
			}

		},

		_showObject: function(oItem) {
			var oViewModel = this.getModel("SelectCreate");
			var vendor = oViewModel.getProperty("/Vendor");
			var po = oViewModel.getProperty("/PoNum");
			this.getRouter().navTo("createmsitems", {
				ponum: po,
				vendor: vendor
			});
		},

		// handleErrors: function(error) {
		// 	MessageBox.error(error.message, {	// JSON.parse(error.response.body).error.message.value
		// 		title: "Error"
		// 	});
		// },

		handleVendorValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			// create value help dialog
			if (!this._vendorValueHelpDialog) {
				this._vendorValueHelpDialog = this.getMSValueHelpDialog("MSVendorsDialog");
			}
			// Data._getMSVendorData(this);
			// open value help dialog filtered by the input value
			this._vendorValueHelpDialog.open(sInputValue);
		},

		onVendorChange: function(evt) {
			var oViewModel = this.getModel("SelectCreate");
			if (evt.getParameter("value") === "") {
				oViewModel.setProperty("/PONum", "");
				oViewModel.setProperty("/bPOEnabled", false);
				oViewModel.setProperty("/Name", "");
			} else {
				oViewModel.setProperty("/bPOEnabled", true);
			}
		},

		getVendorDescription: function(evt) {
			var oViewModel = this.getModel("SelectCreate");
			var oInput = evt.getSource();
			if (evt.getParameter("value") === "") {
				oViewModel.setProperty("/PONum", "");
				oViewModel.setProperty("/bPOEnabled", false);
				oViewModel.setProperty("/Name", "");
			} else {
				oViewModel.setProperty("/bPOEnabled", true);
				// var sValue = evt.getParameter("value");
				var aFilters = [
					new Filter("Vendor", FilterOperator.EQ, evt.getParameter("value")),
					new Filter("GetFor", FilterOperator.EQ, "VN") // VN - Get vendor Description independently
				];
				var getDescr = Data.getDescription(this, this.getResourceBundle().getText("VEND_BUSY_TEXT"), "/MLMSGetDescriptionSet", aFilters); // Fetching Vendor Description...
				getDescr.then(jQuery.proxy(function(data) {
					if (data.Type === "E") {
						MessageBox.error(data.Message);
					} else {
						oInput.setDescription(data.Description);
					}
				}, this));
			}
		},

		_handleVendorValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var contains = sap.ui.model.FilterOperator.Contains;
			var aFilters = [];
			if (sValue && sValue.length > 0) {
				aFilters.push(new Filter("Vendor", sap.ui.model.FilterOperator.EQ, sValue));
				aFilters.push(new Filter("Name", contains, sValue.toUpperCase()));
				aFilters.push(new Filter("Name", contains, sValue.toLowerCase()));
			}
			evt.getSource().getBinding("items").filter(aFilters); // sap.ui.model.FilterType.Application
		},

		_handleVendorValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getModel("SelectCreate");
				oViewModel.setProperty("/Vendor", oSelectedItem.getDescription());
				oViewModel.setProperty("/Name", oSelectedItem.getTitle());
				if (oSelectedItem.getDescription() === "") {
					oViewModel.setProperty("/bPOEnabled", false);
					oViewModel.setProperty("/Name", "");
				} else {
					oViewModel.setProperty("/bPOEnabled", true);
				}
				oViewModel.setProperty("/PONum", "");
			}
		},

		// handleVendorSuggest: function(evt) {
		// 	var sValue = evt.getParameter("suggestValue");
		// 	var contains = sap.ui.model.FilterOperator.Contains;
		// 	var aFilters = [];
		// 	if (sValue && sValue.length > 0) {
		// 		aFilters.push(new Filter("Vendor", contains, sValue));
		// 		aFilters.push(new Filter("Name", contains, sValue.toUpperCase()));
		// 		aFilters.push(new Filter("Name", contains, sValue.toLowerCase()));
		// 	}
		// 	evt.getSource().getBinding("suggestionItems").filter(aFilters); // sap.ui.model.FilterType.Application
		// },
		// handleVendorSuggestionSelected: function(evt) {
		// 	var oSelectedItem = evt.getParameter("selectedItem");
		// 	if (oSelectedItem) {
		// 		var oViewModel = this.getModel("SelectCreate");
		// 		var obj = oSelectedItem.getBindingContext().getObject();
		// 		oViewModel.setProperty("/Vendor", obj.Vendor);
		// 		oViewModel.setProperty("/Name", obj.Name);
		// 	}
		// },

		handlePOValueHelp: function(evt) {
			var sInputValue = evt.getSource().getValue();
			var oViewModel = this.getModel("SelectCreate");
			// create value help dialog
			if (!this._poValueHelpDialog) {
				this._poValueHelpDialog = this.getMSValueHelpDialog("MSPODialog");
			}
			if (oViewModel.getProperty("/Vendor") !== "") {
				Data._getMSPOData(this, oViewModel.getProperty("/Vendor"));
			}
			// open value help dialog filtered by the input value
			this._poValueHelpDialog.open(sInputValue);
		},

		_handlePOValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			// var eq = sap.ui.model.FilterOperator.EQ;
			// var oViewModel = this.getModel("SelectCreate");
			var aFilters = [];
			if (sValue && sValue.length > 0) {
				aFilters.push(new Filter("PoNum", sap.ui.model.FilterOperator.Contains, sValue));
			}
			// aFilters.push(new Filter("Vendor", eq, oViewModel.getProperty("/Vendor")));
			evt.getSource().getBinding("items").filter(aFilters); // sap.ui.model.FilterType.Application
		},

		_handlePOValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getModel("SelectCreate");
				oViewModel.setProperty("/PoNum", oSelectedItem.getTitle());
			}
		}
	});
});