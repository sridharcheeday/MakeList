/*global location*/
sap.ui.define([
	"ps/dewa/makelist/MakeList/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	// "sap/ui/core/routing/History",
	"ps/dewa/makelist/MakeList/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"ps/dewa/makelist/MakeList/model/GetData"
	// "sap/ui/core/util/Export",
	// "sap/ui/core/util/ExportTypeCSV"
], function(
	BaseController, JSONModel, formatter, Filter, FilterOperator, MessageBox, MessageToast, Data) { // History, Export, ExportTypeCSV
	"use strict";
	return BaseController.extend("ps.dewa.makelist.MakeList.controller.MatSelItems", {
		formatter: formatter,
		onInit: function() {
			var oViewModel = new JSONModel({
				delay: 0,
				po: "",
				poText: "",
				bVisibleFooterButtons: false,
				bVisibleSubmitButton: false,
				bVisibleSaveButton: false,
				bVisibleNextLevelButton: false,
				iItemCount: 0
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
			if (this.getOwnerComponent().getModel("Auth")) {
				this.bAuthEditable = this.getOwnerComponent().getModel("Auth").getProperty("/bAuthEditable");
			}
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
			this.oTreeTable = this.getView().byId("idTable");
			this._getBusyDialog();

			// var oMatViewModel = new JSONModel({
			// 	delay: 0,
			// 	iItemCount: 0,
			// 	maximumFilenameLength: 55,
			// 	maximumFileSize: 1000,
			// 	uploadEnabled: true,
			// 	uploadButtonVisible: true,
			// 	enableEdit: false,
			// 	enableDelete: true,
			// 	visibleEdit: false,
			// 	visibleDelete: true,
			// 	attachmentFileTypes: ["jpg", "txt", "ppt", "pptx", "doc", "xls", "pdf", "png", "jpeg", "csv", "docx", "zip", "bmp", "png", "vsd"],
			// 	attachmentsCount: 0
			// 		// ListSeparators.All,
			// 		// "showSeparators": ListSeparators.All,
			// });
			// this.setModel(oMatViewModel, "materialView");
		},

		// ***************************************Pattern Matched Handlers ***************************************
		// *******************************************************************************************************
		attachRouterMethods: function() {
			if (this.getRouter()._matchedRoute) {
				if (this.getRouter()._matchedRoute._aPattern[0].search("CreateMS") !== -1) {
					this.getRouter().getRoute("createmsitems").attachPatternMatched(this._onObjectCreateMatched, this);
				} else if (this.getRouter()._matchedRoute._aPattern[0].search("DisplayMS") !== -1) {
					this.getRouter().getRoute("displaymsitems").attachPatternMatched(this._onObjectDisplayMatched, this);
				} else if (this.getRouter()._matchedRoute._aPattern[0].search("EditMS") !== -1) {
					this.getRouter().getRoute("editmsitems").attachPatternMatched(this._onObjectEditMatched, this);
				} else if (this.getRouter()._matchedRoute._aPattern[0].search("MSDisplayWiId") !== -1) {
					this.getRouter().getRoute("displaymswiid").attachPatternMatched(this._onWIMatched, this);
				}
			} else {
				this.getRouter().getRoute("createmsitems").attachPatternMatched(this._onObjectCreateMatched, this);
				this.getRouter().getRoute("displaymsitems").attachPatternMatched(this._onObjectDisplayMatched, this);
				this.getRouter().getRoute("editmsitems").attachPatternMatched(this._onObjectEditMatched, this);
				this.getRouter().getRoute("displaymswiid").attachPatternMatched(this._onWIMatched, this);
			}
		},

		_onObjectCreateMatched: function(oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			var oViewModel = this.getModel("objectView");
			var po = oArgs.ponum;
			var vendor = oArgs.vendor;
			oViewModel.setProperty("/po", po);
			oViewModel.setProperty("/vendor", vendor);
			oViewModel.setProperty("/mode", "C"); // oArgs.mode
			this.getModel().metadataLoaded().then(function() {
				this.getModel().setSizeLimit(10000); // Hard coded for time being
				var sObjectPath = this.getObjectPath(undefined, po, vendor);
				// if (this.getView().getModel().getProperty("/" + sObjectPath) !== undefined && oEvent.getParameter("arguments").mode !== "D") {
				// 	// Refresh not required in case of Display mode and binding already exists
				// } else {
				this._bindView("/" + sObjectPath);
				// }
			}.bind(this));
			this._addRouteHistory(this.getResourceBundle().getText("MSItemsCreateViewTitle"), "/CreateMS/" + po + "/" + vendor + "/" + "C"); // oArgs.mode
			// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idItemsTab"));
			this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
		},

		_onObjectEditMatched: function(oEvent) {
			var oViewModel = this.getModel("objectView");
			var oArgs = oEvent.getParameter("arguments");
			var MSId = oArgs.MSId;
			oViewModel.setProperty("/MSelNo", MSId);
			oViewModel.setProperty("/mode", "E"); // oArgs.mode
			oViewModel.setProperty("/WiId", oArgs.WiId);
			this.getModel().metadataLoaded().then(function() {
				this.getModel().setSizeLimit(10000); // Hard coded for time being
				var sObjectPath = this.getObjectPath(MSId);
				this._bindView("/" + sObjectPath);
			}.bind(this));
			this._addRouteHistory(this.getResourceBundle().getText("MSItemsEditViewTitle"), "/EditMS/" + MSId + "/" + "E" + "/" + oArgs.WiId); // oArgs.mode
			// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idItemsTab"));
			this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
		},

		_onObjectDisplayMatched: function(oEvent) {
			var oViewModel = this.getModel("objectView");
			var oArgs = oEvent.getParameter("arguments");
			if (oArgs.MSId) {
				oViewModel.setProperty("/MSelNo", oArgs.MSId);
			}
			if (oArgs.NavFromCreate) {
				oViewModel.setProperty("/NavFromCreate", oArgs.NavFromCreate);
			}
			oViewModel.setProperty("/mode", "D"); // oArgs.mode
			this.getModel().metadataLoaded().then(function() {
				this.getModel().setSizeLimit(10000); // Hard coded for time being
				var sObjectPath = this.getObjectPath(oArgs.MSId);
				this._bindView("/" + sObjectPath);
			}.bind(this));
			this._addRouteHistory(this.getResourceBundle().getText("MSItemsDisplayViewTitle"), "/DisplayMS/" + oArgs.MSId + "/" + "D"); // oArgs.mode
			// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idItemsTab"));
			this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
		},

		_onWIMatched: function(evt) {
			var oViewModel = this.getModel("objectView");
			var oArgs = evt.getParameter("arguments");
			if (oArgs.WiId) {
				oViewModel.setProperty("/WiId", oArgs.WiId);
				this.getModel().metadataLoaded().then(function() {
					Data.getMaterialSelDoc(this);
				}.bind(this));
				this._addRouteHistory(this.getResourceBundle().getText("objectViewTitle"), "/MSDisplayWiId/" + oArgs.WiId);
			}
			// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idItemsTab"));
			this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
		},

		// *************************************** Data Binding Functions ***************************************
		// *******************************************************************************************************
		getObjectPath: function(MSelNo, po, vendor) {
			var sObjectPath;
			if (MSelNo) {
				sObjectPath = this.getModel().createKey("GetMSHeadSet", {
					MSelNo: MSelNo,
					Mode: this.getModel("objectView").getProperty("/mode"),
					Random: Math.floor(Math.random() * 1000000).toString() // Random value everytime - to distinguish view binding everytime
				});
			} else {
				sObjectPath = this.getModel().createKey("MSHeaderSet", {
					PoNum: po,
					Vendor: Number(vendor).toString(), // Remove zeros in case refresh is not needed when navigation happened back from Sub Items
					Random: Math.floor(Math.random() * 1000000).toString() // Random value everytime - to distinguish view binding everytime
				});
			}
			return sObjectPath;
		},

		getHeaderData: function(MSelNo) {
			var oViewModel = this.getModel("objectView");
			this.getModel().metadataLoaded().then(function() {
				this.getModel().setSizeLimit(50000); // Hard coded for time being
				// var sObjectPath = this.getObjectPath(MakeNo);
				if (MSelNo) {
					var sObjectPath = this.getModel().createKey("GetMSHeadSet", {
						MSelNo: MSelNo,
						Mode: oViewModel.getProperty("/mode"),
						Random: Math.floor(Math.random() * 1000000).toString()
					});
					this._bindView("/" + sObjectPath);
				} else {
					MessageToast.show(this.getResourceBundle().getText("MS_WITEM")); // WorkItem doesn't have corresponding Material Selection No
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
			this._openBusyDialog(this.getResourceBundle().getText("PAGE_ELEMENTS"));
			var oViewModel = this.getModel("objectView");
			// var oDataModel = this.getModel();
			this.getView().bindElement({
				path: sObjectPath, // + "?$filter=(Mode eq 'C')",
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: jQuery.proxy(function() {
						// oDataModel.metadataLoaded().then(function() {});
						// Data._getMSItems(this);
					}, this),
					dataReceived: jQuery.proxy(function(evt) {
						if (evt.getParameter("data")) {
							var mselno = evt.getParameter("data").MSelNo;
							oViewModel.setProperty("/MSelNo", mselno === '' ? '0000000000' : mselno);
							this.setKeyFieldsData(evt.getParameter("data"));
							var oHeader = evt.getParameter("data");
							oViewModel.setProperty("/MSHeadSet", oHeader);
							this.processAttachListElements(oHeader.MSHeaderAttach);
							oViewModel.setProperty("/Attachments", oHeader.MSHeaderAttach);
							if (oHeader.MSHeaderItems && oHeader.MSHeaderItems.length < 1) {
								MessageBox.error(this.getResourceBundle().getText("NO_PO_FOUND"), { // No PO Items found!
									onClose: jQuery.proxy(function(oAction) {
										this.onNavBack();
									}, this)
								});
								return;
							}
							oViewModel.setProperty("/selectAllFAT", true);
							oViewModel.setProperty("/selectAllSAT", true);
							oViewModel.setProperty("/selectFATPressed", true);
							oViewModel.setProperty("/selectSATPressed", true);
							oViewModel.setProperty("/Status", oHeader.Status);
							oViewModel.setProperty("/po", oHeader.PoNum);
							oViewModel.setProperty("/vendor", oHeader.Vendor);
							this.bModebyStatus = this.getModeByStatus(oHeader.Status);
							oViewModel.setProperty("/bModeByStatus", this.bModebyStatus);
							oViewModel.setProperty("/iItemCount", oHeader.MSHeaderItems.length);
							if (oViewModel.getProperty("/mode") === "E") {
								this._setEditTabsVisibility(oHeader.Status);
							} else if (oViewModel.getProperty("/mode") === "C") {
								this._setCreateTabsVisibility();
							} else if (oViewModel.getProperty("/mode") === "D") {
								this._setDisplayTabsVisibility(oHeader.Status);
							}

							if (oViewModel.getProperty("/mode") !== "C") {
								Data.getMSChangeLogData(this);
							}
							// if (oViewModel.getProperty("/Attachments") === undefined) {
							// Data.getAttachments(this);
							// }

							this.bindViewMode();
							// this.bindMatViewMode();
						}
					}, this)
				},
				parameters: {
					"expand": "MSHeaderItems,MSHeaderAttach"
						// "filter": "Mode eq '" + oViewModel.getProperty("/mode") + "'"
				}
			});
		},

		_onBindingChange: function() {
			this._closeBusyDialog();
			var oView = this.getView(),
				// oViewModel = this.getView().getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
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
				Data.getMSApproversData(this);
			} else if (status === this.getResourceBundle().getText("STATUS_IN_APPROVAL") || status === this.getResourceBundle().getText(
					"STATUS_APPROVED") || status === this.getResourceBundle().getText("STATUS_REJECTED") || status === this.getResourceBundle().getText(
					"STATUS_REVIEW")) { // In Approval, Approved, Cancelled
				oViewModel.setProperty("/isApprovalTabVisible", true);
				oViewModel.setProperty("/isApprovalLogTabVisible", true);
				Data.getMSApproversData(this);
				Data.getMSApproversLogData(this);
			} else if (status === this.getResourceBundle().getText("STATUS_CLAR_REQ")) { // Clarification Required
				oViewModel.setProperty("/isApprovalAgentsTabVisible", true); // Table with agents
				oViewModel.setProperty("/isApprovalLogTabVisible", true);
				Data.getMSApproversLogData(this);
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
				Data.getMSApproversData(this);
			} else if (status === this.getResourceBundle().getText("STATUS_IN_APPROVAL") || status === this.getResourceBundle().getText(
					"STATUS_APPROVED") || status === this.getResourceBundle().getText("STATUS_REJECTED") || status === this.getResourceBundle().getText(
					"STATUS_REVIEW")) { // In Approval, Approved, Cancelled
				oViewModel.setProperty("/isApprovalTabVisible", true);
				oViewModel.setProperty("/isApprovalLogTabVisible", true);
				Data.getMSApproversData(this);
				Data.getMSApproversLogData(this);
			} else if (status === this.getResourceBundle().getText("STATUS_CLAR_REQ")) { // Clarification Required
				oViewModel.setProperty("/isApprovalAgentsEditTabVisible", true); // Table with agents
				oViewModel.setProperty("/isApprovalLogTabVisible", true);
				Data.getMSApproversLogData(this);
			}
		},

		_setCreateTabsVisibility: function() {
			var oViewModel = this.getView().getModel("objectView");
			oViewModel.setProperty("/isApprovalAgentsEditTabVisible", true);
			oViewModel.setProperty("/isApprovalAgentsTabVisible", false);
			oViewModel.setProperty("/isApprovalTabVisible", false);
			oViewModel.setProperty("/isApprovalLogTabVisible", false);
			oViewModel.setProperty("/isChangeLogTabVisible", false);
			Data.getMSApproversData(this);
			// oViewModel.setProperty("/isChangeAttachmentsTabVisible", true);
		},

		_toggleAgentsFieldsEditability: function() {
			var oModel = this.getView().getModel("objectView");
			var array = oModel.getProperty("/MSApproverAgentsListSet");
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

			// Fat/SAT/Deletion Indicator Check Boxes editability
			if (mode === "D" && this.bModebyStatus === true) { // && this.bViewMode === true) {
				oViewModel.setProperty("/bEdit", true);
				oViewModel.setProperty("/bSave", false);
				// } else if ((mode === "E" || mode === "C") && bViewMode === true) {
			} else if ((mode === "E" || mode === "C") && this.bModebyStatus === true) { // && this.bViewMode === true) {
				oViewModel.setProperty("/bEdit", false);
				oViewModel.setProperty("/bSave", true);
			} else {
				oViewModel.setProperty("/bEdit", false);
				oViewModel.setProperty("/bSave", false);
			}
		},

		setKeyFieldsData: function(obj) {
			var oViewModel = this.getModel("objectView");
			oViewModel.setProperty("/po", obj.PoNum);
			oViewModel.setProperty("/vendor", obj.Vendor);
		},

		// *************************************** Navigation Handlers ****************************************
		// *******************************************************************************************************

		_navToDisplayPage: function() {
			var oViewModel = this.getModel("objectView");
			this.getRouter().navTo("displaymsitems", {
				MSId: oViewModel.getProperty("/MSelNo"),
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
						title: this.getResourceBundle().getText("WARNING"), //"Warning!",
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

		onSelectAllFAT: function() {
			var model = this.getModel("objectView");
			this._SetClearFATCheckboxes(this.oTreeTable, model.getProperty("/selectAllFAT"));
			model.setProperty("/selectAllFAT", !model.getProperty("/selectAllFAT"));
		},

		onSelectAllSAT: function() {
			var model = this.getModel("objectView");
			this._SetClearSATCheckboxes(this.oTreeTable, model.getProperty("/selectAllSAT"));
			model.setProperty("/selectAllSAT", !model.getProperty("/selectAllSAT"));
		},

		// ******************************************* Tree Table Methods ***************************************//
		// ******************************************************************************************************//
		// onCollapseAll: function() {
		// 	this.oTreeTable.collapseAll();
		// },

		// onExpandAll: function() {
		// 	this.oTreeTable.expandToLevel(2);
		// },

		// onExpandFirstLevel: function() {
		// 	this.oTreeTable.expandToLevel(1);
		// },

		// _buildTreeTableData: function() {
		// 	var table = this.getView().byId("idTreeTable");
		// 	table.setBusy(true);
		// 	var oViewModel = this.getModel("objectView");
		// 	// var json = oViewModel.getProperty("/MLItemsSet/MLHeaderItems");
		// 	var json = oViewModel.getProperty("/MLHeaderItems");
		// 	var jsonString = JSON.stringify(json);
		// 	var data = JSON.parse(jsonString);
		// 	// var data = oViewModel.getProperty("/MLItemsSet/MLHeaderItems");
		// 	var aChildren = [];
		// 	var //poNew = "",
		// 	//itemNew = "",
		// 		sectionNew = "",
		// 		subSectionNew = "";
		// 	var sectionOld = "",
		// 		subSectionOld = "";
		// 	var obj = {};
		// 	for (var i = 0; i < data.length; i++) {
		// 		// poNew = data[i].PoNum;
		// 		// itemNew = data[i].PoItem;
		// 		sectionNew = data[i].Section;
		// 		subSectionNew = data[i].SubSection;
		// 		if (sectionNew !== sectionOld) { // Sections - Hierarchy level 1
		// 			// if (sectionNew !== sectionOld || subSectionNew !== subSectionOld) { // Add POs and Items - Hierarchy level 1
		// 			// obj = this.createObject(data[i]);
		// 			obj = this.createEmptyObject(data[i]);
		// 			obj.SubSection = data[i].Section;
		// 			obj.SubSectionDesc = data[i].SectionDesc;
		// 			aChildren.push(obj);

		// 			obj = this.createEmptyObject(data[i]);
		// 			obj.SubSection = data[i].SubSection;
		// 			obj.SubSectionDesc = data[i].SubSectionDesc;
		// 			this.addChidren(aChildren[aChildren.length - 1], obj);
		// 			// aChildren.push(obj);

		// 			sectionOld = data[i].Section;
		// 			subSectionOld = data[i].SubSection;
		// 			this.setRowStatus(data[i]);
		// 			this.addSubChidren(aChildren[aChildren.length - 1], data[i]);
		// 			continue;
		// 		}
		// 		if (subSectionNew !== subSectionOld) { // Sub Sections - Hierarchy level 2
		// 			obj = this.createEmptyObject(data[i]);
		// 			obj.SubSection = data[i].SubSection;
		// 			obj.SubSectionDesc = data[i].SubSectionDesc;
		// 			this.addChidren(aChildren[aChildren.length - 1], obj);

		// 			sectionOld = data[i].Section;
		// 			subSectionOld = data[i].SubSection;
		// 			// this.addChidren(aChildren[aChildren.length - 1].children[aChildren[aChildren.length - 1].children.length - 1], data[i]);	// Send last Section - Hierarchy 2
		// 			// *********
		// 			// data[i].SubSection = data[i].Section;
		// 			// data[i].SubSectionDesc = data[i].SectionDesc;
		// 			// **********
		// 			// aChildren.push(data[i]);
		// 			this.setRowStatus(data[i]);
		// 			this.addSubChidren(aChildren[aChildren.length - 1], data[i]);
		// 		} else {
		// 			sectionOld = data[i].Section;
		// 			subSectionOld = data[i].SubSection;
		// 			this.setRowStatus(data[i]);
		// 			this.addSubChidren(aChildren[aChildren.length - 1], data[i]);
		// 		}

		// 		// else { // Add Sections - Hierarchy level 2
		// 		// 	this.addChidren(aChildren[aChildren.length - 1], data[i]);	// Send last PO Item - Hierarchy 1
		// 		// }

		// 	}
		// 	var oTreeData = {
		// 		children: aChildren
		// 	};
		// 	oViewModel.setProperty("/makelist", oTreeData);
		// 	table.setBusy(false);
		// 	table.setSelectedIndex(-1);
		// 	// this.onCollapseAll();
		// },

		setRowStatus: function(obj) {
			if (obj.BOMStatus === this.getResourceBundle().getText("STATUS_ALL")) {
				obj.Status = this.getResourceBundle().getText("STATUS_SUCCESS");
			} else if (obj.BOMStatus === this.getResourceBundle().getText("STATUS_PAR")) {
				obj.Status = this.getResourceBundle().getText("STATUS_WARNING");
			} else {
				obj.Status = this.getResourceBundle().getText("STATUS_ERROR");
			}
		},

		// createEmptyObject: function(obj) {
		// 	var object = {};
		// 	var arr = Object.keys(obj);
		// 	for (var i = 0; i < arr.length; i++) {
		// 		object[arr[i]] = "";
		// 	}
		// 	return object;
		// },

		// addChidren: function(parent, child) {
		// 	if (parent.children && parent.children.length > 0)
		// 		parent.children.push(child);
		// 	else
		// 		parent.children = [child];
		// },
		// addSubChidren: function(parent, child) {
		// 	var section = parent.children[parent.children.length - 1];
		// 	if (section.children && section.children.length > 0)
		// 		section.children.push(child);
		// 	else
		// 		section.children = [child];
		// },

		getModifiedMSItems: function() {
			var oViewModel = this.getModel("objectView");
			var oTreeData = oViewModel.getProperty("/MSHeadSet/MSHeaderItems");
			// var aSecondLevelItems = [];

			// function pushItem(arr) {
			// 	arr.forEach(function(item) {
			// 		aSecondLevelItems.push(item);
			// 	});
			// 	return arr;
			// }
			// for (var i = 0; i < oTreeData.children.length; i++) {
			// 	if (oTreeData.children[i].children) {
			// 		pushItem(oTreeData.children[i].children);
			// 	}
			// }
			// var aFinalItems = [];

			// function pushSubItem(arr) {
			// 	arr.forEach(function(item) {
			// 		aFinalItems.push(item);
			// 	});
			// 	return arr;
			// }
			// for (var j = 0; j < aSecondLevelItems.length; j++) {
			// 	if (aSecondLevelItems[j].children) {
			// 		pushSubItem(aSecondLevelItems[j].children);
			// 	}
			// }
			// var that = this;

			// function isModified(subItem) {
			// 	if (subItem.DelInd === "X" || subItem.Sat === "X" || subItem.Fat === "X") {
			// 		that.aSubItems.push(JSON.parse(JSON.stringify(subItem)));
			// 	}
			// 	return 1 === 0; // Always return false to run the function for all items
			// }
			var aPayloadToSave = {
				MSHeaderItems: []
			};
			// aPayloadToSave.MSelNo = oViewModel.getProperty("/MSelNo");
			aPayloadToSave.PoNum = oViewModel.getProperty("/po");
			aPayloadToSave.Vendor = oViewModel.getProperty("/vendor");
			aPayloadToSave.Mode = oViewModel.getProperty("/mode");
			// aPayloadToSave.ProjDesc = oViewModel.getProperty("/MLItemsSet/ProjDesc");
			aPayloadToSave.VendorDesc = this.getModel().getProperty(this.getView().getBindingContext().getPath()).VendorDesc;
			aPayloadToSave.Plant = this.getModel().getProperty(this.getView().getBindingContext().getPath()).Plant;
			if (oViewModel.getProperty("/mode") === "E") {
				aPayloadToSave.MSelNo = oViewModel.getProperty("/MSelNo");
			}

			// this.aSubItems = [];
			for (var k = 0; k < oTreeData.length; k++) {
				// aFinalItems[k].ItemToSubItems.results.find(isModified);
				if (oTreeData[k].DelInd === "X" || oTreeData[k].SAT === "X" || oTreeData[k].FAT === "X") {
					// this.aSubItems.push(JSON.parse(JSON.stringify(oTreeData[k])));
					// }
					// if (this.aSubItems.length > 0) {
					var obj = JSON.parse(JSON.stringify(oTreeData[k]));
					// obj.ItemToSubItems = this.aSubItems;
					delete obj.Status;
					delete obj.Used;
					// obj.DelivDate = formatter.formatDate(obj.DelivDate);
					obj.DelivDate = new Date(obj.DelivDate);
					// var date = new Date(obj.DelivDate);
					// obj.DelivDate = date.getFullYear().toString() +
					// 	((date.getMonth() + 1).toString().length < 2 ? "0" + (date.getMonth() + 1).toString() : (date.getMonth() + 1).toString()) +
					// 	(date.getDate().toString().length < 2 ? "0" + date.getDate().toString() : date.getDate().toString());
					aPayloadToSave.MSHeaderItems.push(obj);
				}
			}

			if (aPayloadToSave.MSHeaderItems.length === 0) {
				MessageBox.error(this.getResourceBundle().getText("MS_CREATE_ONE")); // Material Selection Document can be created with atleast one Sub Item!
				// this.getView().byId("idPageLayout").scrollToSection("idItemsTab");
				this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idItemsTab").getId());
				aPayloadToSave = undefined;
			}
			if (aPayloadToSave !== undefined) {
				var approvers = this._formatApproversData();
				if (approvers.length > 0) {
					aPayloadToSave.MSApproverAgents = approvers;
				} else {
					aPayloadToSave = undefined;
					MessageBox.error(this.getResourceBundle().getText("ML_APPR_NOT_MAINTAINED"));
				}
			}

			// Handle Header Attachments POST
			if (aPayloadToSave) {
				aPayloadToSave.MSHeaderAttach = [];
				var headAttachments = oViewModel.getProperty("/Attachments");
				if (headAttachments && headAttachments.length > 0) {
					this.fillAttachmentData(aPayloadToSave.MSHeaderAttach, headAttachments, oViewModel);
				}
			}

			// if (aPayloadToSave && this.getView().getModel("objectView").getProperty("/Attachments")) {
			// 	// Validate Sub Item Attachments - Ignore if FAT/SAT/Del Indicator is not selected
			// 	// for(var n=0; n<aPayloadToSave.GetItems.length;)
			// 	var attachments = this.validateMaterialAttachments(aPayloadToSave.GetItems);
			// 	// Handle Sub Item Attachments POST
			// 	aPayloadToSave.GetMATAttachments = [];
			// 	// var attachments = this.getView().getModel("materialView").getProperty("/Attachments");
			// 	if (attachments && attachments.length > 0) {
			// 		this.fillAttachmentData(aPayloadToSave.GetMATAttachments, attachments, oViewModel);
			// 	}
			// }
			return aPayloadToSave;
		},

		// validateMaterialAttachments: function(items) {
		// 	var oViewModel = this.getView().getModel("objectView");
		// 	var oMatModel = this.getView().getModel("materialView");
		// 	var attachments = oMatModel.getProperty("/Attachments");
		// 	var aValidAttachs = [];

		// 	function getValidEditAttachments(attachment) {
		// 		var subItems;
		// 		for (var i = 0; i < items.length; i++) {
		// 			subItems = items[i].ItemToSubItems;
		// 			for (var j = 0; j < subItems.length; j++) {
		// 				if ((attachment.New === "X" || attachment.Delete === "X") && attachment.SubMaterial === subItems[j].Matnr) { // Means FAT/SAT/DelInd is selected
		// 					aValidAttachs.push(attachment);
		// 				}
		// 			}
		// 		}
		// 		return 1 === 0; // Always return false to run the function for all items
		// 	}

		// 	function getValidCreateAttachments(attachment) {
		// 		var subItems;
		// 		for (var i = 0; i < items.length; i++) {
		// 			subItems = items[i].ItemToSubItems;
		// 			for (var j = 0; j < subItems.length; j++) {
		// 				// SubMaterial: model.getProperty("/AddlInfo/Matnr"),
		// 				if (attachment.New === "X") {
		// 					if (attachment.PoNum === subItems[j].PoNum && //oMatModel.getProperty("/MLItemSelected/PoNum") &&
		// 						attachment.Material === items[i].Matnr && //oMatModel.getProperty("/MLItemSelected/Matnr") &&
		// 						attachment.SubMaterial === subItems[j].Matnr) { // Means FAT/SAT/DelInd is selected
		// 						aValidAttachs.push(attachment);
		// 					}
		// 				}
		// 				// else if (attachment.Delete === "X") {
		// 				// 	aValidAttachs.push(attachment);
		// 				// }
		// 			}
		// 		}
		// 		return 1 === 0; // Always return false to run the function for all items
		// 	}

		// 	if (oViewModel.getProperty("/mode") === "E") {
		// 		attachments.find(getValidEditAttachments);
		// 	} else if (oViewModel.getProperty("/mode") === "C") {
		// 		attachments.find(getValidCreateAttachments);
		// 	}
		// 	return aValidAttachs;
		// },

		fillAttachmentData: function(GetAttachments, Attachments, oViewModel) {
			for (var n = 0; n < Attachments.length; n++) {
				if (Attachments[n].New === "X") {
					GetAttachments.push({
						MSelNo: Attachments[n].MSelNo,
						SubMaterial: Attachments[n].SubMaterial,
						MimeType: Attachments[n].Mimetype,
						Filedata: Attachments[n].Filedata,
						Filename: Attachments[n].Filename,
						FileSize: Attachments[n].FileSize,
						New: Attachments[n].New,
						Delete: Attachments[n].Delete,
						Mode: oViewModel.getProperty("/mode"),
						Operation: "I"
					});
				}
				if (Attachments[n].Delete === "X") {
					GetAttachments.push({
						MSelNo: Attachments[n].MSelNo,
						DocGuid: Attachments[n].DocGuid,
						SubMaterial: Attachments[n].SubMaterial,
						MimeType: Attachments[n].Mimetype,
						Filedata: Attachments[n].Filedata,
						Filename: Attachments[n].Filename,
						New: Attachments[n].New,
						Delete: Attachments[n].Delete,
						Mode: oViewModel.getProperty("/mode"),
						Operation: "D",
						Counter: Attachments[n].Counter
					});
				}
			}
		},

		_formatApproversData: function() {
			var oViewModel = this.getModel("objectView");
			var aApproversList = oViewModel.getProperty("/MSApproverAgentsListSet");
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
			var aAgents = oModel.getProperty("/MSApproverAgentsListSet");
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
			oModel.setProperty("/MSApproverAgentsListSet", aAgents);
			this.bViewEdited = true;
		},

		onRemoveAgentsRow: function(evt) {
			var oModel = this.getView().getModel("objectView");
			var aAgents = oModel.getProperty("/MSApproverAgentsListSet");
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
			oModel.setProperty("/MSApproverAgentsListSet", aAgents);
			MessageToast.show(this.getResourceBundle().getText("ENTRY_DELETED"));
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
			var sPath = "/sap/opu/odata/sap/ZPS_MLIST_ODATA_MAKE_LIST_SRV/MSDownloadSet";
			// if (oModel.getProperty("/iItemCount") === 0) {
			// 	MessageToast.show("No Items found to download!");
			// 	return;
			// }
			if (oViewModel.getProperty("/mode") === "D") {
				sUrl = sPath + "?$filter=(MSelNo eq '" +
					oViewModel.getProperty("/MSelNo") + "' and Fat eq '" +
					oViewModel.getProperty("/mode") + "')&$format=xlsx";
			} else if (oViewModel.getProperty("/mode") === "E") {
				sUrl = sPath + "?$filter=(MSelNo eq '" +
					oViewModel.getProperty("/MSelNo") + "' and Fat eq '" +
					oViewModel.getProperty("/mode") + "')&$format=xlsx";
			} else if (oViewModel.getProperty("/mode") === "C") {
				sUrl = sPath + "?$filter=(PoNum eq '" +
					oViewModel.getProperty("/po") + "' and Vendor eq '" +
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
				this.confirmAction(this.getResourceBundle().getText("MS_GENERATE"), "SAVE"); // Do you want to generate Material Selection Document?
			} else {
				this.confirmAction(this.getResourceBundle().getText("CONFIRM_SAVE"), "SAVE");
			}
		},

		onSubmit: function() {
			// if (this.getView().getModel("objectView").getProperty("/mode") === "C") {
			// 	this.validate
			// }
			this.confirmAction(this.getResourceBundle().getText("MS_SUBMIT"), "SUBMIT");
		},

		onApprove: function() {
			this.confirmAction(this.getResourceBundle().getText("MS_APPR"), "APPR");
		},
		
		onNextLevel: function(){
			this.confirmAction(this.getResourceBundle().getText("CONFIRM_NXT_LEVEL"), "NEXT");
		},

		onCancelDocument: function() {
			this.confirmAction(this.getResourceBundle().getText("MS_CANCEL"), "CLOSE");
		},

		onReturn: function() {
			if (!this._RejectDialog) {
				this._RejectDialog = this.getValueHelpDialog("RejectDialog");
			}
			// if (!this._RejectDialog) {
			// 	this._RejectDialog = sap.ui.xmlfragment("ps/dewa/makelist/MakeList/fragments/RejectDialog", this);
			// 	this.getView().addDependent(this._RejectDialog);
			// }
			this.getView().getModel("objectView").setProperty("/ReturnRejectDialogLabel",
				this.getResourceBundle().getText("RETURN_WITEM")); // Do you want to Return this Work Item to Initiator?
			this.getView().getModel("objectView").setProperty("/ReturnRejectDialogTitle", this.getResourceBundle().getText("RETURN"));
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
			this.getView().getModel("objectView").setProperty("/ReturnRejectDialogTitle", this.getResourceBundle().getText("REJECT"));
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
				MlistNo: this.getView().getModel("objectView").getProperty("/MSelNo"),
				// WiId: this.getView().getModel("objectView").getProperty("/WiId"),
				// Level: this.getView().getModel("objectView").getProperty("/Level"),
				Comments: this.getView().getModel("objectView").getProperty("/RejectReturnComments")
			};
			Data.executeAction(this, "/MSRejectWF", params);
			this._CancelRejectDialog();
		},

		_Return: function() {
			if (this.getView().getModel("objectView").getProperty("/RejectReturnComments") === "") {
				MessageToast.show(this.getResourceBundle().getText("RETURN_REASON_MAND")); // Reason for Returning is mandatory!
				return;
			}
			var params = {
				MSelNo: this.getView().getModel("objectView").getProperty("/MSelNo"),
				WiId: this.getView().getModel("objectView").getProperty("/WiId"),
				Level: this.getView().getModel("objectView").getProperty("/Level"),
				Comments: this.getView().getModel("objectView").getProperty("/RejectReturnComments")
			};
			Data.executeAction(this, "/MSReturnWF", params);
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
										MSelNo: this.getView().getModel("objectView").getProperty("/MSelNo")
									};
									if (this.getView().getModel("objectView").getProperty("/mode") === "C") {
										Data.submitMSItems(this);
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
										Data.executeAction(this, "/MSSubmitWF", params, action);
									} else if (this.getView().getModel("objectView").getProperty("/mode") === "E") {
										if (this.validateApprovers() !== "") {
											MessageBox.error(this.getResourceBundle().getText("MISSING_APPR"), { // Please update approver details before submit!
												onClose: jQuery.proxy(function() {
													// this.getView().byId("idPageLayout").setSelectedSection(this.getView().byId("idAgentsEditTab"));
													this.getView().byId("idPageLayout").scrollToSection(this.getView().byId("idAgentsEditTab").getId());
												}, this)
											});
											return;
										}
										var promise = Data.saveMSItems(this, action); // Send action to differentiate between save and submit
										promise.then(jQuery.proxy(function() {
											Data.executeAction(this, "/MSSubmitWF", params, action);
										}, this));
									}
									break;
								case "APPR":
									params = {
										MSelNo: this.getView().getModel("objectView").getProperty("/MSelNo"),
										WiId: this.getView().getModel("objectView").getProperty("/WiId"),
										Level: this.getView().getModel("objectView").getProperty("/Level")
									};
									Data.executeAction(this, "/MSApproveWF", params, action);
									break;
								case "CLOSE":
									params = {
										MSelNo: this.getView().getModel("objectView").getProperty("/MSelNo")
									};
									Data.executeAction(this, "/MSCloseWF", params);
									// case "REJ":
									// params = {
									// 	MlistNo: this.getView().getModel("objectView").getProperty("/MakeNo"),
									// 	WiId: this.getView().getModel("objectView").getProperty("/WiId"),
									// 	Comments: this.getView().getModel("objectView").getProperty("/RejectReturnComments")
									// };
									// this.executeAction(this, "/MLRejectWF", params);
									break;
								case "SAVE":
									Data.saveMSItems(this);
									break;
								case "NEXT":
									params = {
										MSelNo: this.getView().getModel("objectView").getProperty("/MSelNo"),
										WiId: this.getView().getModel("objectView").getProperty("/WiId"),
										Level: this.getView().getModel("objectView").getProperty("/Level")
									};
									Data.executeAction(this, "/MSNextLevelWF", params);
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
			this.getRouter().navTo("editmsitems", {
				MSId: oViewModel.getProperty("/MSelNo"),
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
			// Data._getItems(this);
			Data._getMSItems(this);
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
				Data.getMSPartnerFunctions(this);
				this._pfValueHelpDialog = this.getValueHelpDialog("PartnerFunctionsDialog");
			}
			this._pfValueHelpDialog.open();
		},

		_handlePFValueHelpSearch: function(evt) {
			// var sValue = evt.getParameter("value");
			// var contains = FilterOperator.Contains;
			// var columns = ['PartnerFunc', 'PartnerFuncDesc'];
			// var filters = new sap.ui.model.Filter(columns.map(function(colName) {
			// 	return new sap.ui.model.Filter(colName, contains, sValue);
			// }), false);
			// evt.getSource().getBinding("items").filter(filters, sap.ui.model.FilterType.Application);
			this._filterF4List(evt.getParameter("value"), evt.getSource(), ['PartnerFunc', 'PartnerFuncDesc']);
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
				Data.getMSUserGroups(this);
				this._prjUsrGrpValueHelpDialog = this.getValueHelpDialog("ProjectUserGroupDialog");
			}
			this._prjUsrGrpValueHelpDialog.open();
		},

		_handleProjUserGrpValueHelpSearch: function(evt) {
			// var sValue = evt.getParameter("value");
			// var contains = FilterOperator.Contains;
			// var columns = ['UserGroup', 'UserGroupName'];
			// var filters = new sap.ui.model.Filter(columns.map(function(colName) {
			// 	return new sap.ui.model.Filter(colName, contains, sValue);
			// }), false);
			// evt.getSource().getBinding("items").filter(filters, sap.ui.model.FilterType.Application);
			this._filterF4List(evt.getParameter("value"), evt.getSource(), ['UserGroup', 'UserGroupName']);
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

		handleCountryValueHelp: function(oEvent) {
			this.countryInput = oEvent.getSource();
			this.selectedCountryContextPath = this.countryInput.getBindingContext("objectView").getPath();
			if (!this._countryValueHelpDialog) {
				var promise = Data.getCountriesList(this);
				promise.then(jQuery.proxy(function() {
					this._countryValueHelpDialog = this.getValueHelpDialog("CountryDialog");
					this._countryValueHelpDialog.open();
				}, this));
			} else {
				this._countryValueHelpDialog.open();
			}

		},

		_handleCountryValueHelpSearch: function(evt) {
			this._filterF4List(evt.getParameter("value"), evt.getSource(), ['CountryID', 'CountryName']);
		},

		_handleCountryValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var oViewModel = this.getView().getModel("objectView");
				oViewModel.setProperty(this.selectedCountryContextPath + "/CountryName", oSelectedItem.getTitle());
				oViewModel.setProperty(this.selectedCountryContextPath + "/Country", oSelectedItem.getDescription());
			}
			this.bViewEdited = true;
		},

		// ****************************** Approvers & Change Log Methods ********************************
		// **********************************************************************************************

		validateApprovers: function() {
			var oJSONModel = this.getView().getModel("objectView");
			var approvers = oJSONModel.getProperty("/MSApproverAgentsListSet");
			var bError = "";
			if (approvers === undefined) {
				bError = "X";
				return bError;
			}
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

		onSelectDelIndCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("objectView").getPath();
			var obj = oSrc.getBindingContext("objectView").getObject();
			oSrc.getModel("objectView").setProperty(sPath + "/DelInd", isSelected === true ? 'X' : '');
			oSrc.getModel("objectView").setProperty(sPath + "/Used", (obj.DelInd === "X" || obj.FAT === "X" || obj.SAT === "X") ? "X" : ""); // Attachments Enable/Disable
			oSrc.getModel("objectView").setProperty("/bUploaderEnabled", obj.Used === "X" ? true : false);
			// this.updateItemLevelIndicator();
			this.bViewEdited = true;
		},

		onSelectFatCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("objectView").getPath();
			var obj = oSrc.getBindingContext("objectView").getObject();
			oSrc.getModel("objectView").setProperty(sPath + "/FAT", isSelected === true ? 'X' : '');
			oSrc.getModel("objectView").setProperty(sPath + "/Used", (obj.DelInd === "X" || obj.FAT === "X" || obj.SAT === "X") ? "X" : ""); // Attachments Enable/Disable
			oSrc.getModel("objectView").setProperty("/bUploaderEnabled", obj.Used === "X" ? true : false);
			// this.updateItemLevelIndicator();
			this.bViewEdited = true;
		},

		onSelectSatCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("objectView").getPath();
			var obj = oSrc.getBindingContext("objectView").getObject();
			oSrc.getModel("objectView").setProperty(sPath + "/SAT", isSelected === true ? 'X' : '');
			oSrc.getModel("objectView").setProperty(sPath + "/Used", (obj.DelInd === "X" || obj.FAT === "X" || obj.SAT === "X") ? "X" : ""); // Attachments Enable/Disable
			oSrc.getModel("objectView").setProperty("/bUploaderEnabled", obj.Used === "X" ? true : false);
			// this.updateItemLevelIndicator();
			this.bViewEdited = true;
		},

		// updateItemLevelIndicator: function() {
		// 	var model = this.getView().getModel("objectView");
		// 	var items = model.getProperty("/MSHeadSet/MSHeaderItems");
		// 	var checked, unchecked;
		// 	for (var i = 0; i < items.length; i++) {
		// 		if (items[i].FAT === 'X' || items[i].SAT === 'X' || items[i].DelInd === 'X') {
		// 			checked = true;
		// 		} else {
		// 			unchecked = true;
		// 		}
		// 	}

		// 	if (checked === true && unchecked === true) {
		// 		model.setProperty("/MLItemSelected/BOMStatus", "PAR"); // Yellow Color - Partial items are added to makelist
		// 	} else if (checked === true) {
		// 		model.setProperty("/MLItemSelected/BOMStatus", "ALL"); // Red Color - All subItems are added to makelist
		// 	} else {
		// 		model.setProperty("/MLItemSelected/BOMStatus", ""); // Green Color - No Items are added
		// 	}
		// 	this.setRowStatus(model.getProperty("/MLItemSelected"));
		// 	this.getView().getModel("objectView").refresh();

		// },

		// onDisplayAdditionalInfo: function(evt) {
		// 	if (evt.getParameter("userInteraction") !== undefined && evt.getParameter("userInteraction") === false) { // rowIndex = -1
		// 		return;
		// 	}
		// 	var oSelectedObj, model = this.getView().getModel("materialView");
		// 	if (evt.getParameter("row")) {
		// 		oSelectedObj = evt.getParameter("row").getBindingContext("materialView").getObject();
		// 	} else {
		// 		if (evt.getParameter("rowContext")) {
		// 			oSelectedObj = evt.getParameter("rowContext").getObject();
		// 		}
		// 	}
		// 	var mode = this.getModel("objectView").getProperty("/mode");
		// 	model.setProperty("/AddlInfo", oSelectedObj);
		// 	model.setProperty("/bAddlInfoPanelVisible", true);
		// 	model.setProperty("/bAttachmentsPanelVisible", true);
		// 	if (this.bModebyStatus && (mode === "E" || mode === "C") && oSelectedObj.Used === "X") {
		// 		model.setProperty("/bUploaderEnabled", true);
		// 	} else {
		// 		model.setProperty("/bUploaderEnabled", false);
		// 	}
		// 	// this.getAttachments(oSelectedObj);
		// 	Data.getMaterialAttachments(this, oSelectedObj);
		// },

		// onChangeBOMQty: function(evt) {
		// 	evt.getSource().getModel("materialView").refresh();
		// 	this.bViewEdited = true;
		// },

		// ******************************Start of Material Attachments Methods*************************************
		// ********************************************************************************************************
		// onUpload: function() {
		// 	var oFileUploader = this.getView().byId("idSubItmfileUploader");
		// 	var oDomRef = oFileUploader.getFocusDomRef();
		// 	var file = oDomRef.files[0];
		// 	if (oDomRef.files.length === 0) {
		// 		MessageToast.show("Please click on Browse button to select the file/s");
		// 		return;
		// 	}
		// 	if (file.size > "3145728") {
		// 		var oVar = "Please note that the maximum attachment size should not exceed 3 MB." +
		// 			" You are advised to use Adobe Acrobat to compress the attachment size and attach again." +
		// 			" For further assistance, please contact IT Service Desk on 51555.";
		// 		oFileUploader.setValueState("Error");
		// 		MessageBox.error(oVar);
		// 		oFileUploader.setValue("");
		// 		return;
		// 	} else {
		// 		oFileUploader.setValueState("None");
		// 	}

		// 	// global variables
		// 	var fileName = file.name,
		// 		fileType = file.type,
		// 		fileSize = file.size,
		// 		fileIcon;
		// 	var oReader = new FileReader();
		// 	var model = this.getView().getModel("materialView");
		// 	var data = model.getProperty("/Attachments");
		// 	oReader.onload = jQuery.proxy(function(evt) {
		// 		var vContent = evt.currentTarget.result.replace("data:" + file.type + ";base64,", "");
		// 		if (file.type === "application/pdf") {
		// 			fileIcon = "sap-icon://pdf-attachment";
		// 		} else if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
		// 			fileIcon = "sap-icon://card";
		// 		} else if (file.type === "application/msword" ||
		// 			file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
		// 			fileIcon = "sap-icon://doc-attachment";
		// 		} else {
		// 			fileIcon = "sap-icon://attachment";
		// 		}
		// 		var ofileSizeKB = fileSize / 1024;
		// 		var ofileSizeMB = ofileSizeKB / 1024;
		// 		var ofileSizeTxt;
		// 		if (ofileSizeMB < 1) {
		// 			var ofileKB2dec = ofileSizeKB.toFixed(2); // round up to 2 decimals
		// 			ofileSizeTxt = ofileKB2dec + " KB";
		// 		} else {
		// 			var ofileMB2dec = ofileSizeMB.toFixed(2); // round up to 2 decimals
		// 			ofileSizeTxt = ofileMB2dec + " MB";
		// 		}

		// 		var fileRow = {
		// 			MSelNo: this.getModel("objectView").getProperty("/MSelNo") === undefined ? "0000000000" : this.getModel("objectView").getProperty(
		// 				"/MSelNo"),
		// 			PoNum: model.getProperty("/MLItemSelected/PoNum"),
		// 			Material: model.getProperty("/MLItemSelected/Matnr"),
		// 			SubMaterial: model.getProperty("/AddlInfo/Matnr"),
		// 			Mimetype: fileType,
		// 			Filename: fileName,
		// 			Filedata: vContent,
		// 			FileSizeTxt: ofileSizeTxt,
		// 			FileIcon: fileIcon,
		// 			New: "X",
		// 			Delete: ""
		// 		};
		// 		if (data.length > 0) {
		// 			data.push(fileRow);
		// 		} else {
		// 			data = [fileRow];
		// 		}
		// 		model.setProperty("/Attachments", data);
		// 		this.bViewEdited = true;
		// 		// Data.postMaterialAttachmentFileToBackend(this, fileRow);
		// 	}, this);
		// 	oReader.readAsDataURL(file);
		// },

		onHeaderUpload: function() {
			var oFileUploader = this.getView().byId("fileUploader");
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
					MSelNo: model.getProperty("/MSelNo"),
					// PoNum: model.getProperty("/MLItemSelected/PoNum"),
					// Material: model.getProperty("/MLItemSelected/Matnr"),
					// SubMaterial: model.getProperty("/AddlInfo/Matnr"),
					Mimetype: fileType,
					Filename: fileName,
					Filedata: vContent,
					FileSize: ofileSizeTxt,
					FileIcon: fileIcon,
					New: "X",
					Delete: ""
				};
				if (data && data.length > 0) {
					data.push(fileRow);
				} else {
					data = [fileRow];
				}
				model.setProperty("/Attachments", data);
				this.bViewEdited = true;
				// Data.postMaterialAttachmentFileToBackend(this, fileRow);
				oFileUploader.setValue(""); // Clear the input after file added to list
			}, this);
			oReader.readAsDataURL(file);
		},

		// onMatAttchListDelete: function(oEvent) {
		// 	var model = this.getView().getModel("materialView");
		// 	var data = model.getProperty("/Attachments");
		// 	var sPath = oEvent.getParameter("listItem").getBindingContext("materialView").sPath;
		// 	var index = sPath.split("/")[sPath.split("/").length - 1];
		// 	// Removing the selected list item from the model based on the index
		// 	var oData = oEvent.getParameter("listItem").getBindingContext("materialView").getObject();
		// 	if (oData.New === "X") {
		// 		data.splice(index, 1);
		// 		model.setProperty("/Attachments", data);
		// 	} else {
		// 		oData.Delete = "X";
		// 	}
		// 	model.refresh();
		// 	this.bViewEdited = true;
		// },

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

		// onListItemPressed: function(evt) {
		// 	var oObj = evt.getSource().getBindingContext("materialView").getObject(); // .SubMaterial;
		// 	this.onDisplayAttachment(oObj);
		// },

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
					oDeleteControl.setEnabled(true);
				} else {
					oDeleteControl.setEnabled(false);
				}
			}
		},

		// onSubItemsAttachTableUpdateFinished: function(evt) {
		// 	var oList = evt.getSource();
		// 	var oItems = oList.getItems();
		// 	var obj, oDeleteControl;
		// 	var mode = this.getView().getModel("objectView").getProperty("/mode");
		// 	for (var i = 0; i < oItems.length; i++) {
		// 		oDeleteControl = oItems[i].getDeleteControl();
		// 		obj = oItems[i].getBindingContext("materialView").getObject();
		// 		if (obj.BOMAttach === "X") {
		// 			oDeleteControl.setEnabled(false);
		// 		} else {
		// 			if (this.bModebyStatus && (mode === "E" || mode === "C")) {
		// 				oDeleteControl.setEnabled(true);
		// 			}
		// 		}
		// 	}
		// },

		onDisplayAttachment: function(obj) {
			// var model = this.getView().getModel("objectView");
			// var sSource = this.getView().getModel().sServiceUrl + this.getView().getModel().createKey("/MSAttachmentsSet", {
			// 	MSelNo: model.getProperty("/MSelNo"),
			// 	Vendor: "1",
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
			// 	sap.m.URLHelper.redirect(sUrl, true);
			// }
		}

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

		// onUploadListUpdateStarted: function(evt) {
		// 	if (evt.getParameter("reason") === "Change") {
		// 		var objectModel = this.getModel("objectView");
		// 		var model = this.getView().getModel("materialView");
		// 		var makeno = objectModel.getProperty("/MakeNo");
		// 		var aFilters = [];
		// 		if (makeno === undefined || makeno === null || makeno === "0000000000") {
		// 			if (model.getProperty("/MLItemSelected/PoNum")) {
		// 				aFilters.push(new Filter("PoNum", FilterOperator.EQ, model.getProperty("/MLItemSelected/PoNum")));
		// 			}
		// 			if (model.getProperty("/MLItemSelected/Matnr")) {
		// 				aFilters.push(new Filter("Material", FilterOperator.EQ, model.getProperty("/MLItemSelected/Matnr")));
		// 			}
		// 			if (model.getProperty("/AddlInfo/Matnr")) {
		// 				aFilters.push(new Filter("SubMaterial", FilterOperator.EQ, model.getProperty("/AddlInfo/Matnr")));
		// 			}
		// 		} else {
		// 			aFilters.push(new Filter("MListNo", FilterOperator.EQ, makeno));
		// 			if (model.getProperty("/AddlInfo/Matnr")) {
		// 				aFilters.push(new Filter("Material", FilterOperator.EQ, model.getProperty("/AddlInfo/Matnr")));
		// 			}
		// 		}

		// 		aFilters.push(new Filter("Delete", FilterOperator.NE, "X"));
		// 		evt.getSource().getBinding("items").filter(aFilters);
		// 	}
		// },

		// processSubItemAttachListData: function(list) {
		// 	var model = this.getView().getModel("materialView");
		// 	// for (var i = 0; i < list.length; i++) {
		// 	// 	list[i].PoNum = model.getProperty("/poNum");
		// 	// 	list[i].Material = model.getProperty("/material");
		// 	// 	list[i].SubMaterial = model.getProperty("/AddlInfo/Matnr");
		// 	// }
		// 	var attachList = model.getProperty("/Attachments");
		// 	if (attachList) {
		// 		for (var j = 0; j < attachList.length; j++) {
		// 			if (attachList[j].New === "X" || attachList[j].Delete === "X") {
		// 				list.push(attachList[j]);
		// 			}
		// 		}
		// 	}
		// }
	});
});