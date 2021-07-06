/*global location*/
sap.ui.define([
	"ps/dewa/makelist/MakeList/model/GetData",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(GetData, Filter, FilterOperator, MessageBox, MessageToast) {
	return {
		// *********************************** Items Controller Methods ********************************
		// *********************************************************************************************
		getMakeList: function(that) {
			var oViewModel = that.getModel("objectView");
			var sObjectPath = that.getModel().createKey("GetMakeListSet", {
				WiId: oViewModel.getProperty("/WiId")
			});
			that._openBusyDialog(that.getResourceBundle().getText("ML_LOADING"));
			that.getView().getModel().read("/" + sObjectPath, {
				success: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
					oViewModel.setProperty("/MakeNo", resp.MlistNo);
					oViewModel.setProperty("/Level", resp.Level);
					oViewModel.setProperty("/bVisibleFooterButtons", true);
					// oViewModel.setProperty("/bVisibleSubmitButton", false);
					oViewModel.setProperty("/mode", "D");
					that.getHeaderData(resp.MlistNo);
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
				}, that)
			});
		},

		_getItems: function(that) {
			var aFilters = [],
				oViewModel = that.getModel("objectView");
			if (oViewModel.getProperty("/mode") === "E" || oViewModel.getProperty("/mode") === "D") {
				aFilters.push(new Filter("MlistNo", FilterOperator.EQ, oViewModel.getProperty("/MakeNo")));
			} else {
				aFilters.push(new Filter("ProjNo", FilterOperator.EQ, oViewModel.getProperty("/project")));
				aFilters.push(new Filter("Vendor", FilterOperator.EQ, oViewModel.getProperty("/vendor")));
				if (oViewModel.getProperty("/projType")) {
					aFilters.push(new Filter("ProjType", FilterOperator.EQ, oViewModel.getProperty("/projType")));
				}
			}
			aFilters.push(new Filter("Mode", FilterOperator.EQ, oViewModel.getProperty("/mode")));
			that._openBusyDialog(that.getResourceBundle().getText("ML_LOADING"));
			// that.getModel().read("/MLItemsSet", {
			that.getModel().read("/MLGetAllItemsSet", {
				filters: aFilters,
				urlParameters: {
					"$expand": "GetItems/ItemToSubItems"
				},
				success: jQuery.proxy(function(response) {
					that._closeBusyDialog();
					// oHeader.MLHeaderItems = response.results;
					// oViewModel.setProperty("/MLHeaderItems", response.results);
					// that.originalData = Object.create(response.results[0].GetItems);
					var results = response.results[0].GetItems.results;
					oViewModel.setProperty("/MLHeaderItems", results);
					oViewModel.setProperty("/iItemCount", results ? results.length : 0);
					if (response.results.length > 0) {
						that._buildTreeTableData();
						oViewModel.setProperty("/MakeNo", response.results[0].MlistNo);
					} else {
						oViewModel.setProperty("/makelist", {});
						MessageToast.show(that.getResourceBundle().getText("NO_ITEM_FOUND"));
					}
				}, that),
				error: jQuery.proxy(function() {
					that._closeBusyDialog();
				}, that)
			});
		},

		executeAction: function(that, sPath, params, action) {
			that._openBusyDialog(that.getResourceBundle().getText("SUBMIT_APPR"));
			that.getView().getModel().callFunction(sPath, {
				method: "POST",
				success: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
					if (resp.MsgType === "S") {
						switch (action) {
							case "SUBMIT":
								// this.getView().getModel().refresh();
								break;
							case "APPR":
								break;
						}
						this.bViewEdited = false;
						MessageBox.success(resp.MsgText, {
							onClose: jQuery.proxy(function() {
								if (that.getView().getModel("objectView").getProperty("/mode") === "D") {
									that.onNavBack();
								} else {
									that.onBack();
								}
							}, that)
						});
					} else if (resp.MsgType === "E") {
						MessageBox.error(resp.MsgText, {
							// onClose: jQuery.proxy(function() {
							// 	this.onBack();
							// }, this)
						});
					}
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
				}, that),
				urlParameters: params
			});
		},

		getApproversData: function(that) {
			var oModel = that.getView().getModel("objectView");
			var status = oModel.getProperty("/Status");
			var sPath = (status === "" || status === "CLR") === true ? "/ApproverAgentsListSet" : "/ApproversListSet";
			var aFilters = [];
			if (oModel.getProperty("/mode") === "C") {
				sPath = "/ApproverAgentsListSet";
				aFilters = [new Filter("ProjNo", FilterOperator.EQ, oModel.getProperty("/project"))];
				var projType = oModel.getProperty("/projType");
				if (projType !== undefined && projType !== null) { // && projType !== ""
					aFilters.push(new Filter("ProjType", FilterOperator.EQ, projType));
				}
				aFilters.push(new Filter("Vendor", FilterOperator.EQ, oModel.getProperty("/vendor")));
			} else {
				var makeno = oModel.getProperty("/MakeNo");
				if (makeno && makeno !== "") {
					aFilters.push(new Filter("MListNo", FilterOperator.EQ, makeno));
				}
			}
			that._openBusyDialog(that.getResourceBundle().getText("APPR_LOADING"));
			that.getView().getModel().read(sPath, {
				filters: aFilters,
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					// this._toggleApproversFieldsEditability(data.results);
					oModel.setProperty(sPath, data.results);
					oModel.setProperty("/tableVisibleRowCount", data.results.length === 0 ? 3 : data.results.length);
					that._toggleAgentsFieldsEditability();
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getApproversLogData: function(that) {
			var oModel = that.getView().getModel("objectView");
			var makeno = oModel.getProperty("/MakeNo");
			that._openBusyDialog(that.getResourceBundle().getText("APPR_LOG_APPR"));
			that.getView().getModel().read("/ApproversLogSet", {
				filters: [
					new Filter("MListNo", FilterOperator.EQ, makeno)
				],
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/ApproversLog", data.results);
					oModel.setProperty("/ApproversLogVisibleRowCount", data.results.length);
				}, that),
				error: jQuery.proxy(function() {
					that._closeBusyDialog();
				}, that)
			});
		},

		getPartnerFunctions: function(that) {
			var oModel = that.getView().getModel("objectView");
			var aFilters = [new Filter("ProjNo", FilterOperator.EQ, oModel.getProperty("/project"))];
			that._openBusyDialog(that.getResourceBundle().getText("PARTNER_LOADING"));
			that.getView().getModel().read("/PartnerFunctionF4Set", {
				filters: aFilters,
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/PartnerFunctionSet", data.results);
				}, that),
				error: jQuery.proxy(function(error) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getUserGroups: function(that) {
			var oModel = that.getView().getModel("objectView");
			var aFilters = [new Filter("ProjNo", FilterOperator.EQ, oModel.getProperty("/project"))];
			that._openBusyDialog(that.getResourceBundle().getText("USERG_LOADING"));
			that.getOwnerComponent().getModel().read("/ProjectUsrGrpF4Set", {
				filters: aFilters,
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/ProjectUserGroupSet", data.results);
				}, that),
				error: jQuery.proxy(function(error) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getChangeLogData: function(that) {
			var oModel = that.getView().getModel("objectView");
			// this.getView().setBusy(true);
			that._openBusyDialog(that.getResourceBundle().getText("CHANGELOG_LOADING"));
			that.getView().getModel().read("/ChangeLogSet", {
				filters: [
					new Filter("MListNo", FilterOperator.EQ, oModel.getProperty("/MakeNo"))
				],
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/ChangeLog", data.results);
					oModel.setProperty("/ChangeLogVisibleRowCount", data.results.length);
				}, that),
				error: jQuery.proxy(function() {
					that._closeBusyDialog();
				}, that)
			});
		},

		getAttachments: function(that) {
			var model = that.getView().getModel("objectView");
			var aFilters = [];
			aFilters.push(new Filter("MListNo", FilterOperator.EQ, model.getProperty("/MakeNo")));
			// aFilters.push(new Filter("Counter", FilterOperator.EQ, obj.Matnr));
			that._openBusyDialog(that.getResourceBundle().getText("ATTACH_LOADING"));
			that.getModel().read("/MLAttachmentsSet", {
				filters: aFilters,
				success: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
					that.processAttachListElements(resp.results);
					model.setProperty("/Attachments", resp.results);
				}, that),
				error: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getCountriesList: function(that) {
			var promise = jQuery.Deferred();
			var oModel = that.getView().getModel("objectView");
			that._openBusyDialog(that.getResourceBundle().getText("COUNTRY_LOADING"));
			that.getView().getModel().read("/CountriesF4Set", {
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/CountriesSet", data.results);
					promise.resolve();
				}, that),
				error: jQuery.proxy(function(error) {
					that._closeBusyDialog();
				}, that)
			});
			return promise;
		},

		// *************************************** Sub Items Controller (Materials View) ***********************
		// *****************************************************************************************************
		// getSubItems: function(that, oArgs) {
		// 	var oViewModel = that.getModel("materialView");
		// 	that.getModel().read("/MLSubItemsSet", {
		// 		filters: [new Filter("Matnr", FilterOperator.EQ, oArgs.material),
		// 			// new Filter("MlistNo", FilterOperator.EQ, oArgs.MLId),
		// 			new Filter("ProjNo", FilterOperator.EQ, oArgs.objectId),
		// 			new Filter("PoNum", FilterOperator.EQ, oArgs.po),
		// 			new Filter("Vendor", FilterOperator.EQ, oArgs.vendor),
		// 			new Filter("ProjType", FilterOperator.EQ, oArgs.ProjType),
		// 			new Filter("PoItem", FilterOperator.EQ, oArgs.item),
		// 			new Filter("Mode", FilterOperator.EQ, oArgs.mode),
		// 			new Filter("Section", FilterOperator.EQ, oArgs.section),
		// 			new Filter("SubSection", FilterOperator.EQ, oArgs.subsection)
		// 			// new Filter("Wbs", FilterOperator.EQ, (wbs === undefined || wbs === null) ? '' : wbs)
		// 		],
		// 		success: jQuery.proxy(function(odata) {
		// 			that._closeBusyDialog();
		// 			// var oViewModel = this.getModel("materialView");
		// 			oViewModel.setProperty("/MLSubItemsSet", odata.results);
		// 			var itemQuantity = 0;
		// 			for (var j = 0; j < odata.results.length; j++) {
		// 				if (j === 0) {
		// 					oViewModel.setProperty("/MakeNo", odata.results[j].MlistNo);
		// 					oViewModel.setProperty("/projNo", odata.results[j].ProjNo);
		// 					oViewModel.setProperty("/vendor", odata.results[j].Vendor);
		// 					oViewModel.setProperty("/Status", odata.results[j].Status);
		// 					that.bModeByStatus = that.getModeByStatus(odata.results[j].Status);
		// 					that.getViewMode(that.bModeByStatus, undefined, that);
		// 					// oViewModel.setProperty("/ViewMode", );
		// 				}
		// 				itemQuantity = odata.results[j].ItemQuantity;
		// 				break;
		// 				// }
		// 				// odata.results[j].totalQuantity = Number(itemQuantity) * Number(odata.results[j].Quantity);
		// 			}
		// 			oViewModel.setProperty("/ItemQuantity", Number(itemQuantity).toFixed(2));
		// 			// oViewModel.setProperty("/TotalQuantity", totalQuantity.toFixed(2));
		// 			oViewModel.setProperty("/iItemCount", odata.results.length);
		// 			oViewModel.setProperty("/bCancel", false);
		// 			// that.bindViewMode();
		// 			that.bindMatViewMode();
		// 		}, that),
		// 		error: jQuery.proxy(function(err) {
		// 			that._closeBusyDialog();
		// 			// this.handleErrors(err);
		// 		}, that)
		// 	});
		// },

		/*saveSubItems: function(that) {
			var oViewModel = that.getModel("materialView");
			var items = oViewModel.getProperty("/MLSubItemsSet");
			var mode = oViewModel.getProperty("/DorEmode");
			var header = {
				Matnr: oViewModel.getProperty("/material"),
				MlistNo: mode === "C" ? "0000000000" : oViewModel.getProperty("/MakeNo"),
				ProjNo: oViewModel.getProperty("/projNo"),
				ProjType: oViewModel.getProperty("/pType"),
				Vendor: oViewModel.getProperty("/vendor"),
				PONum: oViewModel.getProperty("/poNum"),
				POItem: oViewModel.getProperty("/poItem"),
				Section: oViewModel.getProperty("/section"),
				SubSection: oViewModel.getProperty("/subsection"),
				Save: "X",
				Mode: mode,
				MaterialDetails: items
			};

			that._openBusyDialog("Saving Sub Items...");
			that.getModel().create("/MaterialHeadSet", header, {
				success: jQuery.proxy(function(data) {
					MessageBox.success("Material saved successfully!");
					that._closeBusyDialog();
				}, that),
				error: jQuery.proxy(function() {
					that._closeBusyDialog();
				}, that)
			});
		},*/

		saveItems: function(oController, action) {
			var promise = jQuery.Deferred();
			var header = oController.getModifiedItems();
			// var oViewModel = that.getModel("materialView");
			// var items = oViewModel.getProperty("/MLSubItemsSet");
			// var mode = oViewModel.getProperty("/DorEmode");
			// var header = {
			// 	Matnr: oViewModel.getProperty("/material"),
			// 	MlistNo: mode === "C" ? "0000000000" : oViewModel.getProperty("/MakeNo"),
			// 	ProjNo: oViewModel.getProperty("/projNo"),
			// 	ProjType: oViewModel.getProperty("/pType"),
			// 	Vendor: oViewModel.getProperty("/vendor"),
			// 	PONum: oViewModel.getProperty("/poNum"),
			// 	POItem: oViewModel.getProperty("/poItem"),
			// 	Section: oViewModel.getProperty("/section"),
			// 	SubSection: oViewModel.getProperty("/subsection"),
			// 	Save: "X",
			// 	Mode: mode,
			// 	MaterialDetails: items
			// };	

			// if(header === null){
			// 	MessageBox.error("Please update approver details before saving!");
			// 	return;
			// }
			if (header) {
				var that = this;
				oController._openBusyDialog(oController.getResourceBundle().getText("SAVING"));
				header.PostType = "SAVE";
				oController.getModel().create("/MLGetAllItemsSet", header, {
					success: jQuery.proxy(function(data) {
						var oViewModel = oController.getModel("objectView");
						// MessageBox.success("Data saved successfully!");
						oController._closeBusyDialog();
						if (oViewModel.getProperty("/mode") === "C") {
							if (data.MlistNo === "0000000000") {
								MessageBox.error(oController.getResourceBundle().getText("SAVE_FAILED"));
								return;
							}
							this.bViewEdited = false;
							// MessageToast.show("Data saved successfully!");
							oViewModel.setProperty("/MakeNo", data.MlistNo);
							// oController.onNavBack();
							MessageBox.success(oController.getResourceBundle().getText("ML_SUCCESS", [data.MlistNo]), {
								// "MakeList# " + data.MlistNo + " successfully created!"
								onClose: jQuery.proxy(function(oAction) {
									if (oAction === "OK") {
										// oController.onNavBack();
										oController.getView().getModel("materialView").setProperty("/Attachments", []);
										oController._navToDisplayPage();
									}
								}, that)
							});
						} else {
							// MessageToast.show("Data saved successfully!");
							this.bViewEdited = false;
							MessageBox.success(oController.getResourceBundle().getText("ML_UPD_SUCCESS", [data.MlistNo]), {
								// "MakeList# " + data.MlistNo + " successfully updated!"
								onClose: jQuery.proxy(function(oAction) {
									if (oAction === "OK") {
										if (action === "SUBMIT") {
											promise.resolve();
										} else {
											// oController.onRefresh();
											that.getChangeLogData(oController);
										}
										oController.getView().getModel("materialView").setProperty("/Attachments", []);
									}
								}, that)
							});
						}
					}, oController),
					error: jQuery.proxy(function() {
						oController._closeBusyDialog();
					}, oController)
				});
				return promise;
			}
			// else {
			// 	MessageBox.information("No Items modified!");
			// }
		},

		submitItems: function(oController) {
			if (oController.validateApprovers() !== "") {
				MessageBox.error(oController.getResourceBundle().getText("MISSING_APPR"), {
					onClose: function() {
						oController.getView().byId("idPageLayout").setSelectedSection(oController.getView().byId("idAgentsEditTab"));
					}
				});
				return;
			}
			var header = oController.getModifiedItems();
			if (header) {
				// var that = this;
				oController._openBusyDialog(oController.getResourceBundle().getText("SAVE_SUBMIT"));
				header.PostType = "SUBMIT";
				oController.getModel().create("/MLGetAllItemsSet", header, {
					success: jQuery.proxy(function(resp) {
						oController._closeBusyDialog();
						var oViewModel = oController.getModel("objectView");

						if (resp.MsgType === "S") {
							this.bViewEdited = false;
							oViewModel.setProperty("/MakeNo", resp.MlistNo);
							MessageBox.success(resp.MsgText, {
								onClose: jQuery.proxy(function() {
									oController._navToDisplayPage();
								}, oController)
							});
						} else if (resp.MsgType === "I") {
							this.bViewEdited = false;
							oViewModel.setProperty("/MakeNo", resp.MlistNo);
							MessageBox.information(resp.MsgText, {
								onClose: jQuery.proxy(function() {
									oController._navToDisplayPage();
								}, oController)
							});
						} else if (resp.MsgType === "E") {
							MessageBox.error(resp.MsgText, {});
						}
					}, oController),
					error: jQuery.proxy(function() {
						oController._closeBusyDialog();
					}, oController)
				});
			}
		},

		getMaterialAttachments: function(that, obj) {
			var model = that.getView().getModel("materialView");
			var oViewModel = that.getModel("objectView");
			var aFilters = [];
			aFilters.push(new Filter("MListNo", FilterOperator.EQ, oViewModel.getProperty("/MakeNo")));
			// aFilters.push(new Filter("Material", FilterOperator.EQ, model.getProperty("/material")));
			aFilters.push(new Filter("SubMaterial", FilterOperator.EQ, obj.Matnr));
			// aFilters.push(new Filter("Counter", FilterOperator.EQ, obj.Counter));
			that._openBusyDialog(that.getResourceBundle().getText("ATTACH_LOADING"));
			that.getModel().read("/MLAttachmentsSet", {
				filters: aFilters,
				success: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
					that.processAttachListElements(resp.results);
					that.processSubItemAttachListData(resp.results);
					model.setProperty("/Attachments", []); // Required inorder to trgigger updateStarted event of the list.
					model.setProperty("/Attachments", resp.results);
					model.refresh();
				}, that),
				error: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
				}, that)
			});
		},

		postMaterialAttachmentFileToBackend: function(that, fileRow) {
			var model = that.getView().getModel("materialView");
			var attached = {
				"MListNo": fileRow.MListNo,
				"PoNum": fileRow.PoNum,
				"Filedata": fileRow.Filedata,
				"Filename": fileRow.Filename,
				"Mimetype": fileRow.Mimetype,
				"Operation": 'I',
				"Material": model.getProperty("/material"),
				"SubMaterial": fileRow.SubMaterial
			};
			that._openBusyDialog("Uploading the attachment...");
			that.getView().getModel().create("/MLAttachmentsSet", attached, {
				success: jQuery.proxy(function(oData, response) {
					that._closeBusyDialog();
					MessageToast.show(that.getResourceBundle().getText("ATT_UPD_SUCCESS"));
					var oSelectedObj = model.getProperty("/AddlInfo");
					this.getMaterialAttachments(that, oSelectedObj);
				}, that),
				error: jQuery.proxy(function(oError) {
					that._closeBusyDialog();
					MessageToast.show(that.getResourceBundle().getText("UPD_FAILED"));
				}, that)
			});
		},

		// *************************************** Display & Create Page Controller *************************************
		// *****************************************************************************************************
		validateMakeList: function(that, mode) {
			var model = that.getView().getModel("displayModel");
			var aFilters = [];
			aFilters.push(new Filter("MListNo", FilterOperator.EQ, model.getProperty("/MakeNo")));
			that._openBusyDialog(that.getResourceBundle().getText("ML_VALID"));
			that.getView().getModel().read("/MLValidateSet", {
				filters: aFilters,
				success: jQuery.proxy(function(odata) {
					that._closeBusyDialog();
					if (odata.results && odata.results[0] && odata.results[0].Exists === 'X') {
						that.toggleButton(odata.results[0]);
						if (model.getProperty("/bCreateButtonEnabled") === false && mode === "E") {
							MessageBox.error(that.getResourceBundle().getText("ML_NO_EDIT", [odata.results[0].StatusText]), {
								// Entered MakeList# has status of '" + odata.results[0].StatusText + "' and cannot be edited!
								title: "Error"
							});
						} else {
							that.navigateToItems(odata.results[0].MListNo, mode);
						}
					} else {
						MessageBox.error(odata.results[0].Message, {
							title: "Error"
						});
					}
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
				}, that)
			});
		},
		validateProject: function(that) {
			var oViewModel = that.getModel("worklistView");
			var sProjID = oViewModel.getProperty("/ProjectID");
			var sVendor = oViewModel.getProperty("/VendorID");
			var sPType = oViewModel.getProperty("/ProjectType");
			that._openBusyDialog(that.getResourceBundle().getText("ML_VALIDATE"));
			that.getView().getModel().read("/MLCheckExistsSet", {
				filters: [new Filter("ProjNo", FilterOperator.EQ, sProjID),
					new Filter("Vendor", FilterOperator.EQ, sVendor),
					new Filter("ProjType", FilterOperator.EQ, sPType)
				],
				success: jQuery.proxy(function(odata) {
					that._closeBusyDialog();
					if (odata.results && odata.results[0] && odata.results[0].Type === 'E') {
						MessageBox.error(odata.results[0].Message, {
							title: "Error"
						});
						return;
					}
					if (odata.results && odata.results[0] && odata.results[0].Exists === 'X') {
						MessageBox.error(that.getResourceBundle().getText("ML_EXISTS", [odata.results[0].MListNo, odata.results[0].StatusText]), {
							// MakeList '" + odata.results[0].MListNo + "' already exists for selected inputs with status '" + odata.results[
							// 0].StatusText + "'. Please try with different inputs!
							title: "Error"
						});
					} else {
						that._showObject();
					}
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
					// this.handleErrors(err);
				}, that)
			});
		},

		_getVendorData: function(that, sProjID) {
			that._openBusyDialog(that.getResourceBundle().getText("VENDOR_LOADING"));
			that.getOwnerComponent().getModel().read("/VendorF4Set", {
				filters: [new sap.ui.model.Filter("ProjectID", sap.ui.model.FilterOperator.EQ, sProjID)],
				success: jQuery.proxy(function(odata) {
					that._closeBusyDialog();
					var oViewModel = that.getModel("worklistView");
					oViewModel.setProperty("/VendorF4Set", odata.results);
					// oViewModel.setSizeLimit(odata.results.length);
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
					// this.handleErrors(err);
				}, that)
			});
		},

		_getProjectTypeData: function(that, sProjID) {
			that._openBusyDialog(that.getResourceBundle().getText("PROJ_LOADING"));
			that.getOwnerComponent().getModel().read("/ProjTypeF4Set", {
				filters: [new sap.ui.model.Filter("ProjectID", sap.ui.model.FilterOperator.EQ, sProjID)],
				success: jQuery.proxy(function(odata) {
					that._closeBusyDialog();
					var oViewModel = that.getModel("worklistView");
					oViewModel.setProperty("/ProjTypeF4Set", odata.results);
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
					// this.handleErrors(err);
				}, that)
			});
		},

		// ******************************* Material Selection - Create Page Methods **********************************
		// ***********************************************************************************************************

		// _getMSVendorData: function(that) {
		// 	// that._openBusyDialog("Loading Vendors...");
		// 	that._vendorValueHelpDialog.setBusy(true);
		// 	that.getView().getModel().read("/MSVendorsListSet", {
		// 		success: jQuery.proxy(function(odata) {
		// 			that._vendorValueHelpDialog.setBusy(false);
		// 			var oViewModel = that.getModel("SelectCreate");
		// 			oViewModel.setProperty("/VendorF4Set", odata.results);
		// 		}, that),
		// 		error: jQuery.proxy(function(err) {
		// 			that._vendorValueHelpDialog.setBusy(false);
		// 			// this.handleErrors(err);
		// 		}, that)
		// 	});
		// }

		_getMSPOData: function(that, vendor) {
			that._openBusyDialog(that.getResourceBundle().getText("PO_LOADING"));
			that.getOwnerComponent().getModel().read("/MSPOListSet", {
				filters: [new sap.ui.model.Filter("Vendor", sap.ui.model.FilterOperator.EQ, vendor)],
				success: jQuery.proxy(function(odata) {
					that._closeBusyDialog();
					var oViewModel = that.getModel("SelectCreate");
					oViewModel.setProperty("/MSPOF4Set", odata.results);
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
					// this.handleErrors(err);
				}, that)
			});
		},

		validateMatSelect: function(that, mode) {
			var model = that.getView().getModel("SelectDisplay");
			// var aFilters = [];
			// aFilters.push(new Filter("MSelNo", FilterOperator.EQ, model.getProperty("/MSelNo")));
			that._openBusyDialog(that.getResourceBundle().getText("MS_VALIDATE"));
			that.getView().getModel().read("/MSValidateSet('" + model.getProperty("/MSelNo") + "')", {
				// filters: aFilters,
				success: jQuery.proxy(function(odata) {
					that._closeBusyDialog();
					if (odata.Exists === 'X') {
						that.toggleButton(odata);
						if (model.getProperty("/bCreateButtonEnabled") === false && mode === "E") {
							MessageBox.error(that.getResourceBundle().getText("MS_NO_EDIT", [odata.StatusText]), {
								// Entered Material Document # has status of '" + odata.StatusText + "' and cannot be edited!
								title: "Error"
							});
						} else {
							if (mode === "E") {
								that.navigateToEditItems(odata.MSelNo);
							} else if (mode === "D") {
								that.navigateToDisplayItems(odata.MSelNo);
							}
						}
					} else {
						MessageBox.error(odata.Message, {
							title: "Error"
						});
					}
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
				}, that)
			});
		},

		validateInputs: function(that) {
			var oViewModel = that.getModel("SelectCreate");
			var sVendor = oViewModel.getProperty("/Vendor");
			var sPO = oViewModel.getProperty("/PoNum");
			that._openBusyDialog(that.getResourceBundle().getText("MS_EXISTS"));
			that.getView().getModel().read("/MSCheckExistsSet(Vendor='" + sVendor + "',PoNum='" + sPO + "')", {
				success: function(odata) {
					that._closeBusyDialog();
					if (odata.Type === 'E') {
						MessageBox.error(odata.Message, {
							title: "Error"
						});
						return;
					}
					if (odata.Exists === 'X') {
						MessageBox.error(that.getResourceBundle().getText("MS_EXISTS_ALREADY", [odata.MSelNo, odata.StatusText]), {
							// Material Selection Number '" + odata.MSelNo + "' already exists for selected inputs with status '" + odata.StatusText +
							// "'. Please try with different inputs!
							title: "Error"
						});
					} else {
						that._showObject();
					}
				}.bind(that),
				error: function(err) {
					that._closeBusyDialog();
					// this.handleErrors(err);
				}.bind(that)
			});
		},

		saveMSItems: function(oController, action) {
			var promise = jQuery.Deferred();
			var header = oController.getModifiedMSItems();
			if (header) {
				var that = this;
				oController._openBusyDialog(oController.getResourceBundle().getText("SAVING"));
				header.PostType = "SAVE";
				oController.getModel().create("/MSHeaderSet", header, {
					success: jQuery.proxy(function(data) {
						var oViewModel = oController.getModel("objectView");
						// MessageBox.success("Data saved successfully!");
						oController._closeBusyDialog();
						if (oViewModel.getProperty("/mode") === "C") {
							if (data.MSelNo === "0000000000" || data.MSelNo === "") {
								MessageBox.error(oController.getResourceBundle().getText("SAVE_FAILED"));
								return;
							}
							this.bViewEdited = false;
							// MessageToast.show("Data saved successfully!");
							oViewModel.setProperty("/MSelNo", data.MSelNo);
							// oController.onNavBack();
							MessageBox.success(oController.getResourceBundle().getText("MS_SUCCESS", [data.MSelNo ]), {
								// Material Selection Document # " + data.MSelNo + " successfully created!
								onClose: jQuery.proxy(function(oAction) {
									if (oAction === "OK") {
										// oController.onNavBack();
										oController.getView().getModel("objectView").setProperty("/Attachments", []);
										oController._navToDisplayPage();
									}
								}, that)
							});
						} else {
							// MessageToast.show("Data saved successfully!");
							this.bViewEdited = false;
							MessageBox.success(oController.getResourceBundle().getText("MS_UPD_SUCCESS", data.MSelNo), {
								// Material Selection Document # " + data.MSelNo + " successfully updated!
								onClose: jQuery.proxy(function(oAction) {
									if (oAction === "OK") {
										if (action === "SUBMIT") {
											promise.resolve();
										} else {
											// oController.onRefresh();
											that.getMSChangeLogData(oController);
											that.getMSAttachments(oController);
										}
										oController.getView().getModel("objectView").setProperty("/Attachments", []);
									}
								}, that)
							});
						}
					}, oController),
					error: jQuery.proxy(function() {
						oController._closeBusyDialog();
					}, oController)
				});
				return promise;
			}
		},

		submitMSItems: function(oController) {
			if (oController.validateApprovers() !== "") {
				MessageBox.error(oController.getResourceBundle().getText("MISSING_APPR"), {
					onClose: function() {
						oController.getView().byId("idPageLayout").setSelectedSection(oController.getView().byId("idAgentsEditTab"));
					}
				});
				return;
			}
			var header = oController.getModifiedMSItems();
			if (header) {
				// var that = this;
				oController._openBusyDialog(oController.getResourceBundle().getText("SAVE_SUBMIT"));
				header.PostType = "SUBMIT";
				oController.getModel().create("/MSHeaderSet", header, {
					success: jQuery.proxy(function(resp) {
						oController._closeBusyDialog();
						var oViewModel = oController.getModel("objectView");
						if (resp.MsgType === "S") {
							this.bViewEdited = false;
							oViewModel.setProperty("/MSelNo", resp.MSelNo);
							MessageBox.success(resp.MsgText, {
								onClose: jQuery.proxy(function() {
									oController._navToDisplayPage();
								}, oController)
							});
						} else if (resp.MsgType === "I") {
							this.bViewEdited = false;
							oViewModel.setProperty("/MSelNo", resp.MSelNo);
							MessageBox.information(resp.MsgText, {
								onClose: jQuery.proxy(function() {
									oController._navToDisplayPage();
								}, oController)
							});
						} else if (resp.MsgType === "E") {
							MessageBox.error(resp.MsgText, {});
						}
					}, oController),
					error: jQuery.proxy(function() {
						oController._closeBusyDialog();
					}, oController)
				});
			}
		},

		getMSChangeLogData: function(that) {
			var oModel = that.getView().getModel("objectView");
			// this.getView().setBusy(true);
			that._openBusyDialog(that.getResourceBundle().getText("CHANGELOG_LOADING"));
			that.getView().getModel().read("/MSChangeLogSet", {
				filters: [
					new Filter("MSelNo", FilterOperator.EQ, oModel.getProperty("/MSelNo"))
				],
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/ChangeLog", data.results);
					oModel.setProperty("/ChangeLogVisibleRowCount", data.results.length);
				}, that),
				error: jQuery.proxy(function() {
					that._closeBusyDialog();
				}, that)
			});
		},

		getMSApproversData: function(that) {
			var oModel = that.getView().getModel("objectView");
			var status = oModel.getProperty("/Status");
			var sPath = (status === "" || status === "CLR") === true ? "/MSApproverAgentsListSet" : "/MSApproversListSet";
			var aFilters = [];
			if (oModel.getProperty("/mode") === "C") {
				sPath = "/MSApproverAgentsListSet";
				// aFilters = [new Filter("MSelNo", FilterOperator.EQ, oModel.getProperty("/MSelNo"))];
				aFilters = [];
				// var projType = oModel.getProperty("/projType");
				// if (projType !== undefined && projType !== null) { // && projType !== ""
				// 	aFilters.push(new Filter("ProjType", FilterOperator.EQ, projType));
				// }
				aFilters.push(new Filter("Vendor", FilterOperator.EQ, oModel.getProperty("/vendor")));
				if (oModel.getProperty("/po") !== undefined && oModel.getProperty("/po") !== "" && oModel.getProperty("/po") !== null) {
					aFilters.push(new Filter("PoNum", FilterOperator.EQ, oModel.getProperty("/po")));
				}
			} else {
				var makesel = oModel.getProperty("/MSelNo");
				if (makesel && makesel !== "") {
					aFilters.push(new Filter("MSelNo", FilterOperator.EQ, makesel));
				}
			}
			that._openBusyDialog(that.getResourceBundle().getText("APPR_LOADING"));
			that.getView().getModel().read(sPath, {
				filters: aFilters,
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					// this._toggleApproversFieldsEditability(data.results);
					oModel.setProperty(sPath, data.results);
					oModel.setProperty("/tableVisibleRowCount", data.results.length === 0 ? 3 : data.results.length);
					that._toggleAgentsFieldsEditability();
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getMSApproversLogData: function(that) {
			var oModel = that.getView().getModel("objectView");
			var makesel = oModel.getProperty("/MSelNo");
			that._openBusyDialog(that.getResourceBundle().getText("APPR_LOG_APPR"));
			that.getView().getModel().read("/MSApproversLogSet", {
				filters: [
					new Filter("MSelNo", FilterOperator.EQ, makesel)
				],
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/MSApproversLogSet", data.results);
					oModel.setProperty("/ApproversLogVisibleRowCount", data.results.length);
				}, that),
				error: jQuery.proxy(function() {
					that._closeBusyDialog();
				}, that)
			});
		},

		getMSAttachments: function(that) {
			var model = that.getView().getModel("objectView");
			var aFilters = [];
			aFilters.push(new Filter("MSelNo", FilterOperator.EQ, model.getProperty("/MSelNo")));
			that._openBusyDialog(that.getResourceBundle().getText("ATTACH_REFRESH"));
			that.getModel().read("/MSAttachmentsSet", {
				filters: aFilters,
				success: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
					that.processAttachListElements(resp.results);
					model.setProperty("/Attachments", resp.results);
				}, that),
				error: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getDescription: function(that, sBusyText, spath, aFilters) {
			var promise = jQuery.Deferred();
			that._openBusyDialog(sBusyText);
			that.getOwnerComponent().getModel().read(spath, {
				filters: aFilters,
				success: jQuery.proxy(function(rsp) {
					that._closeBusyDialog();
					promise.resolve(rsp.results[0]);
				}, that),
				error: jQuery.proxy(function() {
					that._closeBusyDialog();
				}, that)
			});
			return promise;
		},

		getMatSelDoc: function(that) {
			var oViewModel = that.getModel("objectView");
			var sObjectPath = that.getModel().createKey("GetMatSelSet", {
				WiId: oViewModel.getProperty("/WiId")
			});
			that._openBusyDialog(that.getResourceBundle().getText("MS_LOADING"));
			that.getView().getModel().read("/" + sObjectPath, {
				success: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
					oViewModel.setProperty("/MSelNo", resp.MSelNo);
					oViewModel.setProperty("/Level", resp.Level);
					oViewModel.setProperty("/bVisibleFooterButtons", true);
					// oViewModel.setProperty("/bVisibleSubmitButton", false);
					oViewModel.setProperty("/mode", "D");
					that.getHeaderData(resp.MSelNo);
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getMSPartnerFunctions: function(that) {
			var oModel = that.getView().getModel("objectView");
			var aFilters = [];
			aFilters.push(new Filter("Vendor", FilterOperator.EQ, oModel.getProperty("/vendor")));
			aFilters.push(new Filter("PoNum", FilterOperator.EQ, oModel.getProperty("/po")));
			that._openBusyDialog(that.getResourceBundle().getText("PARTNER_LOADING"));
			that.getView().getModel().read("/MSPartnerFunctionF4Set", {
				filters: aFilters,
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/PartnerFunctionSet", data.results);
				}, that),
				error: jQuery.proxy(function(error) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getMSUserGroups: function(that) {
			var oModel = that.getView().getModel("objectView");
			// var aFilters = [];
			// aFilters.push(new Filter("Vendor", FilterOperator.EQ, oModel.getProperty("/vendor")));
			// aFilters.push(new Filter("PoNum", FilterOperator.EQ, oModel.getProperty("/po")));
			that._openBusyDialog(that.getResourceBundle().getText("USERG_LOADING"));
			that.getOwnerComponent().getModel().read("/MSProjectUsrGrpF4Set", {
				// filters: aFilters,
				success: jQuery.proxy(function(data) {
					that._closeBusyDialog();
					oModel.setProperty("/ProjectUserGroupSet", data.results);
				}, that),
				error: jQuery.proxy(function(error) {
					that._closeBusyDialog();
				}, that)
			});
		},

		getMaterialSelDoc: function(that) {
			var oViewModel = that.getModel("objectView");
			var sObjectPath = that.getModel().createKey("GetMatSelSet", {
				WiId: oViewModel.getProperty("/WiId")
			});
			that._openBusyDialog(that.getResourceBundle().getText("MS_DTAILS_LOADING"));
			that.getView().getModel().read("/" + sObjectPath, {
				success: jQuery.proxy(function(resp) {
					that._closeBusyDialog();
					oViewModel.setProperty("/MSelNo", resp.MSelNo);
					oViewModel.setProperty("/Level", resp.Level);
					oViewModel.setProperty("/bVisibleFooterButtons", true);
					if (resp.IsNextLevel === "X") {
						oViewModel.setProperty("/bVisibleNextLevelButton", true);
					} else {
						oViewModel.setProperty("/bVisibleNextLevelButton", false);
					}
					// oViewModel.setProperty("/bVisibleSubmitButton", false);
					oViewModel.setProperty("/mode", "E"); // Allowing EDITability to approvers
					that.getHeaderData(resp.MSelNo);
				}, that),
				error: jQuery.proxy(function(err) {
					that._closeBusyDialog();
				}, that)
			});
		}
	};

});