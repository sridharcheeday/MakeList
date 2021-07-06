sap.ui.define([
	"ps/dewa/makelist/MakeList/controller/BaseController",
	"ps/dewa/makelist/MakeList/model/formatter",
	"sap/ui/model/json/JSONModel"
], function(BaseController, formatter, JSONModel) {
	"use strict";
	return BaseController.extend("ps.dewa.makelist.MakeList.controller.Main", {
		formatter: formatter,
		onInit: function() {
			var oViewModel = new JSONModel({
				bCreateButtonEnabled: false
			});
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
			this.getView().setModel(oViewModel, "viewModel");
		},
		
		_getVendorData: function(){
			
		},
		goToCreateView: function() {
			this.getRouter().navTo("create");
		},

		goToDisplayView: function() {
			this.getRouter().navTo("display");
		},

		goToCreateMatSelView: function() {
			this.getRouter().navTo("selectcreate");
		},

		goToDisplayMatSelView: function() {
			this.getRouter().navTo("selectdisplay");
		}

	});
});