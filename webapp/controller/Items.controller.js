/*global location*/
sap.ui.define([
	"ps/dewa/makelist/MakeList/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"ps/dewa/makelist/MakeList/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"ps/dewa/makelist/MakeList/model/GetData"
	// "sap/ui/core/util/Export",
	// "sap/ui/core/util/ExportTypeCSV"
], function(
	BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageBox, MessageToast, Data) { // Export, ExportTypeCSV
	"use strict";
	return BaseController.extend("ps.dewa.makelist.MakeList.controller.Items", {
		formatter: formatter,
		onInit: function() {
			var oViewModel = new JSONModel({
				delay: 0,
				po: "",
				poText: "",
				bVisibleFooterButtons: false,
				bVisibleSubmitButton: false,
				bVisibleSaveButton: false
					// bVisibleEditButton: false,
					// bEdit: false
			});
			this.setModel(oViewModel, "objectView");
			// var aHistory = this.getRouter()._aHistory;
			// var bSkip = false;
			// for (var i = 0; i < aHistory.length; i++) {
			// 	if (aHistory[i].hash.search("Items") !== -1) {
			// 		bSkip = true;
			// 	}
			// }
			// if (bSkip === false) {
			if (this.getOwnerComponent().getModel("Auth"))
				this.bAuthEditable = this.getOwnerComponent().getModel("Auth").getProperty("/bAuthEditable");
			// if (this.bAuthEditable === undefined) {
			// 	var getAuth = this._getAuthorization();
			// 	getAuth.then(jQuery.proxy(function(data) {
			// 		this.attachRouterMethods();
			// 	}, this));
			// } else {
			this.attachRouterMethods();
			// }

			oViewModel.setSizeLimit(10000); // Hardcoded for time being
			// this.getOwnerComponent().getModel().metadataLoaded().then(function () {
			// 		// Restore original busy indicator delay for the object view
			// 		oViewModel.setProperty("/delay", iOriginalBusyDelay);
			// 	}
			// );
			this.oTreeTable = this.getView().byId("idTreeTable");
			this._getBusyDialog();

			var oMatViewModel = new JSONModel({
				delay: 0,
				iItemCount: 0,
				maximumFilenameLength: 55,
				maximumFileSize: 1000,
				uploadEnabled: true,
				uploadButtonVisible: true,
				enableEdit: false,
				enableDelete: true,
				visibleEdit: false,
				visibleDelete: true,
				attachmentFileTypes: ["jpg", "txt", "ppt", "pptx", "doc", "xls", "pdf", "png", "jpeg", "csv", "docx", "zip", "bmp", "png", "vsd"],
				attachmentsCount: 0
			});
			this.setModel(oMatViewModel, "materialView");
		},

		// ***************************************Pattern Matched Handlers ***************************************
		// *******************************************************************************************************
		attachRouterMethods: function() {
			if (this.getRouter()._matchedRoute) {
				if (this.getRouter()._matchedRoute._aPattern[0].search("MLHeaderSet") !== -1) {
					this.getRouter().getRoute("items").attachPatternMatched(this._onObjectCreateMatched, this);
				} else if (this.getRouter()._matchedRoute._aPattern[0].search("DisplayML") !== -1) {
					this.getRouter().getRoute("displayitems").attachPatternMatched(this._onObjectDisplayMatched, this);
				} else if (this.getRouter()._matchedRoute._aPattern[0].search("EditML") !== -1) {
					this.getRouter().getRoute("edititems").attachPatternMatched(this._onObjectEditMatched, this);
				} else if (this.getRouter()._matchedRoute._aPattern[0].search("MLDisplayWiId") !== -1) {
					this.getRouter().getRoute("displaywiid").attachPatternMatched(this._onWIMatched, this);
				}
			} else {
				this.getRouter().getRoute("items").attachPatternMatched(this._onObjectCreateMatched, this);
				this.getRouter().getRoute("displayitems").attachPatternMatched(this._onObjectDisplayMatched, this);
				this.getRouter().getRoute("edititems").attachPatternMatched(this._onObjectEditMatched, this);
				this.getRouter().getRoute("displaywiid").attachPatternMatched(this._onWIMatched, this);
			}
		},

		_onObjectCreateMatched: function(oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			var oViewModel = this.getModel("objectView");
			var sObjectId = oArgs.objectId;
			var vendor = oArgs.vendor;
			var projType = oArgs.ProjType;
			oViewModel.setProperty("/project", sObjectId);
			oViewModel.setProperty("/vendor", vendor);
			oViewModel.setProperty("/projType", projType);
			oViewModel.setProperty("/mode", oArgs.mode);
			this.getModel().metadataLoaded().then(function() {
				this.getModel().setSizeLimit(10000); // Hard coded for time being
				var sObjectPath = this.getObjectPath(undefined, sObjectId, vendor, projType);
				// if (this.getView().getModel().getProperty("/" + sObjectPath) !== undefined && oEvent.getParameter("arguments").mode !== "D") {
				// 	// Refresh not required in case of Display mode and binding already exists
				// } else {
				this._bindView("/" + sObjectPath);
				// }

			}.bind(this));
			this._addRouteHistory(this.getResourceBundle().getText("worklistViewTitle"), "/MLHeaderSet/" + sObjectId + "/" + vendor + "/" + oArgs.mode + "/" + projType);

			// var oTemplate = new sap.ui.table.RowAction({
			// 	items: [
			// 		new sap.ui.table.RowActionItem({
			// 			icon: "sap-icon://navigation-right-arrow",
			// 			type: "Navigation",
			// 			press: this.gotoMaterials
			// 		})
			// 	]
			// });
			// this.getView().byId("idTable").setRowActionTemplate(oTemplate);
			// this._getPOData(sObjectId);
			// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idItemsTab"));
			// this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab"));
			this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
		},

		_onObjectEditMatched: function(oEvent) {
			var oViewModel = this.getModel("objectView");
			var oArgs = oEvent.getParameter("arguments");
			var make = oArgs.MLId;
			oViewModel.setProperty("/MakeNo", make);
			oViewModel.setProperty("/mode", oArgs.mode);
			oViewModel.setProperty("/WiId", oArgs.WiId);
			this.getModel().metadataLoaded().then(function() {
				this.getModel().setSizeLimit(10000); // Hard coded for time being
				var sObjectPath = this.getObjectPath(make);
				this._bindView("/" + sObjectPath);
			}.bind(this));
			this._addRouteHistory(this.getResourceBundle().getText("objectViewTitle"), "/EditML/" + make + "/" + oArgs.mode + "/" + oArgs.WiId);
			// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idItemsTab"));
			this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
			// this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab"));
		},

		_onObjectDisplayMatched: function(oEvent) {
			var oViewModel = this.getModel("objectView");
			var oArgs = oEvent.getParameter("arguments");
			if (oArgs.MLId) {
				oViewModel.setProperty("/MakeNo", oArgs.MLId);
			}
			if (oArgs.NavFromCreate) {
				oViewModel.setProperty("/NavFromCreate", oArgs.NavFromCreate);
			}
			oViewModel.setProperty("/mode", oArgs.mode);
			// oViewModel.setProperty("/bVisibleEditButton", oEvent.getParameter("arguments").mode === "D" ? true : false);
			// oViewModel.setProperty("/bVisibleEditButton", true);
			this.getModel().metadataLoaded().then(function() {
				this.getModel().setSizeLimit(10000); // Hard coded for time being
				var sObjectPath = this.getObjectPath(oArgs.MLId);
				this._bindView("/" + sObjectPath);
			}.bind(this));
			this._addRouteHistory(this.getResourceBundle().getText("objectViewTitle"), "/DisplayML/" + oArgs.MLId + "/" + oArgs.mode);
			// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idItemsTab"));
			this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
			// this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab"));
		},

		_onWIMatched: function(evt) {
			var oViewModel = this.getModel("objectView");
			var oArgs = evt.getParameter("arguments");
			if (oArgs.WiId) {
				oViewModel.setProperty("/WiId", oArgs.WiId);
				this.getModel().metadataLoaded().then(function() {
					Data.getMakeList(this);
				}.bind(this));
				this._addRouteHistory(this.getResourceBundle().getText("objectViewTitle"), "/MLDisplayWiId/" + oArgs.WiId);
			}
			// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idItemsTab"));
			this.getView().byId("idPageLayout").scrollToSection("idItemsTab");
		},

		// *************************************** Data Binding Functions ***************************************
		// *******************************************************************************************************
		getObjectPath: function(MakeNo, sObjectId, vendor, projType) {
			var sObjectPath;
			if (MakeNo) {
				sObjectPath = this.getModel().createKey("GetMLHeadSet", {
					MlistNo: MakeNo,
					Mode: this.getModel("objectView").getProperty("/mode"),
					Random: Math.floor(Math.random() * 1000000).toString() // Random value everytime - to distinguish view binding everytime
				});
			} else {
				sObjectPath = this.getModel().createKey("MLHeaderSet", {
					// MlistNo: "",
					ProjNo: sObjectId,
					// MlistNo: "X"
					// Vendor: (vendor === null || vendor === undefined) ? "" : vendor	// Commented as Vendor is made mandatory and key field at OData level
					Vendor: Number(vendor).toString(), // Remove zeros in case refresh is not needed when navigation happened back from Sub Items
					// WbsNumber: (wbs === null || wbs === undefined) ? "" : wbs
					ProjType: (projType === "" || projType === null || projType === undefined) ? " " : projType,
					Random: Math.floor(Math.random() * 1000000).toString() // Random value everytime - to distinguish view binding everytime
				});
			}
			return sObjectPath;
		},

		getHeaderData: function(MakeNo) {
			var oViewModel = this.getModel("objectView");
			this.getModel().metadataLoaded().then(function() {
				this.getModel().setSizeLimit(10000); // Hard coded for time being
				// var sObjectPath = this.getObjectPath(MakeNo);
				if (MakeNo) {
					var sObjectPath = this.getModel().createKey("GetMLHeadSet", {
						MlistNo: MakeNo,
						Mode: oViewModel.getProperty("/mode"),
						Random: Math.floor(Math.random() * 1000000).toString()
					});
					this._bindView("/" + sObjectPath);
				} else {
					MessageToast.show(this.getResourceBundle().getText("ML_WITEM")); // WorkItem doesn't have corresponding MakeList No
					this.onBack();
				}
			}.bind(this));
		},

		// handleErrors: function(error) {
		// 	MessageBox.error(error.message, {	// JSON.parse(error.response.body).error.message.value
		// 		title: "Error"
		// 	});
		// },

		_bindView: function(sObjectPath) {
			this._openBusyDialog(this.getResourceBundle().getText("PAGE_ELEMENTS")); // Loading the page elements...
			var oViewModel = this.getModel("objectView");
			var oDataModel = this.getModel();
			this.getView().bindElement({
				path: sObjectPath, // + "?$filter=(Mode eq 'C')",
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: jQuery.proxy(function() {
						oDataModel.metadataLoaded().then(function() {});
						Data._getItems(this);
					}, this),
					dataReceived: jQuery.proxy(function(evt) {

						// var aFilters = [];
						// if (oViewModel.getProperty("/mode") === "E" || oViewModel.getProperty("/mode") === "D") {
						// 	aFilters.push(new Filter("MlistNo", FilterOperator.EQ, oViewModel.getProperty("/MakeNo")));
						// } else {
						// 	aFilters.push(new Filter("ProjNo", FilterOperator.EQ, oViewModel.getProperty("/project")));
						// 	aFilters.push(new Filter("Vendor", FilterOperator.EQ, oViewModel.getProperty("/vendor")));
						// }
						// aFilters.push(new Filter("Mode", FilterOperator.EQ, oViewModel.getProperty("/mode")));
						// var mode = oViewModel.getProperty("/mode");
						if (evt.getParameter("data")) {
							// if (mode === "C" && evt.getParameter("data").MlistNo === "0000000000") {
							// 	MessageBox.error("MakeList is already created for this combination!", {
							// 		onClose: jQuery.proxy(function(oAction) {
							// 			if (oAction === "CLOSE") {
							// 				this.onBack();
							// 			}
							// 		}, this)
							// 	});
							// }
							oViewModel.setProperty("/MakeNo", evt.getParameter("data").MlistNo);
							this.setKeyFieldsData(evt.getParameter("data"));
							var oHeader = evt.getParameter("data");
							oViewModel.setProperty("/MLItemsSet", oHeader);
							// this.Status = oHeader.Status;
							oViewModel.setProperty("/Status", oHeader.Status);
							oViewModel.setProperty("/ProjNo", oHeader.ProjNo);
							oViewModel.setProperty("/projType", oHeader.ProjType);
							oViewModel.setProperty("/vendor", oHeader.Vendor);
							this.bModebyStatus = this.getModeByStatus(oHeader.Status);
							oViewModel.setProperty("/bModeByStatus", this.bModebyStatus);
							// oViewModel.setProperty("/ViewMode", this.setPageMode(oViewModel.getProperty("/mode"), this.bModebyStatus));
							if (oViewModel.getProperty("/mode") === "E") {
								this._setEditTabsVisibility(oHeader.Status);
							} else if (oViewModel.getProperty("/mode") === "C") {
								this._setCreateTabsVisibility();
							} else if (oViewModel.getProperty("/mode") === "D") {
								this._setDisplayTabsVisibility(oHeader.Status);
							}

							if (oViewModel.getProperty("/mode") !== "C") {
								Data.getChangeLogData(this);
							}
							// if (oViewModel.getProperty("/Attachments") === undefined) {
							Data.getAttachments(this);
							// }
							this.bindViewMode();
							this.bindMatViewMode();
						}
					}, this)
				}
				// parameters: {
				// 	"expand": "MLHeaderItems"
				// 		// "filter": "Mode eq '" + oViewModel.getProperty("/mode") + "'"
				// }
			});
		},

		_onBindingChange: function() {
			this._closeBusyDialog(); //this.getView().setBusy(false);
			var oView = this.getView(),
				// oViewModel = this.getView().getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			//var //oResourceBundle = this.getResourceBundle(),
			// oObject = oView.getBindingContext().getObject(),
			// sObjectId = oObject.ProjNo,
			// sVendor = oObject.Vendor;
			// sWbs = oObject.wbs;

			// this.onPressGo();
			// titlePress="handleTitlePress" numberUnit="{CurrencyCode}" markFlagged="true" markFavorite="true" numberState="Success"
			// number="{ parts:[{path:'Price'},{path:'CurrencyCode'}], type: 'sap.ui.model.type.Currency', formatOptions: {showMeasure: false} }"
			// showTitleSelector="true" titleSelectorPress="onPress" showMarkers="true"

		},

		// *************************************** View Property Handlers ***************************************
		// *******************************************************************************************************
		_setDisplayTabsVisibility: function(status) {
			var oViewModel = this.getView().getModel("objectView");
			oViewModel.setProperty("/isApprovalAgentsEditTabVisible", false);
			oViewModel.setProperty("/isApprovalAgentsTabVisible", false);
			oViewModel.setProperty("/isApprovalTabVisible", false);
			oViewModel.setProperty("/isApprovalLogTabVisible", false);
			// oViewModel.setProperty("/isChangeAttachmentsTabVisible", true);
			if (status === "") { // Save status
				oViewModel.setProperty("/isApprovalAgentsTabVisible", true); // Table with agents
				Data.getApproversData(this);
			} else if (status === this.getResourceBundle().getText("STATUS_IN_APPROVAL") || status === this.getResourceBundle().getText(
					"STATUS_APPROVED") || status === this.getResourceBundle().getText("STATUS_REJECTED") || status === this.getResourceBundle().getText(
					"STATUS_REVIEW")) { // In Approval, Approved, Cancelled
				oViewModel.setProperty("/isApprovalTabVisible", true);
				oViewModel.setProperty("/isApprovalLogTabVisible", true);
				Data.getApproversData(this);
				Data.getApproversLogData(this);
			} else if (status === this.getResourceBundle().getText("STATUS_CLAR_REQ")) { // Clarification Required
				oViewModel.setProperty("/isApprovalAgentsTabVisible", true); // Table with agents
				oViewModel.setProperty("/isApprovalLogTabVisible", true);
				Data.getApproversLogData(this);
			}
		},

		_setEditTabsVisibility: function(status) {
			var oViewModel = this.getView().getModel("objectView");
			oViewModel.setProperty("/isApprovalAgentsEditTabVisible", false);
			oViewModel.setProperty("/isApprovalAgentsTabVisible", false);
			oViewModel.setProperty("/isApprovalTabVisible", false);
			oViewModel.setProperty("/isApprovalLogTabVisible", false);
			// oViewModel.setProperty("/isChangeAttachmentsTabVisible", true);
			if (status === "") { // Save status
				oViewModel.setProperty("/isApprovalAgentsEditTabVisible", true); // Table with agents
				Data.getApproversData(this);
			} else if (status === this.getResourceBundle().getText("STATUS_IN_APPROVAL") || status === this.getResourceBundle().getText(
					"STATUS_APPROVED") || status === this.getResourceBundle().getText("STATUS_REJECTED")) { // In Approval, Approved, Cancelled
				oViewModel.setProperty("/isApprovalTabVisible", true);
				oViewModel.setProperty("/isApprovalLogTabVisible", true);
				Data.getApproversData(this);
				Data.getApproversLogData(this);
			} else if (status === this.getResourceBundle().getText("STATUS_CLAR_REQ")) { // Clarification Required
				oViewModel.setProperty("/isApprovalAgentsEditTabVisible", true); // Table with agents
				oViewModel.setProperty("/isApprovalLogTabVisible", true);
				Data.getApproversLogData(this);
			}
		},

		_setCreateTabsVisibility: function() {
			var oViewModel = this.getView().getModel("objectView");
			oViewModel.setProperty("/isApprovalAgentsEditTabVisible", true);
			oViewModel.setProperty("/isApprovalAgentsTabVisible", false);
			oViewModel.setProperty("/isApprovalTabVisible", false);
			oViewModel.setProperty("/isApprovalLogTabVisible", false);
			oViewModel.setProperty("/isChangeLogTabVisible", false);
			Data.getApproversData(this);
			// oViewModel.setProperty("/isChangeAttachmentsTabVisible", true);
		},

		_toggleAgentsFieldsEditability: function() {
			var oModel = this.getView().getModel("objectView");
			var array = oModel.getProperty("/ApproverAgentsListSet");
			var status = oModel.getProperty("/Status");
			if (array && array.length > 0) {
				array.forEach(function(oValue, i) {
					oValue.bAgentEditable = false;
					oValue.bAgentNameEditable = false;
					oValue.bApprCodeEditable = false;
					if (oValue.Agent === "") {
						oValue.bAgentEditable = true;
					}
					if (oValue.edit === "X") { // If edit flag is X, make it editable for Saved & Correction Required statuses
						if (status === "" || status === this.getResourceBundle().getText("STATUS_CLAR_REQ")) {
							oValue.bAgentNameEditable = true;
						}
					} else {
						if (oValue.AgentName === "") {
							oValue.bAgentNameEditable = true;
						}
					}
					if (oValue.ApproverCode === "") {
						oValue.bApprCodeEditable = true;
					}
					oValue.bSelected = false;
					if (oValue.Agent === "User") {
						oValue.bRBEnabled = true;
					} else {
						oValue.bRBEnabled = false;
					}
				});
			}
		},

		bindViewMode: function() {
			var oViewModel = this.getModel("objectView");
			var mode = oViewModel.getProperty("/mode");
			this.getViewMode(this.bModebyStatus, mode, this);
			// var bViewMode = oViewModel.getProperty("/ViewMode");
			// var status = oViewModel.getProperty("/Status");
			// Submit Button Visibility
			oViewModel.setProperty("/bVisibleSubmitButton", false);
			if (this.bModebyStatus === true) { // && (status === "" || status === "REJ")) { // Submit button visible only for Saved & Returned for correction/Rejected statuses
				// if (this.bViewMode === true) {
				// if (oViewModel.getProperty("/MakeNo") === "0000000000" ) {	// || mode === "C"
				// 	oViewModel.setProperty("/bVisibleSubmitButton", false);
				// } else {
				// if (mode === "D" || mode === "E") {
				oViewModel.setProperty("/bVisibleSubmitButton", true);
				// }
				// }
			} else {
				oViewModel.setProperty("/bVisibleSubmitButton", false);
			}
			// Edit Button Visibility
			oViewModel.setProperty("/bVisibleEditButton", false);
			if (this.bModebyStatus && mode === "D") { // bViewMode === true
				// if (this.bViewMode === true && mode === "D") {
				oViewModel.setProperty("/bVisibleEditButton", true);
			}

			// Save Button Visibility
			oViewModel.setProperty("/bVisibleSaveButton", false);
			if (this.bModebyStatus && (mode === "E" || mode === "C")) { // bViewMode === true
				oViewModel.setProperty("/bVisibleSaveButton", true);
			}

			// Attachments Editability
			oViewModel.setProperty("/bUploaderEnabled", false);
			if (this.bModebyStatus && (mode === "E" || mode === "C")) { // bViewMode === true
				oViewModel.setProperty("/bUploaderEnabled", true);
			}

			// Cancel Button Visibility
			oViewModel.setProperty("/bVisibleCancelButton", false);
			if (this.bModebyStatus === true && mode === "E") {
				// if (this.bViewMode === true && mode === "E") {
				oViewModel.setProperty("/bVisibleCancelButton", true);
			}

			// Approve & Reject Buttons Visibility
			oViewModel.setProperty("/bVisibleFooterButtons", false);
			// oViewModel.setProperty("/bVisibleSubmitButton", true);
			if (oViewModel.getProperty("/WiId")) {
				oViewModel.setProperty("/bVisibleSubmitButton", false);
				oViewModel.setProperty("/bVisibleFooterButtons", true);
			}

			// View Editability
			// oViewModel.setProperty("/bViewEditable", false);
			// if (this.bModebyStatus && (mode === "E" || mode === "C")) { // bViewMode === true
			// 	oViewModel.setProperty("/bViewEditable", true);
			// }
		},

		bindMatViewMode: function() {
			var oMatModel = this.getModel("materialView");
			var mode = this.getModel("objectView").getProperty("/mode");
			// var bViewMode = oViewModel.getProperty("/ViewMode");
			// if (mode === "D" && bViewMode === true) {
			if (mode === "D" && this.bModebyStatus === true) { // && this.bViewMode === true) {
				oMatModel.setProperty("/bEdit", true);
				oMatModel.setProperty("/bSave", false);
				// } else if ((mode === "E" || mode === "C") && bViewMode === true) {
			} else if ((mode === "E" || mode === "C") && this.bModebyStatus === true) { // && this.bViewMode === true) {
				oMatModel.setProperty("/bEdit", false);
				oMatModel.setProperty("/bSave", true);
			} else {
				oMatModel.setProperty("/bEdit", false);
				oMatModel.setProperty("/bSave", false);
			}
		},

		setKeyFieldsData: function(obj) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/project", obj.ProjNo);
			oViewModel.setProperty("/vendor", obj.Vendor);
		},

		// *************************************** Navigation Handlers ****************************************
		// *******************************************************************************************************
		gotoMaterials: function(evt) {
			this.getView().byId("idMatTable").clearSelection();
			this.getView().byId("idSubItmfileUploader").setValue("");
			var oViewModel = this.getModel("objectView");
			var mode = oViewModel.getProperty("/mode");
			// This method will also be triggered when binding changes (on clearing filters). To avoid unexpected errors, returning if not user interacted
			// if (evt.getParameter("userInteraction") !== undefined && evt.getParameter("userInteraction") === false) { // rowIndex = -1
			// 	return;
			// }
			// var obj = evt.getParameter("listItem").getBindingContext().getObject();
			var obj; // = evt.getParameter("listItem").getBindingContext("objectView").getObject();
			// if (evt.getParameter("row")) {
			// 	obj = evt.getParameter("row").getBindingContext("objectView").getObject();
			// } else {
			// 	if (evt.getParameter("rowContext")) {
			// 		obj = evt.getParameter("rowContext").getObject();
			// 	}
			// }
			obj = evt.getSource().getBindingContext("objectView").getObject();
			// if (mode !== "D" && (obj.BOMStatus).toUpperCase() === "ALL") {
			// 	MessageBox.error("Selected item would be either MakeList completed OR marked for delete!");
			// 	return;
			// }

			// var obj = evt.getParameter("row");
			if (obj.Matnr === undefined || obj.Matnr === "" || obj.Matnr === null) {
				// MessageToast.show("Material doesn't exist for selected Item!");
				return;
			}
			// Data.getSubItems(this, obj);
			var oMatModel = this.getView().getModel("materialView");
			oMatModel.setProperty("/MLItemSelected", obj);
			oMatModel.setProperty("/MLSubItemsSet", obj.ItemToSubItems.results);
			oMatModel.setProperty("/MatDesc", obj.MatDesc); //obj.ItemToSubItems.results[0].MatDesc);

			if (obj.ItemToSubItems.results[0]) {
				var itemQuantity = obj.ItemToSubItems.results[0].ItemQuantity;
				oMatModel.setProperty("/ItemQuantity", Number(itemQuantity).toFixed(2));
			}
			oMatModel.setProperty("/iItemCount", obj.ItemToSubItems.results.length);

			oMatModel.setProperty("/bAddlInfoPanelVisible", false);
			oMatModel.setProperty("/bAttachmentsPanelVisible", false);
			oMatModel.refresh();

			this.getView().byId("idNav").to(this.getView().byId("idSubItemsPage")); // "flip"
			this.bViewEdited = true;
			// return;
			// this.getRouter().navTo("material", {
			// 	// MLId: obj.MlistNo,
			// 	objectId: oViewModel.getProperty("/project"), // this.getView().getModel().getProperty(this.getView().getBindingContext().getPath()).ProjNo,
			// 	vendor: oViewModel.getProperty("/vendor"),
			// 	ProjType: oViewModel.getProperty("/projType") ? oViewModel.getProperty("/projType") : "",
			// 	// wbs: oViewModel.getProperty("/wbs"),
			// 	material: obj.Matnr,
			// 	po: obj.PoNum,
			// 	item: obj.PoItem,
			// 	mode: mode,
			// 	section: obj.Section,
			// 	subsection: obj.SubSection
			// });

		},

		_navToDisplayPage: function() {
			var oViewModel = this.getModel("objectView");
			this.getRouter().navTo("displayitems", {
				MLId: oViewModel.getProperty("/MakeNo"),
				mode: "D",
				NavFromCreate: "X"
			});
		},

		onNavBack: function() {
			var oViewModel = this.getModel("objectView");
			if (oViewModel.getProperty("/NavFromCreate") && oViewModel.getProperty("/NavFromCreate") === "X") {
				oViewModel.setProperty("/NavFromCreate", undefined);
				window.history.go(-2); // Jump twice back - as one jump takes you to create page again
			} else {
				if ((oViewModel.getProperty("/mode") === "E" || oViewModel.getProperty("/mode") === "C") && this.bViewEdited === true) {
					MessageBox.confirm(this.getResourceBundle().getText("UNSAVED_CHANGES_CONFIRM"), { // Unsaved changes will be lost. Do you want to proceed?
						title: this.getResourceBundle().getText("WARNING"), // Warning!
						onClose: jQuery.proxy(function(oAction) {
							if (oAction === this.getResourceBundle().getText("OK")) {
								this.onBack();
							}
						}, this)
					});
				} else {
					this.onBack();
				}
			}
		},

		// *************************************** Event Handlers ***************************************
		// *******************************************************************************************************
		onClearFilters: function() {
			// var oTable = this.getView().byId("idTreeTable");
			this._clearTableFilters(this.oTreeTable);
		},
		onClearSortings: function() {
			// var oTable = this.getView().byId("idTreeTable");
			this._clearTableSortings(this.oTreeTable);
		},

		// ******************************************* Tree Table Methods ***************************************//
		// ******************************************************************************************************//
		onCollapseAll: function() {
			this.oTreeTable.collapseAll();
		},

		onExpandAll: function() {
			this.oTreeTable.expandToLevel(2);
		},

		onExpandFirstLevel: function() {
			this.oTreeTable.expandToLevel(1);
		},

		_buildTreeTableData: function() {
			/*	var oViewModel = this.getModel("objectView");
				var data = oViewModel.getProperty("/MLItemsSet/MLHeaderItems");
				var aChildren = [];
				var poNew = "",
					itemNew = "",
					sectionNew = "";
				var poOld = "",
					itemOld = "",
					sectionOld = "";
				for (var i = 0; i < data.length; i++) {
					poNew = data[i].PoNum;
					itemNew = data[i].PoItem;
					sectionNew = data[i].Section;
					if (poNew !== poOld || itemNew !== itemOld) { // Add POs and Items - Hierarchy level 1
						aChildren.push(data[i]);
						poOld = data[i].PoNum;
						itemOld = data[i].PoItem;
						sectionOld = data[i].Section;
						continue;
					}
					if (sectionNew === sectionOld) { // Add Sub Sections - Hierarchy level 3
						this.addChidren(aChildren[aChildren.length - 1].children[aChildren[aChildren.length - 1].children.length - 1], data[i]);	// Send last Section - Hierarchy 2
					} else { // Add Sections - Hierarchy level 2
						this.addChidren(aChildren[aChildren.length - 1], data[i]);	// Send last PO Item - Hierarchy 1
					}
					poOld = data[i].PoNum;
					itemOld = data[i].PoItem;
					sectionOld = data[i].Section;
				}*/
			var table = this.getView().byId("idTreeTable");
			table.setBusy(true);
			var oViewModel = this.getModel("objectView");
			// var json = oViewModel.getProperty("/MLItemsSet/MLHeaderItems");
			var json = oViewModel.getProperty("/MLHeaderItems");
			var jsonString = JSON.stringify(json);
			var data = JSON.parse(jsonString);
			// var data = oViewModel.getProperty("/MLItemsSet/MLHeaderItems");
			var aChildren = [];
			var //poNew = "",
			//itemNew = "",
				sectionNew = "",
				subSectionNew = "";
			var sectionOld = "",
				subSectionOld = "";
			var obj = {};
			for (var i = 0; i < data.length; i++) {
				// poNew = data[i].PoNum;
				// itemNew = data[i].PoItem;
				sectionNew = data[i].Section;
				subSectionNew = data[i].SubSection;
				if (sectionNew !== sectionOld) { // Sections - Hierarchy level 1
					// if (sectionNew !== sectionOld || subSectionNew !== subSectionOld) { // Add POs and Items - Hierarchy level 1
					// obj = this.createObject(data[i]);
					obj = this.createEmptyObject(data[i]);
					obj.SubSection = data[i].Section;
					obj.SubSectionDesc = data[i].SectionDesc;
					aChildren.push(obj);

					obj = this.createEmptyObject(data[i]);
					obj.SubSection = data[i].SubSection;
					obj.SubSectionDesc = data[i].SubSectionDesc;
					this.addChidren(aChildren[aChildren.length - 1], obj);
					// aChildren.push(obj);

					sectionOld = data[i].Section;
					subSectionOld = data[i].SubSection;
					this.setRowStatus(data[i]);
					this.addSubChidren(aChildren[aChildren.length - 1], data[i]);
					continue;
				}
				if (subSectionNew !== subSectionOld) { // Sub Sections - Hierarchy level 2
					obj = this.createEmptyObject(data[i]);
					obj.SubSection = data[i].SubSection;
					obj.SubSectionDesc = data[i].SubSectionDesc;
					this.addChidren(aChildren[aChildren.length - 1], obj);

					sectionOld = data[i].Section;
					subSectionOld = data[i].SubSection;
					// this.addChidren(aChildren[aChildren.length - 1].children[aChildren[aChildren.length - 1].children.length - 1], data[i]);	// Send last Section - Hierarchy 2
					// *********
					// data[i].SubSection = data[i].Section;
					// data[i].SubSectionDesc = data[i].SectionDesc;
					// **********
					// aChildren.push(data[i]);
					this.setRowStatus(data[i]);
					this.addSubChidren(aChildren[aChildren.length - 1], data[i]);
				} else {
					sectionOld = data[i].Section;
					subSectionOld = data[i].SubSection;
					this.setRowStatus(data[i]);
					this.addSubChidren(aChildren[aChildren.length - 1], data[i]);
				}

				// else { // Add Sections - Hierarchy level 2
				// 	this.addChidren(aChildren[aChildren.length - 1], data[i]);	// Send last PO Item - Hierarchy 1
				// }

			}
			var oTreeData = {
				children: aChildren
			};
			oViewModel.setProperty("/makelist", oTreeData);
			table.setBusy(false);
			table.setSelectedIndex(-1);
			// this.onCollapseAll();
		},

		setRowStatus: function(obj) {
			if (obj.BOMStatus === this.getResourceBundle().getText("STATUS_ALL")) {
				obj.Status = this.getResourceBundle().getText("STATUS_SUCCESS");
			} else if (obj.BOMStatus === this.getResourceBundle().getText("STATUS_PAR")) {
				obj.Status = this.getResourceBundle().getText("STATUS_WARNING");
			} else {
				obj.Status = this.getResourceBundle().getText("STATUS_ERROR");
			}
		},

		createEmptyObject: function(obj) {
			var object = {};
			var arr = Object.keys(obj);
			for (var i = 0; i < arr.length; i++) {
				object[arr[i]] = "";
			}
			return object;
		},

		addChidren: function(parent, child) {
			if (parent.children && parent.children.length > 0)
				parent.children.push(child);
			else
				parent.children = [child];
		},
		addSubChidren: function(parent, child) {
			var section = parent.children[parent.children.length - 1];
			if (section.children && section.children.length > 0)
				section.children.push(child);
			else
				section.children = [child];
		},

		getModifiedItems: function() {
			var oViewModel = this.getModel("objectView");
			var oTreeData = oViewModel.getProperty("/makelist");
			var aSecondLevelItems = [];

			function pushItem(arr) {
				arr.forEach(function(item) {
					aSecondLevelItems.push(item);
				});
				return arr;
			}
			for (var i = 0; i < oTreeData.children.length; i++) {
				if (oTreeData.children[i].children) {
					pushItem(oTreeData.children[i].children);
				}
			}
			var aFinalItems = [];

			function pushSubItem(arr) {
				arr.forEach(function(item) {
					aFinalItems.push(item);
				});
				return arr;
			}
			for (var j = 0; j < aSecondLevelItems.length; j++) {
				if (aSecondLevelItems[j].children) {
					pushSubItem(aSecondLevelItems[j].children);
				}
			}
			var that = this;

			function isModified(subItem) {
				if (subItem.DelInd === "X" || subItem.Sat === "X" || subItem.Fat === "X") {
					that.aSubItems.push(JSON.parse(JSON.stringify(subItem)));
				}
				return 1 === 0; // Always return false to run the function for all items
			}
			var aPayloadToSave = {
				GetItems: []
			};
			aPayloadToSave.ProjNo = oViewModel.getProperty("/project");
			aPayloadToSave.ProjType = oViewModel.getProperty("/projType");
			aPayloadToSave.Vendor = oViewModel.getProperty("/vendor");
			aPayloadToSave.Mode = oViewModel.getProperty("/mode");
			aPayloadToSave.ProjDesc = oViewModel.getProperty("/MLItemsSet/ProjDesc");
			aPayloadToSave.VendorDesc = oViewModel.getProperty("/MLItemsSet/VendorDesc");
			if (oViewModel.getProperty("/mode") === "E") {
				aPayloadToSave.MlistNo = oViewModel.getProperty("/MakeNo");
			}

			for (var k = 0; k < aFinalItems.length; k++) {
				this.aSubItems = [];
				aFinalItems[k].ItemToSubItems.results.find(isModified);
				if (this.aSubItems.length > 0) {
					var jsonString = JSON.stringify(aFinalItems[k]);
					var obj = JSON.parse(jsonString);
					obj.ItemToSubItems = this.aSubItems;
					delete obj.Status;
					aPayloadToSave.GetItems.push(obj);
				}
			}

			if (aPayloadToSave.GetItems.length === 0) {
				MessageBox.error(this.getResourceBundle().getText("ML_CREATE_ONE")); // MakeList can be created with atleast one Sub Item!
				// this.getView().byId("idPageLayout").scrollToSection("idItemsTab");
				this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
				aPayloadToSave = undefined;
			}
			if (aPayloadToSave !== undefined) {
				var approvers = this._formatApproversData();
				if (approvers.length > 0) {
					aPayloadToSave.MLApproverAgents = approvers;
				} else {
					aPayloadToSave = undefined;
					MessageBox.error(this.getResourceBundle().getText("ML_APPR_NOT_MAINTAINED")); // Approvers are not maintained/configured. Please contact your administrator!
				}
			}

			// Handle Header Attachments POST
			if (aPayloadToSave) {
				aPayloadToSave.GetAttachments = [];
				var headAttachments = oViewModel.getProperty("/Attachments");
				if (headAttachments && headAttachments.length > 0) {
					this.fillAttachmentData(aPayloadToSave.GetAttachments, headAttachments, oViewModel);
				}
			}

			if (aPayloadToSave && this.getView().getModel("materialView").getProperty("/Attachments")) {
				// Validate Sub Item Attachments - Ignore if FAT/SAT/Del Indicator is not selected
				// for(var n=0; n<aPayloadToSave.GetItems.length;)
				var attachments = this.validateMaterialAttachments(aPayloadToSave.GetItems);
				// Handle Sub Item Attachments POST
				aPayloadToSave.GetMATAttachments = [];
				// var attachments = this.getView().getModel("materialView").getProperty("/Attachments");
				if (attachments && attachments.length > 0) {
					this.fillAttachmentData(aPayloadToSave.GetMATAttachments, attachments, oViewModel);
				}
			}
			return aPayloadToSave;
		},

		validateMaterialAttachments: function(items) {
			var oViewModel = this.getView().getModel("objectView");
			var oMatModel = this.getView().getModel("materialView");
			var attachments = oMatModel.getProperty("/Attachments");
			var aValidAttachs = [];

			function getValidEditAttachments(attachment) {
				var subItems;
				for (var i = 0; i < items.length; i++) {
					subItems = items[i].ItemToSubItems;
					for (var j = 0; j < subItems.length; j++) {
						if ((attachment.New === "X" || attachment.Delete === "X") && attachment.SubMaterial === subItems[j].Matnr) { // Means FAT/SAT/DelInd is selected
							aValidAttachs.push(attachment);
						}
					}
				}
				return 1 === 0; // Always return false to run the function for all items
			}

			function getValidCreateAttachments(attachment) {
				var subItems;
				for (var i = 0; i < items.length; i++) {
					subItems = items[i].ItemToSubItems;
					for (var j = 0; j < subItems.length; j++) {
						// SubMaterial: model.getProperty("/AddlInfo/Matnr"),
						if (attachment.New === "X") {
							if (attachment.PoNum === subItems[j].PoNum && //oMatModel.getProperty("/MLItemSelected/PoNum") &&
								attachment.Material === items[i].Matnr && //oMatModel.getProperty("/MLItemSelected/Matnr") &&
								attachment.SubMaterial === subItems[j].Matnr) { // Means FAT/SAT/DelInd is selected
								aValidAttachs.push(attachment);
							}
						}
						// else if (attachment.Delete === "X") {
						// 	aValidAttachs.push(attachment);
						// }
					}
				}
				return 1 === 0; // Always return false to run the function for all items
			}

			if (oViewModel.getProperty("/mode") === "E") {
				attachments.find(getValidEditAttachments);
			} else if (oViewModel.getProperty("/mode") === "C") {
				attachments.find(getValidCreateAttachments);
			}
			return aValidAttachs;
		},

		fillAttachmentData: function(GetAttachments, Attachments, oViewModel) {
			for (var n = 0; n < Attachments.length; n++) {
				if (Attachments[n].New === "X") {
					GetAttachments.push({
						MListNo: Attachments[n].MListNo,
						SubMaterial: Attachments[n].SubMaterial,
						MimeType: Attachments[n].Mimetype,
						Filedata: Attachments[n].Filedata,
						Filename: Attachments[n].Filename,
						New: Attachments[n].New,
						Delete: Attachments[n].Delete,
						Mode: oViewModel.getProperty("/mode"),
						Operation: "I"
					});
				}
				if (Attachments[n].Delete === "X") {
					GetAttachments.push({
						MListNo: Attachments[n].MListNo,
						SubMaterial: Attachments[n].SubMaterial,
						MimeType: Attachments[n].Mimetype,
						Filedata: Attachments[n].Filedata,
						Filename: Attachments[n].Filename,
						New: Attachments[n].New,
						Delete: Attachments[n].Delete,
						Mode: oViewModel.getProperty("/mode"),
						Operation: "D"
					});
				}
			}
		},

		_formatApproversData: function() {
			var oViewModel = this.getModel("objectView");
			var aApproversList = oViewModel.getProperty("/ApproverAgentsListSet");
			var approvers = [],
				object = {};
			if (aApproversList) {
				for (var l = 0; l < aApproversList.length; l++) {
					object = JSON.parse(JSON.stringify(aApproversList[l]));
					object.UserRB = '';
					object.PrjUserGrpRB = '';
					object.PartnerRB = '';
					if (object.Agent === "User") {
						object.UserRB = 'X';
						object.UserFullName = object.AgentDesc;
					} else if (object.Agent === "Partner") {
						object.PartnerRB = 'X';
						object.PartnerFuncDesc = object.AgentDesc;
					} else if (object.Agent === "User Group") {
						object.PrjUserGrpRB = 'X';
						object.PrjUsrGrpName = object.AgentDesc;
					}
					delete object["bAgentEditable"];
					delete object["bAgentNameEditable"];
					delete object["bApprCodeEditable"];
					delete object["bSelected"];
					delete object["bRBEnabled"];
					approvers.push(object);
				}
			}
			return approvers;
		},

		onAddAgentsRow: function() {
			var oModel = this.getView().getModel("objectView");
			var aAgents = oModel.getProperty("/ApproverAgentsListSet");
			var bRBSelected = true;
			bRBSelected = aAgents.every(function(row, index) {
				if (row.bSelected === true) {
					bRBSelected = false;
					var obj = JSON.parse(JSON.stringify(row));
					obj.bSelected = false;
					obj.bRBEnabled = true;
					// obj.EditAgent = true;
					obj.bAgentEditable = false;
					obj.AgentName = "";
					obj.bAgentNameEditable = true;
					obj.AgentDesc = "";
					obj.UserFullName = "";
					obj.UserName = "";
					obj.bApprCodeEditable = false;
					aAgents.splice(index + 1, 0, obj);
					return bRBSelected;
				}
			});
			if (bRBSelected === true) {
				MessageToast.show(this.getResourceBundle().getText("USR_TYPE_AGENT")); // Select any User type agent for reference!
				return;
			}
			oModel.setProperty("/ApproverAgentsListSet", aAgents);
			this.bViewEdited = true;
		},

		onRemoveAgentsRow: function(evt) {
			var oModel = this.getView().getModel("objectView");
			var aAgents = oModel.getProperty("/ApproverAgentsListSet");
			var i = 0;
			var level;
			aAgents.every(function(row, index) {
				if (row.bSelected === true) {
					level = Number(row.Level);
					return false;
				} else {
					return true;
				}
			});
			aAgents.every(function(row) {
				if (Number(row.Level) === level) {
					if (row.Agent === "User") {
						i++;
					}
				}
				return true;
			});
			if (i < 2) {
				MessageBox.error(this.getResourceBundle().getText("ENTRY_NO_DELETE")); // Entries cannot be deleted!
				return;
			}
			var bRBSelected = true;
			bRBSelected = aAgents.every(function(row, index) {
				if (row.bSelected === true) {
					bRBSelected = false;
					aAgents.splice(index, 1);
					return bRBSelected;
				} else {
					return true;
				}
			});
			if (bRBSelected === true) {
				MessageToast.show(this.getResourceBundle().getText("USR_TYPE_DEL")); // Select any User type agent to delete!
				return;
			}
			oModel.setProperty("/ApproverAgentsListSet", aAgents);
			MessageToast.show(this.getResourceBundle().getText("ENTRY_DELETED")); // Entry deleted!
			this.bViewEdited = true;
		},

		onSelectAgentRow: function(evt) {
			var sPath = evt.getSource().getBindingContext("objectView").getPath();
			var table = evt.getSource().getParent().getParent(); // Controll of table
			if (!this.oAgentsTable) {
				this.oAgentsTable = table;
			}
			var path;
			table.getRows().every(function(item, index) {
				path = item.getBindingContext("objectView").getPath();
				if (path === sPath) {
					item.getModel("objectView").setProperty(path + "/bSelected", true);
					return false;
				} else {
					item.getModel("objectView").setProperty(path + "/bSelected", false);
					return true;
				}
			});
			this.bViewEdited = true;
		},

		// ******************************************* Download Methods ***************************************//
		// ******************************************************************************************************//
		onDownload: function() {
			var oViewModel = this.getView().getModel("objectView");
			var sUrl = "";
			var sPath = "/sap/opu/odata/sap/ZPS_MLIST_ODATA_MAKE_LIST_SRV/MLDownloadSet";
			// if (oModel.getProperty("/iItemCount") === 0) {
			// 	MessageToast.show("No Items found to download!");
			// 	return;
			// }
			if (oViewModel.getProperty("/mode") === "D") {
				sUrl = sPath + "?$filter=(MlistNo eq '" +
					oViewModel.getProperty("/MakeNo") + "' and Fat eq '" +
					oViewModel.getProperty("/mode") + "')&$format=xlsx";
			} else if (oViewModel.getProperty("/mode") === "E") {
				sUrl = sPath + "?$filter=(MlistNo eq '" +
					oViewModel.getProperty("/MakeNo") + "' and Fat eq '" +
					oViewModel.getProperty("/mode") + "')&$format=xlsx";
			} else if (oViewModel.getProperty("/mode") === "C") {
				sUrl = sPath + "?$filter=(ProjNo eq '" +
					oViewModel.getProperty("/project") + "' and ProjType eq '" +
					oViewModel.getProperty("/projType") + "' and Vendor eq '" +
					oViewModel.getProperty("/vendor") + "' and Fat eq '" +
					oViewModel.getProperty("/mode") + "')&$format=xlsx";
			}
			var encodeUrl = encodeURI(sUrl);
			sap.m.URLHelper.redirect(encodeUrl, true);

		},

		// ******************************************* Action Handlers ***************************************//
		// ******************************************************************************************************//
		onSaveAlert: function() {
			if (this.getView().getModel("objectView").getProperty("/mode") === "C") {
				this.confirmAction(this.getResourceBundle().getText("ML_GENERATE"), "SAVE"); // Do you want to generate Makelist Document?
			} else {
				this.confirmAction(this.getResourceBundle().getText("CONFIRM_SAVE"), "SAVE"); // Do you want to save the changes?
			}
		},

		onSubmit: function() {
			// if (this.getView().getModel("objectView").getProperty("/mode") === "C") {
			// 	this.validate
			// }
			this.confirmAction(this.getResourceBundle().getText("ML_SUBMIT"), "SUBMIT"); // Do you want to Submit the Makelist?
		},

		onApprove: function() {
			this.confirmAction(this.getResourceBundle().getText("ML_APPR"), "APPR"); // Do you want to Approve the Makelist?
		},

		onCancelDocument: function() {
			this.confirmAction(this.getResourceBundle().getText("ML_CANCEL"), "CLOSE"); // Do you want to Cancel the Makelist Document?
		},

		onReturn: function() {
			if (!this._RejectDialog) {
				this._RejectDialog = this.getValueHelpDialog("RejectDialog");
			}
			// if (!this._RejectDialog) {
			// 	this._RejectDialog = sap.ui.xmlfragment("ps/dewa/makelist/MakeList/fragments/RejectDialog", this);
			// 	this.getView().addDependent(this._RejectDialog);
			// }
			this.getView().getModel("objectView").setProperty("/ReturnRejectDialogLabel", this.getResourceBundle().getText("RETURN_WITEM")); // Do you want to Return this Work Item to Initiator?
			this.getView().getModel("objectView").setProperty("/ReturnRejectDialogTitle", this.getResourceBundle().getText("RETURN")); // Return
			this.getView().getModel("objectView").setProperty("/bVisibleRejectDialogButtons", false);
			this.getView().getModel("objectView").setProperty("/RejectReturnComments", "");
			this._RejectDialog.open();
		},

		onReject: function() {
			// this.confirmAction("Do you want to Reject the Makelist?", "REJ");
			if (!this._RejectDialog) {
				this._RejectDialog = this.getValueHelpDialog("RejectDialog");
			}
			// if (!this._RejectDialog) {
			// 	this._RejectDialog = sap.ui.xmlfragment("ps/dewa/makelist/MakeList/fragments/RejectDialog", this);
			// 	this.getView().addDependent(this._RejectDialog);
			// }
			this.getView().getModel("objectView").setProperty("/ReturnRejectDialogLabel", this.getResourceBundle().getText("REJECT_WITEM")); // Do you want to Reject this Work Item?
			this.getView().getModel("objectView").setProperty("/ReturnRejectDialogTitle", this.getResourceBundle().getText("REJECT")); // Reject
			this.getView().getModel("objectView").setProperty("/bVisibleRejectDialogButtons", true);
			this.getView().getModel("objectView").setProperty("/RejectReturnComments", "");
			this._RejectDialog.open();
		},

		_Reject: function() {
			if (this.getView().getModel("objectView").getProperty("/RejectReturnComments") === "") {
				MessageToast.show(this.getResourceBundle().getText("REJECT_MAND")); // Reject Reason is mandatory!
				return;
			}
			var params = {
				MlistNo: this.getView().getModel("objectView").getProperty("/MakeNo"),
				// WiId: this.getView().getModel("objectView").getProperty("/WiId"),
				// Level: this.getView().getModel("objectView").getProperty("/Level"),
				Comments: this.getView().getModel("objectView").getProperty("/RejectReturnComments")
			};
			Data.executeAction(this, "/MLRejectWF", params);
			this._CancelRejectDialog();
		},

		_Return: function() {
			if (this.getView().getModel("objectView").getProperty("/RejectReturnComments") === "") {
				MessageToast.show(this.getResourceBundle().getText("RETURN_REASON_MAND")); // Reason for Returning is mandatory!
				return;
			}
			var params = {
				MlistNo: this.getView().getModel("objectView").getProperty("/MakeNo"),
				WiId: this.getView().getModel("objectView").getProperty("/WiId"),
				Level: this.getView().getModel("objectView").getProperty("/Level"),
				Comments: this.getView().getModel("objectView").getProperty("/RejectReturnComments")
			};
			Data.executeAction(this, "/MLReturnWF", params);
			this._CancelRejectDialog();
		},

		_CancelRejectDialog: function() {
			this._RejectDialog.close();
		},

		confirmAction: function(msg, action) {
			MessageBox.confirm(msg, {
				onClose: jQuery.proxy(function(oAction) {
						if (oAction === "OK") {
							var params;
							switch (action) {
								case "SUBMIT":
									params = {
										MlistNo: this.getView().getModel("objectView").getProperty("/MakeNo")
									};
									if (this.getView().getModel("objectView").getProperty("/mode") === "C") {
										Data.submitItems(this);
									} else if (this.getView().getModel("objectView").getProperty("/mode") === "D") {
										if (this.validateApprovers() !== "") {
											MessageBox.error(this.getResourceBundle().getText("MISSING_APPR"), { // Please update approver details before submit!
												onClose: jQuery.proxy(function() {
													// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idAgentsDispTab"));
													this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idAgentsDispTab").getId());
												}, this)
											});
											return;
										}
										Data.executeAction(this, "/MLSubmitWF", params, action);
									} else if (this.getView().getModel("objectView").getProperty("/mode") === "E") {
										if (this.validateApprovers() !== "") {
											MessageBox.error(this.getResourceBundle().getText("MISSING_APPR"), { // // Please update approver details before submit!
												onClose: jQuery.proxy(function() {
													// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idAgentsEditTab"));
													this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idAgentsEditTab").getId());
												}, this)
											});
											return;
										}
										var promise = Data.saveItems(this, action); // Send action to differentiate between save and submit
										promise.then(jQuery.proxy(function() {
											Data.executeAction(this, "/MLSubmitWF", params, action);
										}, this));
									}
									break;
								case "APPR":
									params = {
										MlistNo: this.getView().getModel("objectView").getProperty("/MakeNo"),
										WiId: this.getView().getModel("objectView").getProperty("/WiId"),
										Level: this.getView().getModel("objectView").getProperty("/Level")
									};
									Data.executeAction(this, "/MLApproveWF", params, action);
									break;
								case "CLOSE":
									params = {
										MlistNo: this.getView().getModel("objectView").getProperty("/MakeNo")
									};
									Data.executeAction(this, "/MLCloseWF", params);
									// case "REJ":
									// params = {
									// 	MlistNo: this.getView().getModel("objectView").getProperty("/MakeNo"),
									// 	WiId: this.getView().getModel("objectView").getProperty("/WiId"),
									// 	Comments: this.getView().getModel("objectView").getProperty("/RejectReturnComments")
									// };
									// this.executeAction(this, "/MLRejectWF", params);
									break;
								case "SAVE":
									Data.saveItems(this);
									break;
							}
						}
					},
					this)
			});
		},

		onEdit: function() {
			var oViewModel = this.getView().getModel("objectView");
			// oViewModel.setProperty("/bEdit", true);
			this.getRouter().navTo("edititems", {
				MLId: oViewModel.getProperty("/MakeNo"),
				mode: "E",
				WiId: oViewModel.getProperty("/WiId") ? oViewModel.getProperty("/WiId") : ""
			});
		},

		onCancel: function() {
			MessageBox.confirm(this.getResourceBundle().getText("CONFIRM_CANCEL_EDIT"), { // Really want to cancel editing?
				actions: [
					MessageBox.Action.YES,
					MessageBox.Action.NO
				],
				onClose: jQuery.proxy(function(oAction) {
					if (oAction === "YES") {
						this.onBack();
					}
				}, this)
			});
		},

		onRefresh: function() {
			Data._getItems(this);
		},

		// ****************************** Search Help Methods ********************************
		// **********************************************************************************************
		handleAgentsValueHelp: function(evt) {
			var model = this.getView().getModel("objectView");
			var sPath = evt.getSource().getBindingContext("objectView").getPath();
			var agentSelected = model.getProperty(sPath + "/Agent");
			if (agentSelected === "") {
				MessageToast.show(this.getResourceBundle().getText("SELECT_AGENT")); // Please select Agent Type first!
				return;
			}
			switch (agentSelected) {
				case "User":
					this.handleUsersValueHelp(evt);
					break;
				case "Partner":
					this.handlePFValueHelp(evt);
					break;
				case "User Group":
					this.handleProjUserGrpValueHelp(evt);
					break;
			}
		},

		handleUsersValueHelp: function(oEvent) {
			this.userInput = oEvent.getSource();
			this.selectedUserContextPath = this.userInput.getBindingContext("objectView").getPath();
			if (!this._usersValueHelpDialog) {
				this._usersValueHelpDialog = this.getValueHelpDialog("UsersDialog");
			}
			this._usersValueHelpDialog.open();
		},

		_handleUsersValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var contains = FilterOperator.Contains;
			var filters = [];
			filters.push(new Filter("User", contains, sValue.toUpperCase()));
			filters.push(new Filter("UserFullName", contains, sValue));
			filters.push(new Filter("UserFullName", contains, sValue.toLowerCase()));
			filters.push(new Filter("UserFullName", contains, sValue.toUpperCase()));
			evt.getSource().getBinding("items").filter(filters, sap.ui.model.FilterType.Application);
		},

		_handleUsersValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getView().getModel("objectView");
				oViewModel.setProperty(this.selectedUserContextPath + "/AgentDesc", oSelectedItem.getTitle());
				oViewModel.setProperty(this.selectedUserContextPath + "/UserName", oSelectedItem.getDescription());
				oViewModel.setProperty(this.selectedUserContextPath + "/AgentName", oSelectedItem.getDescription());
			}
			this.bViewEdited = true;
		},

		handlePFValueHelp: function(oEvent) {
			var oInput = oEvent.getSource();
			this.selectedPFContextPath = oInput.getBindingContext("objectView").getPath();
			this.pfInputId = oInput;
			if (!this._pfValueHelpDialog) {
				Data.getPartnerFunctions(this);
				this._pfValueHelpDialog = this.getValueHelpDialog("PartnerFunctionsDialog");
			}
			this._pfValueHelpDialog.open();
		},

		_handlePFValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var contains = FilterOperator.Contains;
			var columns = ['PartnerFunc', 'PartnerFuncDesc'];
			var filters = new sap.ui.model.Filter(columns.map(function(colName) {
				return new sap.ui.model.Filter(colName, contains, sValue);
			}), false);
			evt.getSource().getBinding("items").filter(filters, sap.ui.model.FilterType.Application);
		},

		_handlePFValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getView().getModel("objectView");
				oViewModel.setProperty(this.selectedPFContextPath + "/AgentDesc", oSelectedItem.getTitle());
				oViewModel.setProperty(this.selectedPFContextPath + "/PartnerFunction", oSelectedItem.getDescription());
				oViewModel.setProperty(this.selectedPFContextPath + "/AgentName", oSelectedItem.getDescription());
			}
			this.bViewEdited = true;
		},

		handleProjUserGrpValueHelp: function(oEvent) {
			var oInput = oEvent.getSource();
			this.selectedPrjUsrGrpContextPath = oInput.getBindingContext("objectView").getPath();
			this.prjUsrGrpInputId = oInput;
			if (!this._prjUsrGrpValueHelpDialog) {
				Data.getUserGroups(this);
				this._prjUsrGrpValueHelpDialog = this.getValueHelpDialog("ProjectUserGroupDialog");
			}
			this._prjUsrGrpValueHelpDialog.open();
		},

		_handleProjUserGrpValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var contains = FilterOperator.Contains;
			var columns = ['UserGroup', 'UserGroupName'];
			var filters = new sap.ui.model.Filter(columns.map(function(colName) {
				return new sap.ui.model.Filter(colName, contains, sValue);
			}), false);
			evt.getSource().getBinding("items").filter(filters, sap.ui.model.FilterType.Application);
		},

		_handleProjUserGrpValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getView().getModel("objectView");
				oViewModel.setProperty(this.selectedPrjUsrGrpContextPath + "/AgentDesc", oSelectedItem.getTitle());
				oViewModel.setProperty(this.selectedPrjUsrGrpContextPath + "/ProjectUserGrp", oSelectedItem.getDescription());
				oViewModel.setProperty(this.selectedPrjUsrGrpContextPath + "/AgentName", oSelectedItem.getDescription());
			}
			this.bViewEdited = true;
		},

		// ****************************** Approvers & Change Log Methods ********************************
		// **********************************************************************************************

		validateApprovers: function() {
			var oJSONModel = this.getView().getModel("objectView");
			var approvers = oJSONModel.getProperty("/ApproverAgentsListSet");
			var bError = "";
			for (var i = 0; i < approvers.length; i++) {
				if (approvers[i].LevelName === "") {
					bError = "X";
					break;
				}
				if (approvers[i].Agent === "" && approvers[i].AgentName === "") {
					bError = "Y";
				}
			}
			return bError;
		},

		// ******************************** Sub Items Page Methods *************************************
		// *********************************************************************************************
		onBackToItems: function() {
			// this.oTreeTable.rerender();
			this.getView().byId("idNav").to(this.getView().byId("idItemsPage")); // "flip"
		},

		// onSave: function() {
		// 	Data.saveSubItems(this);
		// },

		onSelectDelIndCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("materialView").getPath();
			var obj = oSrc.getBindingContext("materialView").getObject();
			oSrc.getModel("materialView").setProperty(sPath + "/DelInd", isSelected === true ? 'X' : '');
			oSrc.getModel("materialView").setProperty(sPath + "/Used", (obj.DelInd === "X" || obj.Fat === "X" || obj.Sat === "X") ? "X" : ""); // Attachments Enable/Disable
			oSrc.getModel("materialView").setProperty("/bUploaderEnabled", obj.Used === "X" ? true : false);
			this.updateItemLevelIndicator();
			this.bViewEdited = true;
		},

		onSelectFatCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("materialView").getPath();
			var obj = oSrc.getBindingContext("materialView").getObject();
			oSrc.getModel("materialView").setProperty(sPath + "/Fat", isSelected === true ? 'X' : '');
			oSrc.getModel("materialView").setProperty(sPath + "/Used", (obj.DelInd === "X" || obj.Fat === "X" || obj.Sat === "X") ? "X" : ""); // Attachments Enable/Disable
			oSrc.getModel("materialView").setProperty("/bUploaderEnabled", obj.Used === "X" ? true : false);
			this.updateItemLevelIndicator();
			this.bViewEdited = true;
		},

		onSelectSatCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("materialView").getPath();
			var obj = oSrc.getBindingContext("materialView").getObject();
			oSrc.getModel("materialView").setProperty(sPath + "/Sat", isSelected === true ? 'X' : '');
			oSrc.getModel("materialView").setProperty(sPath + "/Used", (obj.DelInd === "X" || obj.Fat === "X" || obj.Sat === "X") ? "X" : ""); // Attachments Enable/Disable
			oSrc.getModel("materialView").setProperty("/bUploaderEnabled", obj.Used === "X" ? true : false);
			this.updateItemLevelIndicator();
			this.bViewEdited = true;
		},

		updateItemLevelIndicator: function() {
			var model = this.getView().getModel("materialView");
			var subItems = model.getProperty("/MLSubItemsSet");
			var checked, unchecked;
			for (var i = 0; i < subItems.length; i++) {
				if (subItems[i].Fat === 'X' || subItems[i].Sat === 'X' || subItems[i].DelInd === 'X') {
					checked = true;
				} else {
					unchecked = true;
				}
			}

			if (checked === true && unchecked === true) {
				model.setProperty("/MLItemSelected/BOMStatus", this.getResourceBundle().getText("STATUS_PAR")); // Yellow Color - Partial items are added to makelist
			} else if (checked === true) {
				model.setProperty("/MLItemSelected/BOMStatus", this.getResourceBundle().getText("STATUS_ALL")); // Red Color - All subItems are added to makelist
			} else {
				model.setProperty("/MLItemSelected/BOMStatus", ""); // Green Color - No Items are added
			}
			this.setRowStatus(model.getProperty("/MLItemSelected"));
			this.getView().getModel("objectView").refresh();
			// model.refresh();
			// this.oTreeTable.updateBindings();
			// this.oTreeTable.rerender();
			// this.oTreeTable.setVisible(false);
			// setTimeout(jQuery.proxy(function() {
			// 	this.oTreeTable.setVisible(true);
			// }, this), 1000);

		},

		onClearMatFilters: function() {
			var oTable = this.getView().byId("idTable");
			this._clearTableFilters(oTable);
		},

		onClearMatSortings: function() {
			var oTable = this.getView().byId("idTable");
			this._clearTableSortings(oTable);
		},

		onDisplayAdditionalInfo: function(evt) {
			// if (evt.getParameter("userInteraction") !== undefined && evt.getParameter("userInteraction") === false) { // rowIndex = -1
			// 	return;
			// }
			var oSelectedObj, model = this.getView().getModel("materialView");
			// if (evt.getParameter("row")) {
			// 	oSelectedObj = evt.getParameter("row").getBindingContext("materialView").getObject();
			// } else {
			// 	if (evt.getParameter("rowContext")) {
			// 		oSelectedObj = evt.getParameter("rowContext").getObject();
			// 	}
			// }
			oSelectedObj = evt.getSource().getBindingContext("materialView").getObject();
			var mode = this.getModel("objectView").getProperty("/mode");
			model.setProperty("/AddlInfo", oSelectedObj);
			model.setProperty("/bAddlInfoPanelVisible", true);
			model.setProperty("/bAttachmentsPanelVisible", true);
			if (this.bModebyStatus && (mode === "E" || mode === "C") && oSelectedObj.Used === "X") {
				model.setProperty("/bUploaderEnabled", true);
			} else {
				model.setProperty("/bUploaderEnabled", false);
			}
			// this.getAttachments(oSelectedObj);
			Data.getMaterialAttachments(this, oSelectedObj);
		},

		onChangeBOMQty: function(evt) {
			evt.getSource().getModel("materialView").refresh();
			this.bViewEdited = true;
		},

		// ******************************Start of Material Attachments Methods*************************************
		// ********************************************************************************************************
		onUpload: function() {
			var oFileUploader = this.getView().byId("idSubItmfileUploader");
			var oDomRef = oFileUploader.getFocusDomRef();
			var file = oDomRef.files[0];
			if (oDomRef.files.length === 0) {
				MessageToast.show(this.getResourceBundle().getText("BROWSE_ATT")); // Please click on Browse button to select the file/s
				return;
			}
			if (file.size > "3145728") {
				var oVar = this.getResourceBundle().getText("ERR_FILESIZE_EXCEED"); // "Please note that the maximum attachment size should not exceed 3 MB." +
				// " You are advised to use Adobe Acrobat to compress the attachment size and attach again." +
				// " For further assistance, please contact IT Service Desk on 51555.";
				oFileUploader.setValueState("Error");
				MessageBox.error(oVar);
				oFileUploader.setValue("");
				return;
			} else {
				oFileUploader.setValueState("None");
			}

			// global variables
			var fileName = file.name,
				fileType = file.type,
				fileSize = file.size,
				fileIcon;
			var oReader = new FileReader();
			var model = this.getView().getModel("materialView");
			var data = model.getProperty("/Attachments");
			oReader.onload = jQuery.proxy(function(evt) {
				var vContent = evt.currentTarget.result.replace("data:" + file.type + ";base64,", "");
				if (file.type === "application/pdf") {
					fileIcon = this.getResourceBundle().getText("ICON_PDF"); //"sap-icon://pdf-attachment";
				} else if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
					fileIcon = this.getResourceBundle().getText("ICON_CARD"); // "sap-icon://card";
				} else if (file.type === "application/msword" ||
					file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
					fileIcon = this.getResourceBundle().getText("ICON_DOC"); // "sap-icon://doc-attachment";
				} else {
					fileIcon = this.getResourceBundle().getText("ICON_ATTACHMENT"); // "sap-icon://attachment";
				}
				var ofileSizeKB = fileSize / 1024;
				var ofileSizeMB = ofileSizeKB / 1024;
				var ofileSizeTxt;
				if (ofileSizeMB < 1) {
					var ofileKB2dec = ofileSizeKB.toFixed(2); // round up to 2 decimals
					ofileSizeTxt = ofileKB2dec + " KB";
				} else {
					var ofileMB2dec = ofileSizeMB.toFixed(2); // round up to 2 decimals
					ofileSizeTxt = ofileMB2dec + " MB";
				}

				var fileRow = {
					MListNo: this.getModel("objectView").getProperty("/MakeNo") === undefined ? "0000000000" : this.getModel("objectView").getProperty(
						"/MakeNo"),
					PoNum: model.getProperty("/MLItemSelected/PoNum"),
					Material: model.getProperty("/MLItemSelected/Matnr"),
					SubMaterial: model.getProperty("/AddlInfo/Matnr"),
					Mimetype: fileType,
					Filename: fileName,
					Filedata: vContent,
					FileSizeTxt: ofileSizeTxt,
					FileIcon: fileIcon,
					New: "X",
					Delete: ""
				};
				if (data.length > 0) {
					data.push(fileRow);
				} else {
					data = [fileRow];
				}
				model.setProperty("/Attachments", data);
				this.bViewEdited = true;
				// Data.postMaterialAttachmentFileToBackend(this, fileRow);
				oFileUploader.setValue("");
			}, this);
			oReader.readAsDataURL(file);
		},

		onHeaderUpload: function() {
			var oFileUploader = this.getView().byId("fileUploader");
			var oDomRef = oFileUploader.getFocusDomRef();
			var file = oDomRef.files[0];
			if (oDomRef.files.length === 0) {
				MessageToast.show(this.getResourceBundle().getText("BROWSE_ATT")); // Please click on Browse button to select the file/s
				return;
			}
			if (file.size > "3145728") {
				var oVar = this.getResourceBundle().getText("ERR_FILESIZE_EXCEED"); //"Please note that the maximum attachment size should not exceed 3 MB." +
				// " You are advised to use Adobe Acrobat to compress the attachment size and attach again." +
				// " For further assistance, please contact IT Service Desk on 51555.";
				oFileUploader.setValueState("Error");
				MessageBox.error(oVar);
				oFileUploader.setValue("");
				return;
			} else {
				oFileUploader.setValueState("None");
			}

			// global variables
			var fileName = file.name,
				fileType = file.type,
				fileSize = file.size,
				fileIcon;
			var oReader = new FileReader();
			var model = this.getView().getModel("objectView");
			var data = model.getProperty("/Attachments");
			oReader.onload = jQuery.proxy(function(evt) {
				var vContent = evt.currentTarget.result.replace("data:" + file.type + ";base64,", "");
				if (file.type === "application/pdf") {
					fileIcon = this.getResourceBundle().getText("ICON_PDF"); //"sap-icon://pdf-attachment";
				} else if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
					fileIcon = this.getResourceBundle().getText("ICON_CARD"); //"sap-icon://card";
				} else if (file.type === "application/msword" ||
					file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
					fileIcon = this.getResourceBundle().getText("ICON_DOC"); //"sap-icon://doc-attachment";
				} else {
					fileIcon = this.getResourceBundle().getText("ICON_ATTACHMENT"); //"sap-icon://attachment";
				}
				var ofileSizeKB = fileSize / 1024;
				var ofileSizeMB = ofileSizeKB / 1024;
				var ofileSizeTxt;
				if (ofileSizeMB < 1) {
					var ofileKB2dec = ofileSizeKB.toFixed(2); // round up to 2 decimals
					ofileSizeTxt = ofileKB2dec + " KB";
				} else {
					var ofileMB2dec = ofileSizeMB.toFixed(2); // round up to 2 decimals
					ofileSizeTxt = ofileMB2dec + " MB";
				}

				var fileRow = {
					MListNo: model.getProperty("/MakeNo"),
					// PoNum: model.getProperty("/MLItemSelected/PoNum"),
					// Material: model.getProperty("/MLItemSelected/Matnr"),
					// SubMaterial: model.getProperty("/AddlInfo/Matnr"),
					Mimetype: fileType,
					Filename: fileName,
					Filedata: vContent,
					FileSizeTxt: ofileSizeTxt,
					FileIcon: fileIcon,
					New: "X",
					Delete: ""
				};
				if (data.length > 0) {
					data.push(fileRow);
				} else {
					data = [fileRow];
				}
				model.setProperty("/Attachments", data);
				this.bViewEdited = true;
				// Data.postMaterialAttachmentFileToBackend(this, fileRow);
				oFileUploader.setValue("");
			}, this);
			oReader.readAsDataURL(file);
		},

		onMatAttchListDelete: function(oEvent) {
			var model = this.getView().getModel("materialView");
			var data = model.getProperty("/Attachments");
			var sPath = oEvent.getParameter("listItem").getBindingContext("materialView").sPath;
			var index = sPath.split("/")[sPath.split("/").length - 1];
			// Removing the selected list item from the model based on the index
			var oData = oEvent.getParameter("listItem").getBindingContext("materialView").getObject();
			if (oData.New === "X") {
				data.splice(index, 1);
				model.setProperty("/Attachments", data);
			} else {
				oData.Delete = "X";
			}
			model.refresh();
			this.bViewEdited = true;
		},

		onAttchListDelete: function(oEvent) {
			var model = this.getView().getModel("objectView");
			var data = model.getProperty("/Attachments");
			var sPath = oEvent.getParameter("listItem").getBindingContext("objectView").sPath;
			var index = sPath.split("/")[sPath.split("/").length - 1];
			// Removing the selected list item from the model based on the index
			var oData = oEvent.getParameter("listItem").getBindingContext("objectView").getObject();
			if (oData.New === "X") {
				data.splice(index, 1);
				model.setProperty("/Attachments", data);
			} else {
				oData.Delete = "X";
			}
			model.refresh();
			this.bViewEdited = true;
		},
		/*onListDelete: function(oEvent) {
			// calculating the index of the selected list item
			var model = this.getView().getModel("materialView");
			var data = model.getProperty("/Attachments");
			var sPath = oEvent.getParameter("listItem").getBindingContext("materialView").sPath;
			var index = sPath.split("/")[sPath.split("/").length - 1];

			// Removing the selected list item from the model based on the index
			var oData = oEvent.getParameter("listItem").getBindingContext("materialView").getObject();
			// if (typeof oData.FileId !== "undefined" && oData.FileId !== null) {
			if (typeof oData.Material !== "undefined" && oData.Material !== null) {
				var file = {
					"SubMaterial": oData.Material,
					"Operation": 'D',
					"Counter": oData.Counter
				};
				this._openBusyDialog("Deleting the attachment..."); //this.getView().setBusy(true);
				this.getView().getModel().create("/MLAttachmentsSet", file, {
					success: jQuery.proxy(function(resp) {
						this._closeBusyDialog(); //this.getView().setBusy(false);
						MessageToast.show("Attachment Deleted Successfully!");
						var oSelectedObj = model.getProperty("/AddlInfo");
						Data.getMaterialAttachments(this, oSelectedObj);
					}, this),
					error: jQuery.proxy(function(oErr) {
						this._closeBusyDialog(); //this.getView().setBusy(false);
					}, this)
				});
			} else {
				data.splice(index, 1);
				model.setProperty("/Attachments", data);
			}
		},*/

		onListItemPressed: function(evt) {
			var oObj = evt.getSource().getBindingContext("materialView").getObject(); // .SubMaterial;
			this.onDisplayAttachment(oObj);
		},

		onHeadAttachListItemPressed: function(evt) {
			var oObj = evt.getSource().getBindingContext("objectView").getObject();
			this.onDisplayAttachment(oObj);
		},

		onHeaderAttachTableUpdateFinished: function(evt) {
			var oList = evt.getSource();
			var oItems = oList.getItems();
			var oDeleteControl;
			var mode = this.getView().getModel("objectView").getProperty("/mode");
			for (var i = 0; i < oItems.length; i++) {
				oDeleteControl = oItems[i].getDeleteControl();
				if (this.bModebyStatus && (mode === "E" || mode === "C")) {
					// oDeleteControl.setEnabled(true);
					oDeleteControl.setVisible(true);
				} else {
					// oDeleteControl.setEnabled(false);
					oDeleteControl.setVisible(false);
				}
			}
		},

		onSubItemsAttachTableUpdateFinished: function(evt) {
			var oList = evt.getSource();
			var oItems = oList.getItems();
			var obj, oDeleteControl;
			var mode = this.getView().getModel("objectView").getProperty("/mode");
			var uploaderEnabled = this.getView().getModel("materialView").getProperty("/bUploaderEnabled");
			for (var i = 0; i < oItems.length; i++) {
				oDeleteControl = oItems[i].getDeleteControl();
				obj = oItems[i].getBindingContext("materialView").getObject();
				if (obj.BOMAttach === "X") {
					// oDeleteControl.setEnabled(false);
					oDeleteControl.setVisible(false);
				} else {
					if (this.bModebyStatus && (mode === "E" || mode === "C") && uploaderEnabled === true) {
						// oDeleteControl.setEnabled(true);
						oDeleteControl.setVisible(true);
					} else {
						// oDeleteControl.setEnabled(false);
						oDeleteControl.setVisible(false);
					}
				}
			}
		},

		onDisplayAttachment: function(obj) {
			// var model = this.getView().getModel("objectView");
			// var sSource = this.getView().getModel().sServiceUrl + this.getView().getModel().createKey("/MLAttachmentsSet", {
			// 	MListNo: model.getProperty("/MakeNo"),
			// 	ProjNo: "X",
			// 	// PoNum: 
			// 	ProjType: "X",
			// 	Vendor: "1",
			// 	SubMaterial: obj.Material ? obj.Material : "X",
			// 	Counter: obj.Counter ? obj.Counter : "1"
			// }) + "/$value";
			var sUrl = this.getDocDownloadURL("/DisplayAttachmentSet", obj);
			// if (sap.m.PDFViewer) {
			// 	this.pdfViewer = new sap.m.PDFViewer();
			// 	this.getView().addDependent(this.pdfViewer);
			// }
			// if (this.pdfViewer) {
			// 	this.pdfViewer.setSource(sSource);
			// 	this.pdfViewer.setTitle(obj.MatDesc);
			// 	this.pdfViewer.open();
			// } else {
			//	// window.open(sSource, obj.MatDesc);
			// var deviceModel = this.getModel("device");
			// if (deviceModel.getProperty("/system/desktop") === true)
			sap.m.URLHelper.redirect(sUrl, true);
			// else
			// sap.m.URLHelper.redirect(sUrl, true);
			// }
		},

		// onBeforeUploadStarts: function(oEvent) {
		// 	var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
		// 		name: "slug",
		// 		value: oEvent.getParameter("fileName")
		// 	});
		// 	oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
		// 	var oModel = this.getView().getModel();
		// 	oModel.refreshSecurityToken();
		// 	var oHeaders = oModel.oHeaders;
		// 	var sToken = oHeaders['x-csrf-token'];
		// 	var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
		// 		name: "x-csrf-token",
		// 		value: sToken
		// 	});
		// 	oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
		// },

		// onUploadComplete: function(oEvent) {
		// 	// this.getView().getModel().refresh();
		// },

		// onAttachmentChange: function(evt) {
		// 	var model = this.getView().getModel("materialView");
		// 	var files = evt.getParameter("files");
		// 	for (var i = 0; i < files.length; i++) {
		// 		files[0].PoNum = model.getProperty("/poNum");
		// 		files[0].Material = model.getProperty("/material");
		// 		files[0].SubMaterial = model.getProperty("/AddlInfo/Matnr");
		// 	}
		// },

		onUploadListUpdateStarted: function(evt) {
			if (evt.getParameter("reason") === "Change" && evt.getParameter("total") !== 0) {
				var objectModel = this.getModel("objectView");
				var model = this.getView().getModel("materialView");
				var makeno = objectModel.getProperty("/MakeNo");
				var aFilters = [];
				if (makeno === undefined || makeno === null || makeno === "0000000000") {
					if (model.getProperty("/MLItemSelected/PoNum")) {
						aFilters.push(new Filter("PoNum", FilterOperator.EQ, model.getProperty("/MLItemSelected/PoNum")));
					}
					if (model.getProperty("/MLItemSelected/Matnr")) {
						aFilters.push(new Filter("Material", FilterOperator.EQ, model.getProperty("/MLItemSelected/Matnr")));
					}
					if (model.getProperty("/AddlInfo/Matnr")) {
						aFilters.push(new Filter("SubMaterial", FilterOperator.EQ, model.getProperty("/AddlInfo/Matnr")));
					}
				} else {
					// aFilters.push(new Filter("MListNo", FilterOperator.EQ, makeno));
					if (model.getProperty("/AddlInfo/Matnr")) {
						aFilters.push(new Filter("Material", FilterOperator.EQ, model.getProperty("/AddlInfo/Matnr")));
					}
				}

				aFilters.push(new Filter("Delete", FilterOperator.NE, "X"));
				evt.getSource().getBinding("items").filter(aFilters);
			}
		},

		processSubItemAttachListData: function(list) {
			var model = this.getView().getModel("materialView");
			var objectModel = this.getModel("objectView");
			if (objectModel.getProperty("/mode") === "C") {
				for (var i = 0; i < list.length; i++) {
					list[i].PoNum = model.getProperty("/poNum");
					list[i].Material = model.getProperty("/material");
					list[i].SubMaterial = model.getProperty("/AddlInfo/Matnr");
				}
			}
			var attachList = model.getProperty("/Attachments");
			if (attachList) {
				for (var j = 0; j < attachList.length; j++) {
					if (attachList[j].New === "X" || attachList[j].Delete === "X") {
						list.push(attachList[j]);
					}
				}
			}
		}
	});
});