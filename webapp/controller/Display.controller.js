sap.ui.define([
	"ps/dewa/makelist/MakeList/controller/BaseController",
	"ps/dewa/makelist/MakeList/model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"ps/dewa/makelist/MakeList/model/GetData"
], function(BaseController, formatter, JSONModel, Filter, FilterOperator, MessageToast, Data) {
	"use strict";
	return BaseController.extend("ps.dewa.makelist.MakeList.controller.Display", {
		formatter: formatter,
		onInit: function() {
			this.oRouter = this.getOwnerComponent().getRouter();
			var oModel = new JSONModel({
				MakeNo: "",
				bCreateButtonEnabled: false
			});
			this.getView().setModel(oModel, "displayModel");
			if (this.getOwnerComponent().getModel("Auth"))
				this.bAuthEditable = this.getOwnerComponent().getModel("Auth").getProperty("/bAuthEditable");
			// if (this.bAuthEditable === undefined) {
			// 	var getAuth = this._getAuthorization();
			// 	getAuth.then(jQuery.proxy(function(data) {
			// 		if (this.bAuthEditable === true) {
			// 			oModel.setProperty("/bCreateButtonEnabled", true);
			// 		}
			// 	}, this));
			// } else {
			// if (this.bAuthEditable === true) {
			oModel.setProperty("/bCreateButtonEnabled", true);
			// }
			// }
			this._getBusyDialog();
			// Add the Create page to the flp routing history
			this._addRouteHistory(this.getResourceBundle().getText("worklistViewTitle"), "/DisplayML", true);
		},

		goToMainPage: function() {
			// this.getRouter().navTo("main");
			window.history.back();
		},

		// goToCreateView: function() {
		// 	this.getRouter().navTo("create", {});
		// },

		goToItemsView: function() {
			var oViewModel = this.getView().getModel("displayModel");
			var makeNo = oViewModel.getProperty("/MakeNo");
			if (makeNo === "" || makeNo === undefined || makeNo === null) {
				MessageToast.show(this.getResourceBundle().getText("ML_NO_DISPLAY")); // Please select MakeList Number to display!
				return;
			}
			Data.validateMakeList(this, "D");
			// this.navigateToItems(makeNo, "D");
		},

		goToItemsEditView: function() {
			var oViewModel = this.getView().getModel("displayModel");
			var makeNo = oViewModel.getProperty("/MakeNo");
			if (makeNo === "" || makeNo === undefined || makeNo === null) {
				MessageToast.show(this.getResourceBundle().getText("ML_PROCEED")); // Please select MakeList Number to proceed!
				return;
			}
			Data.validateMakeList(this, "E");
			// this.navigateToItems(makeNo, "E");
		},

		navigateToItems: function(makeNo, mode) {
			this.getRouter().navTo("displayitems", {
				MLId: makeNo,
				mode: mode
			});
		},

		_handleMakeNoValueHelp: function() {
			if (!this._makeListValueHelpDialog) {
				this._makeListValueHelpDialog = this.getMLValueHelpDialog("MakeListDialog");
			}
			// if (!this._makeListValueHelpDialog) {
			// 	this._makeListValueHelpDialog = sap.ui.xmlfragment("ps/dewa/makelist/MakeList/fragments/MakeListDialog", this);
			// 	this.getView().addDependent(this._makeListValueHelpDialog);
			// }
			var table = this._makeListValueHelpDialog.getContent()[0].getItems()[1].getContent()[0];
			var aFilter = [];
			table.getBinding("items").filter(aFilter);
			// open value help dialog filtered by the input value
			this._makeListValueHelpDialog.open();
		},
		_handleMakeNoValueHelpSearch: function() {
			var oModel = this.getView().getModel("displayModel");
			var sMake = oModel.getProperty("/sSearchML");
			var sProj = oModel.getProperty("/sSearchProj");
			var aFilter = [];
			if (sProj) {
				aFilter.push(new Filter("ProjNo", FilterOperator.Contains, sProj.toUpperCase()));
			}
			if (sMake) {
				aFilter.push(new Filter("MakeNo", FilterOperator.EQ, sMake.toUpperCase()));
			}
			var table = this._makeListValueHelpDialog.getContent()[0].getItems()[1].getContent()[0];
			table.getBinding("items").filter(aFilter); // sap.ui.model.FilterType.Application
		},

		_handleMakeNoValueHelpClose: function(evt) {
			// var oViewModel = this.getView().getModel("displayModel");
			// var oSelectedItem = evt.getParameter("selectedItem");
			// if (oSelectedItem) {
			// 	// var obj = oSelectedItem.getBindingContext().getObject();
			// 	// oViewModel.setProperty("/DocuNo", obj.DocuNo);
			// 	oViewModel.setProperty("/MakeNo", oSelectedItem.getTitle());
			// }
			this._makeListValueHelpDialog.close();
		},

		_handleMakeNoValueHelpConfirm: function(evt) {
			var oViewModel = this.getView().getModel("displayModel");
			var oSelectedItem = evt.getSource();
			if (oSelectedItem) {
				var obj = oSelectedItem.getBindingContext().getObject();
				oViewModel.setProperty("/MakeNo", obj.MakeNo);
				this.toggleButton(obj);
			}
			oViewModel.refresh();
			this._makeListValueHelpDialog.close();
		},

		toggleButton: function(obj) {
			var oViewModel = this.getView().getModel("displayModel");
			oViewModel.setProperty("/bCreateButtonEnabled", (obj.Status === this.getResourceBundle().getText("STATUS_SUBMITTED") ||
				obj.Status === this.getResourceBundle().getText("STATUS_APPROVED") ||
				obj.Status === this.getResourceBundle().getText("STATUS_REVIEW") ||
				obj.Status === this.getResourceBundle().getText("STATUS_IN_APPROVAL") ||
				obj.Status === this.getResourceBundle().getText("STATUS_REJECTED")) === true ? false : true);
		}

	});
});