sap.ui.define([
	"ps/dewa/makelist/MakeList/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"ps/dewa/makelist/MakeList/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"ps/dewa/makelist/MakeList/model/GetData"
], function(BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageBox, Data) {
	"use strict";
	return BaseController.extend("ps.dewa.makelist.MakeList.controller.Create", {
		formatter: formatter,
		onInit: function() {
			var oViewModel;
			// Model used to manipulate control states
			oViewModel = new JSONModel({
				project: "",
				projectName: "",
				projectInputState: "None",
				poNum: "",
				// poInputState: "None",
				// wbs: "",
				// wbsText: "",
				VendorID: "",
				VendorName: "",
				vendorInputState: "None",
				bVendorEnabled: false,
				ProjectType: "",
				ProjectText: "",
				bCreateButtonEnabled: false
					// wbsInputState: "None"
			});
			this.setModel(oViewModel, "worklistView");

			// Add the Create page to the flp routing history
			this._addRouteHistory(this.getResourceBundle().getText("worklistViewTitle"), "/create", true);

			this.oProjTemplate = new sap.m.StandardListItem({
				title: "{ProjectName}",
				// description: "{ProjectIDLong}"
				description: "{ProjectID}"
			});
			// if (!this._projectValueHelpDialog) {
			// 	this._projectValueHelpDialog = sap.ui.xmlfragment("ps/dewa/makelist/MakeList/fragments/ProjectDialog", this);
			// 	this.getView().addDependent(this._projectValueHelpDialog);
			// }
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
			// this.getProjectData();
		},

		onPressDisplayList: function(oEvent) {
			// The source is the list item that got pressed
			// this._showObject(oEvent.getSource());
			if (this.validateMandats() === false) {
				return;
			}
			this.validateProject();
			// this._showObject();
		},

		validateMandats: function() {
			var oViewModel = this.getModel("worklistView");
			// var bError = false;
			// if (oViewModel.getProperty("/ProjectIDLong") === "") {
			var project = oViewModel.getProperty("/ProjectID");
			if (project === undefined || project === null || project === "") {
				oViewModel.setProperty("/projectInputState", "Error");
				// bError = true;
				MessageBox.error(this.getResourceBundle().getText("PROJ_MAND"), { // Please enter mandatory Project..
					title: "Error"
				});
				return false;
			} else {
				oViewModel.setProperty("/projectInputState", "None");
			}

			var vendor = oViewModel.getProperty("/VendorID");
			if (vendor === undefined || vendor === null || vendor === "") {
				oViewModel.setProperty("/vendorInputState", "Error");
				// bError = true;
				MessageBox.error(this.getResourceBundle().getText("VENDOR_MAND"), { // Please enter mandatory Vendor..
					title: "Error"
				});
				return false;
			} else {
				oViewModel.setProperty("/vendorInputState", "None");
			}

			return true;

			// if(oViewModel.getProperty("/poNum") === ""){
			// 	oViewModel.setProperty("/poInputState", "Error");
			// 	bError = true;
			// } else {
			// 	oViewModel.setProperty("/poInputState", "None");
			// }
			// if(oViewModel.getProperty("/wbs") === ""){
			// 	oViewModel.setProperty("/wbsInputState", "Error");
			// 	bError = true;
			// } else {
			// 	oViewModel.setProperty("/wbsInputState", "None");
			// }
			// if(bError === true){
			// MessageBox.error("");
			// }
		},

		validateProject: function() {
			Data.validateProject(this);
		},

		_showObject: function(oItem) {
			var oViewModel = this.getModel("worklistView");
			this.getRouter().navTo("items", {
				// objectId: oItem.getBindingContext().getProperty("ProjNo")
				// objectId: oViewModel.getProperty("/ProjectIDLong"),
				objectId: oViewModel.getProperty("/ProjectID"),
				vendor: oViewModel.getProperty("/VendorID"),
				ProjType: oViewModel.getProperty("/ProjectType"),
				mode: "C"
					// projType: oViewModel.getProperty("/ProjectType")
					// wbs: oViewModel.getProperty("/wbs")
			});
		},

		// goToDisplayView: function() {
		// 	this.getRouter().navTo("display", {});
		// },

		handleProjectValueHelp: function(oEvent) {
			// var sInputValue = oEvent.getSource().getValue();
			// create value help dialog
			if (!this._projectValueHelpDialog) {
				this._projectValueHelpDialog = this.getMLValueHelpDialog("ProjectDialog");
			}
			// if (!this._projectValueHelpDialog) {
			// 	this._projectValueHelpDialog = sap.ui.xmlfragment("ps/dewa/makelist/MakeList/fragments/ProjectDialog", this);
			// 	this.getView().addDependent(this._projectValueHelpDialog);
			// }
			var sValue = oEvent.getSource().getValue().trim();
			var contains = FilterOperator.Contains;
			this._projectValueHelpDialog._searchField.setValue(sValue);

			var aFilters = [];
			if (sValue && sValue.length > 0) {
				aFilters.push(new Filter("ProjectID", contains, sValue));
				aFilters.push(new Filter("ProjectID", contains, sValue));
				aFilters.push(new Filter("ProjectName", contains, sValue.toUpperCase()));
				aFilters.push(new Filter("ProjectName", contains, sValue.toLowerCase()));
			}

			// var aFilters = [new Filter("ProjectName", contains, sValue)];
			// var oViewModel = this.getModel("worklistView");
			// if(oViewModel.getProperty("/ProjectType") !== ""){
			// 	aFilters.push(new Filter("ProjectType", FilterOperator.EQ, oViewModel.getProperty("/ProjectType")));
			// }

			this._projectValueHelpDialog._oList.bindAggregation("items", {
				path: "/ProjectF4Set",
				template: this.oProjTemplate.clone(),
				filters: aFilters
			});

			// if (sInputValue !== "" && sInputValue !== " ") {
			// 	// create a filter for the binding
			// 	this._projectValueHelpDialog.getBinding("items").filter([new Filter(
			// 		"ProjectName",
			// 		sap.ui.model.FilterOperator.Contains, sInputValue
			// 	)]);
			// } else {
			// this._projectValueHelpDialog.getBinding("items").filter([]);
			// }

			// open value help dialog filtered by the input value
			this._projectValueHelpDialog.open();
		},

		_handleProjectValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value").trim();
			// var oFilter = new Filter(
			// 	"ProjectName",
			// 	FilterOperator.Contains, sValue
			// );
			// var sValue = oEvent.getSource().getValue().trim();
			var contains = FilterOperator.Contains;

			var aFilters = [];
			if (sValue && sValue.length > 0) {
				aFilters.push(new Filter("ProjectID", contains, sValue));
				aFilters.push(new Filter("ProjectID", contains, sValue));
				aFilters.push(new Filter("ProjectName", contains, sValue.toUpperCase()));
				aFilters.push(new Filter("ProjectName", contains, sValue.toLowerCase()));
			}
			// var oFilter = new Filter(
			// 	"ProjectID",
			// 	FilterOperator.Contains, sValue
			// );
			// var aFilters = [oFilter];
			// var oViewModel = this.getModel("worklistView");
			// if (oViewModel.getProperty("/ProjectType") !== "") {
			// 	aFilters.push(new Filter("ProjectType", FilterOperator.EQ, oViewModel.getProperty("/ProjectType")));
			// }
			// var oFilter1 = new Filter(
			// 	"ProjectID",
			// 	sap.ui.model.FilterOperator.Contains, sValue
			// );

			// var contains = sap.ui.model.FilterOperator.Contains;
			// var columns = ['ProjectIDLong', 'ProjectName'];
			// var filters = new sap.ui.model.Filter(columns.map(function(colName) {
			// 	return new sap.ui.model.Filter(colName, contains, sValue);
			// }), false);
			// var filters = columns.map(function(colName) {
			// 	return new sap.ui.model.Filter(colName, contains, sValue);
			// });

			evt.getSource().getBinding("items").filter(aFilters, sap.ui.model.FilterType.Application);
		},

		_handleProjectValueHelpClose: function(evt) {
			var oViewModel = this.getModel("worklistView");
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				// var input = this.byId(this.inputId);
				// input.setValue(oSelectedItem.getDescription());
				// var obj = oSelectedItem.getBindingContext("worklistView").getObject();
				// var obj = oSelectedItem.getBindingContext().getObject();
				// oViewModel.setProperty("/project", obj.ProjectID);
				oViewModel.setProperty("/projectName", oSelectedItem.getTitle());
				// oViewModel.setProperty("/wbs", obj.Wbs);
				// oViewModel.setProperty("/wbsText", obj.WbsText);
				// oViewModel.setProperty("/ProjectIDLong", oSelectedItem.getDescription());
				oViewModel.setProperty("/ProjectID", oSelectedItem.getDescription());
				// this._getWBSData(obj.ProjectID);
				// this._getVendorData(obj.ProjectID);
				// oViewModel.setProperty("/wbs", "");
				// oViewModel.setProperty("/wbsText", "");
				oViewModel.setProperty("/VendorID", "");
				oViewModel.setProperty("/VendorName", "");
				oViewModel.setProperty("/bVendorEnabled", true);
			}
			// evt.getSource().getBinding("items").filter([]);
		},

		// _getVendorData: function(sProjID) {
		// 	this._openBusyDialog("Loading Vendors..."); //this.getView().setBusy(true);
		// 	this.getOwnerComponent().getModel().read("/VendorF4Set", {
		// 		filters: [new sap.ui.model.Filter("ProjectID", sap.ui.model.FilterOperator.EQ, sProjID)],
		// 		success: jQuery.proxy(function(odata) {
		// 			this._closeBusyDialog(); //this.getView().setBusy(false);
		// 			var oViewModel = this.getModel("worklistView");
		// 			oViewModel.setProperty("/VendorF4Set", odata.results);
		// 			// oViewModel.setSizeLimit(odata.results.length);
		// 		}, this),
		// 		error: jQuery.proxy(function(err) {
		// 			this._closeBusyDialog(); //this.getView().setBusy(false);
		// 			// this.handleErrors(err);
		// 		}, this)
		// 	});
		// },

		// _getProjectTypeData: function(sProjID) {
		// 	this._openBusyDialog("Loading Project Types..."); //this.getView().setBusy(true);
		// 	this.getOwnerComponent().getModel().read("/ProjTypeF4Set", {
		// 		filters: [new sap.ui.model.Filter("ProjectID", sap.ui.model.FilterOperator.EQ, sProjID)],
		// 		success: jQuery.proxy(function(odata) {
		// 			this._closeBusyDialog(); //this.getView().setBusy(false);
		// 			var oViewModel = this.getModel("worklistView");
		// 			oViewModel.setProperty("/ProjTypeF4Set", odata.results);
		// 		}, this),
		// 		error: jQuery.proxy(function(err) {
		// 			this._closeBusyDialog(); //this.getView().setBusy(false);
		// 			// this.handleErrors(err);
		// 		}, this)
		// 	});
		// },

		// handleErrors: function(error) {
		// 	MessageBox.error(error.message, {	// JSON.parse(error.response.body).error.message.value
		// 		title: "Error"
		// 	});
		// },

		handleProjTypeValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			// create value help dialog
			if (!this._projTypeValueHelpDialog) {
				this._projTypeValueHelpDialog = this.getMLValueHelpDialog("ProjTypeDialog");
			}
			// if (!this._projTypeValueHelpDialog) {
			// 	this._projTypeValueHelpDialog = sap.ui.xmlfragment("ps/dewa/makelist/MakeList/fragments/ProjTypeDialog", this);
			// 	this.getView().addDependent(this._projTypeValueHelpDialog);
			// }
			var oViewModel = this.getModel("worklistView");
			// var project = oViewModel.getProperty("/ProjectIDLong");
			var project = oViewModel.getProperty("/ProjectID");
			if (project !== "") {
				Data._getProjectTypeData(this, project);
			}

			// open value help dialog filtered by the input value
			this._projTypeValueHelpDialog.open(sInputValue);
		},

		_handleWbsValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var contains = FilterOperator.Contains;
			var columns = ['ProjType', 'ProjTypeText'];
			var filters = new Filter(columns.map(function(colName) {
				return new sap.ui.model.Filter(colName, contains, sValue);
			}), false);
			evt.getSource().getBinding("items").filter(filters, sap.ui.model.FilterType.Application);
		},

		_handleProjTypeValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getModel("worklistView");
				oViewModel.setProperty("/ProjectType", oSelectedItem.getDescription());
				oViewModel.setProperty("/ProjectText", oSelectedItem.getTitle());
			}
		},

		handleVendorValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			// create value help dialog
			if (!this._vendorValueHelpDialog) {
				this._vendorValueHelpDialog = this.getMLValueHelpDialog("VendorDialog");
			}
			// if (!this._vendorValueHelpDialog) {
			// 	this._vendorValueHelpDialog = sap.ui.xmlfragment("ps/dewa/makelist/MakeList/fragments/VendorDialog", this);
			// 	this.getView().addDependent(this._vendorValueHelpDialog);
			// }
			var oViewModel = this.getModel("worklistView");
			// var project = oViewModel.getProperty("/project");
			var project = oViewModel.getProperty("/ProjectID");
			if (project !== "") {
				// this._getWBSData(project);
				Data._getVendorData(this, project);
			} else {
				if (oViewModel.getProperty("/ProjectID") !== "") {
					Data._getVendorData(this, oViewModel.getProperty("/ProjectID"));
				}
			}
			// open value help dialog filtered by the input value
			this._vendorValueHelpDialog.open(sInputValue);
		},

		_handleVendorValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var contains = sap.ui.model.FilterOperator.Contains;
			var columns = ['VendorID', 'VendorName'];
			var filters = new sap.ui.model.Filter(columns.map(function(colName) {
				return new sap.ui.model.Filter(colName, contains, sValue);
			}), false);
			evt.getSource().getBinding("items").filter(filters, sap.ui.model.FilterType.Application);
		},

		_handleVendorValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getModel("worklistView");
				oViewModel.setProperty("/VendorID", oSelectedItem.getDescription());
				oViewModel.setProperty("/VendorName", oSelectedItem.getTitle());
			}
		},

		handleVendorSuggest: function(evt) {
			var sValue = evt.getParameter("suggestValue");
			var oFilter = new Filter(
				"VendorName",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("suggestionItems").filter(oFilter, sap.ui.model.FilterType.Application);
		},
		handleVendorSuggestionSelected: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getModel("worklistView");
				var obj = oSelectedItem.getBindingContext("worklistView").getObject();
				oViewModel.setProperty("/VendorID", obj.Wbs);
				oViewModel.setProperty("/VendorName", obj.WbsText);
			}
		},

		onVendorChange: function(evt) {
			if (evt.getParameter("value") === "") {
				var oViewModel = this.getModel("worklistView");
				oViewModel.setProperty("/VendorID", "");
				oViewModel.setProperty("/VendorName", "");
			}
		},

		onPTypeChange: function(evt) {
			if (evt.getParameter("value") === "") {
				var oViewModel = this.getModel("worklistView");
				oViewModel.setProperty("/ProjectType", "");
				oViewModel.setProperty("/ProjectText", "");
			}
		},

		onProjectChange: function(evt) {
			var oViewModel = this.getModel("worklistView");
			if (evt.getParameter("value") === "") {
				// oViewModel.setProperty("/project", "");
				oViewModel.setProperty("/ProjectID", "");
				oViewModel.setProperty("/projectName", "");
				// oViewModel.setProperty("/wbs", "");
				// oViewModel.setProperty("/wbsText", "");
				oViewModel.setProperty("/VendorID", "");
				oViewModel.setProperty("/VendorName", "");
				oViewModel.setProperty("/bVendorEnabled", false);
			} else {
				oViewModel.setProperty("/bVendorEnabled", true);
			}
		},

		getVendorDescription: function(evt) {
			var oViewModel = this.getModel("worklistView");
			var oInput = evt.getSource();
			if (evt.getParameter("value") === "") {
				oViewModel.setProperty("/VendorID", "");
				oViewModel.setProperty("/VendorName", "");
			} else {
				// var sValue = evt.getParameter("value");
				var aFilters = [
					new Filter("ProjNo", FilterOperator.EQ, oViewModel.getProperty("/ProjectID")),
					new Filter("Vendor", FilterOperator.EQ, evt.getParameter("value")),
					new Filter("GetFor", FilterOperator.EQ, "PV") // PV - Get Vendor Description using Project ID
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

		getProjTypeDescription: function(evt) {
			var oViewModel = this.getModel("worklistView");
			var oInput = evt.getSource();
			if (evt.getParameter("value") === "") {
				oViewModel.setProperty("/ProjectType", "");
				oViewModel.setProperty("/ProjectText", "");
			} else {
				// var sValue = evt.getParameter("value");
				var aFilters = [
					new Filter("ProjNo", FilterOperator.EQ, oViewModel.getProperty("/ProjectID")),
					new Filter("ProjType", FilterOperator.EQ, evt.getParameter("value")),
					new Filter("GetFor", FilterOperator.EQ, "PT") // PT - Get Project Type Description using Project ID
				];
				var getDescr = Data.getDescription(this, this.getResourceBundle().getText("PROJTYPE_BUSY_TEXT"), "/MLMSGetDescriptionSet", aFilters);	// Fetching Project Type Description...
				getDescr.then(jQuery.proxy(function(data) {
					if (data.Type === "E") {
						MessageBox.error(data.Message);
					} else {
						oInput.setDescription(data.Description);
					}
				}, this));
			}
		},

		getProjectDescription: function(evt) {
			var oViewModel = this.getModel("worklistView");
			var oInput = evt.getSource();
			if (evt.getParameter("value") === "") {
				oViewModel.setProperty("/ProjectID", "");
				oViewModel.setProperty("/projectName", "");
				oViewModel.setProperty("/VendorID", "");
				oViewModel.setProperty("/VendorName", "");
				oViewModel.setProperty("/bVendorEnabled", false);
			} else {
				oViewModel.setProperty("/bVendorEnabled", true);
				// var sValue = evt.getParameter("value");
				var aFilters = [
					new Filter("ProjNo", FilterOperator.EQ, evt.getParameter("value")),
					new Filter("GetFor", FilterOperator.EQ, "PR") // PR - Get Project Description using Project ID
				];
				var getDescr = Data.getDescription(this, this.getResourceBundle().getText("PROJDESC_BUSY_TEXT"), "/MLMSGetDescriptionSet", aFilters);	// Fetching Project Description...
				getDescr.then(jQuery.proxy(function(data) {
					if (data.Type === "E") {
						MessageBox.error(data.Message);
					} else {
						oInput.setDescription(data.Description);
					}
				}, this));
			}
		}

	});
});