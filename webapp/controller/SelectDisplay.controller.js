sap.ui.define([
	"ps/dewa/makelist/MakeList/controller/BaseController",
	"ps/dewa/makelist/MakeList/model/formatter",
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/m/MessageToast",
	"ps/dewa/makelist/MakeList/model/GetData"
], function(BaseController, formatter, JSONModel, Filter, FilterOperator, MessageToast, Data) {
	"use strict";
	return BaseController.extend("ps.dewa.makelist.MakeList.controller.SelectDisplay", {
		formatter: formatter,
		onInit: function() {
			this.oRouter = this.getOwnerComponent().getRouter();
			var oModel = new JSONModel({
				MSelNo: "",
				bCreateButtonEnabled: false
			});
			this.getView().setModel(oModel, "SelectDisplay");
			if (this.getOwnerComponent().getModel("Auth"))
				this.bAuthEditable = this.getOwnerComponent().getModel("Auth").getProperty("/bAuthEditable");
			oModel.setProperty("/bCreateButtonEnabled", true);
			this._getBusyDialog();
			// Add the Create page to the flp routing history
			this._addRouteHistory(this.getResourceBundle().getText("worklistViewTitle"), "/DisplayMS", true);
		},

		goToMainPage: function() {
			this.onBack();
		},
		goToItemsView: function() {
			var oViewModel = this.getView().getModel("SelectDisplay");
			var makeNo = oViewModel.getProperty("/MSelNo");
			if (makeNo === "" || makeNo === undefined || makeNo === null) {
				MessageToast.show(this.getResourceBundle().getText("MS_NO_DISPLAY")); // Please select Material Selection Document Number to display!
				return;
			}
			Data.validateMatSelect(this, "D");
			// this.getRouter().navTo("displayitems", {
			// 	MLId: makeNo,
			// 	mode: "D"
			// });
		},

		goToItemsEditView: function() {
			var oViewModel = this.getView().getModel("SelectDisplay");
			var makeNo = oViewModel.getProperty("/MSelNo");
			if (makeNo === "" || makeNo === undefined || makeNo === null) {
				MessageToast.show(this.getResourceBundle().getText("MS_PROCEED")); // Please select Material Selection Document Number to proceed!
				return;
			}
			Data.validateMatSelect(this, "E");
			// this.getRouter().navTo("displayitems", {
			// 	MLId: makeNo,
			// 	mode: "E"
			// });
		},

		navigateToDisplayItems: function(MSelNo) {
			this.getRouter().navTo("displaymsitems", {
				MSId: MSelNo
			});
		},

		navigateToEditItems: function(MSelNo) {
			this.getRouter().navTo("editmsitems", {
				MSId: MSelNo
			});
		},

		_handleMSelValueHelp: function() {
			if (!this._mselValueHelpDialog) {
				this._mselValueHelpDialog = this.getMSValueHelpDialog("MSelDialog");
			}
			var table = this._mselValueHelpDialog.getContent()[0].getItems()[1].getContent()[0];
			var aFilter = [];
			table.getBinding("items").filter(aFilter);
			// open value help dialog filtered by the input value
			this._mselValueHelpDialog.open();
		},
		_handleMSelValueHelpSearch: function() {
			var oModel = this.getView().getModel("SelectDisplay");
			var sMSel = oModel.getProperty("/sSearchMSel");
			var sVendor = oModel.getProperty("/sSearchvendor");
			var aFilter = [];
			if (sVendor) {
				aFilter.push(new Filter("Vendor", FilterOperator.Contains, sVendor)); // toUpperCase()
			}
			if (sMSel) {
				aFilter.push(new Filter("MSelNo", FilterOperator.EQ, sMSel)); // toUpperCase()
			}
			var table = this._mselValueHelpDialog.getContent()[0].getItems()[1].getContent()[0];
			table.getBinding("items").filter(aFilter); // sap.ui.model.FilterType.Application
		},

		_handleMSelValueHelpClose: function(evt) {
			this._mselValueHelpDialog.close();
		},

		_handleMSelValueHelpConfirm: function(evt) {
			var oViewModel = this.getView().getModel("SelectDisplay");
			var oSelectedItem = evt.getSource();
			if (oSelectedItem) {
				var obj = oSelectedItem.getBindingContext().getObject();
				oViewModel.setProperty("/MSelNo", obj.MSelNo.trim());
				this.toggleButton(obj);
			}
			oViewModel.refresh();
			this._mselValueHelpDialog.close();
		},

		toggleButton: function(obj) {
			var oViewModel = this.getView().getModel("SelectDisplay");
			oViewModel.setProperty("/bCreateButtonEnabled", (obj.Status === this.getResourceBundle().getText("STATUS_SUBMITTED") ||
				obj.Status === this.getResourceBundle().getText("STATUS_APPROVED") ||
				obj.Status === this.getResourceBundle().getText("STATUS_REVIEW") ||
				obj.Status === this.getResourceBundle().getText("STATUS_IN_APPROVAL") ||
				obj.Status === this.getResourceBundle().getText("STATUS_REJECTED")) === true ? false : true);
		}

	});
});