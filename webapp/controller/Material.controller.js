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
], function(
	BaseController, JSONModel, History, formatter, Filter, FilterOperator, MessageBox, MessageToast, Data) {
	"use strict";
	return BaseController.extend("ps.dewa.makelist.MakeList.controller.Material", {
		formatter: formatter,
		onInit: function() {
			var oViewModel = new JSONModel({
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
					// ListSeparators.All,
					// "showSeparators": ListSeparators.All,
			});

			// this.getRouter().getRoute("editmat").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "materialView");
			// this.byId("idUploadCollection").addEventDelegate({
			// 	onBeforeRendering: function() {
			// 		var aItems = this.byId("idUploadCollection").getItems();
			// 		this.getModel("materialView").setProperty("attachmentsCount", aItems.length);
			// 	}.bind(this)
			// });
			// this.getOwnerComponent().getModel().metadataLoaded().then(function () {
			// 		// Restore original busy indicator delay for the object view
			// 		oViewModel.setProperty("/delay", iOriginalBusyDelay);
			// 	}
			// );

			if (this.getOwnerComponent().getModel("Auth"))
				this.bAuthEditable = this.getOwnerComponent().getModel("Auth").getProperty("/bAuthEditable");
			// if (this.bAuthEditable === undefined) {
			// 	var getAuth = this._getAuthorization();
			// 	getAuth.then(jQuery.proxy(function(data) {
			// 		this.getRouter().getRoute("material").attachPatternMatched(this._onObjectMatched, this);
			// 	}, this));
			// } else {
			this.getRouter().getRoute("material").attachPatternMatched(this._onObjectMatched, this);
			// }
			this._getBusyDialog();
			// var oBusyModel = new JSONModel({
			// 	title: "",
			// 	msg: ""
			// });
			// this.getView().setModel(oBusyModel, "busy");
		},

		_onObjectMatched: function(oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			// var sObjectId = oArgs.objectId;
			// var poNum = oArgs.po;
			// var wbs = oEvent.getParameter("arguments").wbs;
			// var vendor = oArgs.vendor;
			var material = oArgs.material;
			var oViewModel = this.getModel("materialView");
			oViewModel.setProperty("/bAddlInfoPanelVisible", false);
			oViewModel.setProperty("/bAttachmentsPanelVisible", false);
			oViewModel.setProperty("/projNo", oArgs.objectId);
			oViewModel.setProperty("/pType", oArgs.ProjType);
			oViewModel.setProperty("/vendor", oArgs.vendor);
			// oViewModel.setProperty("/MakeNo", oArgs.MLId);
			oViewModel.setProperty("/material", material);
			oViewModel.setProperty("/poNum", oArgs.po);
			oViewModel.setProperty("/poItem", oArgs.item);
			oViewModel.setProperty("/DorEmode", oArgs.mode);
			oViewModel.setProperty("/section", oArgs.section);
			oViewModel.setProperty("/subsection", oArgs.subsection);
			oViewModel.setProperty("/mode", (oArgs.mode === "D" || oArgs.mode === undefined || oArgs.mode === null) ? false : true);
			this._openBusyDialog("Loading Sub Items..."); //this.getView().setBusy(true);
			// if (MakeNo) {
			// 	sObjectPath = this.getModel().createKey("GetMLHeadSet", {
			// 		MlistNo: MakeNo,
			// 		Mode: this.getModel("objectView").getProperty("/mode"),
			// 		Random: Math.floor(Math.random() * 1000000).toString() // Random value everytime - to distinguish view binding everytime
			// 	});
			// }
			// this.getModel().read("/MLSubItemsSet", {

			// });
			this.getView().byId("idMatTable").clearSelection();
			this.getView().byId("fileUploader").setValue("");
			Data.getSubItems(this, oArgs);

			// this.getModel().metadataLoaded().then(function() {
			// 	var sObjectPath = this.getModel().createKey("MLHeaderSet", {
			// 		ProjNo: sObjectId,
			// 		MlistNo: "X"
			// 	});
			// 	this._bindView("/" + sObjectPath); // + "/MLHeaderItems"
			// }.bind(this));
			this._addRouteHistory(this.getResourceBundle().getText("materialViewTitle"), "/MLHeaderSet/" + oArgs.objectId + "/" + oArgs.vendor +
				"/" + oArgs.ProjType + "/MLSubItems/" + material +
				"/" + oArgs.po + "/" + oArgs.item + "/" + oArgs.mode + "/" + oArgs.section + "/" + oArgs.subsection);
			// /MLHeaderSet/N-00206/203966//MLSubItems/T132CABL02/3091800020/00126/E/N-00206-3-02-20-02/N-00206-3-02-20-02-01
		},

		bindViewMode: function() {
			var oViewModel = this.getModel("materialView");
			var mode = oViewModel.getProperty("/DorEmode");
			// var bViewMode = oViewModel.getProperty("/ViewMode");
			// if (mode === "D" && bViewMode === true) {
			if (mode === "D" && this.bModeByStatus === true) { // && this.bViewMode === true) {
				oViewModel.setProperty("/bEdit", true);
				oViewModel.setProperty("/bSave", false);
				// } else if ((mode === "E" || mode === "C") && bViewMode === true) {
			} else if ((mode === "E" || mode === "C") && this.bModeByStatus === true) { // && this.bViewMode === true) {
				oViewModel.setProperty("/bEdit", false);
				oViewModel.setProperty("/bSave", true);
			} else {
				oViewModel.setProperty("/bEdit", false);
				oViewModel.setProperty("/bSave", false);
			}
		},

		onSave: function() {
			Data.saveSubItems(this);
		},

		onSelectDelIndCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("materialView").getPath();
			oSrc.getModel("materialView").setProperty(sPath + "/DelInd", isSelected === true ? 'X' : '');

		},

		onSelectFatCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("materialView").getPath();
			oSrc.getModel("materialView").setProperty(sPath + "/Fat", isSelected === true ? 'X' : '');
		},

		onSelectSatCheckBox: function(evt) {
			var isSelected = evt.getParameter("selected");
			var oSrc = evt.getSource();
			var sPath = oSrc.getBindingContext("materialView").getPath();
			oSrc.getModel("materialView").setProperty(sPath + "/Sat", isSelected === true ? 'X' : '');
		},

		onClearFilters: function() {
			var oTable = this.getView().byId("idTable");
			this._clearTableFilters(oTable);
		},
		onClearSortings: function() {
			var oTable = this.getView().byId("idTable");
			this._clearTableSortings(oTable);
		},

		onDisplayAdditionalInfo: function(evt) {
			if (evt.getParameter("userInteraction") !== undefined && evt.getParameter("userInteraction") === false) { // rowIndex = -1
				return;
			}
			var oSelectedObj, model = this.getView().getModel("materialView");
			if (evt.getParameter("row")) {
				oSelectedObj = evt.getParameter("row").getBindingContext("materialView").getObject();
			} else {
				if (evt.getParameter("rowContext")) {
					oSelectedObj = evt.getParameter("rowContext").getObject();
				}
			}
			model.setProperty("/AddlInfo", oSelectedObj);
			model.setProperty("/bAddlInfoPanelVisible", true);
			model.setProperty("/bAttachmentsPanelVisible", true);
			if (oSelectedObj.Used === "X") {
				model.setProperty("/bUploaderEnabled", true);
			} else {
				model.setProperty("/bUploaderEnabled", false);
			}
			// this.getAttachments(oSelectedObj);
			Data.getMaterialAttachments(this, oSelectedObj);
		},

		onChangeBOMQty: function(evt) {
			evt.getSource().getModel("materialView").refresh();
		},

		// handleErrors: function(error){
		// 	MessageBox.error(error.message, {	// JSON.parse(error.response.body).error.message.value
		// 		title: "Error"
		// 	});
		// },

		// Start of Attachments Methods****************************************************************************
		// ********************************************************************************************************
		onUpload: function() {
			var oFileUploader = this.getView().byId("fileUploader");
			var oDomRef = oFileUploader.getFocusDomRef();
			var file = oDomRef.files[0];
			if (oDomRef.files.length === 0) {
				MessageToast.show("Please click on Browse button to select the file/s");
				return;
			}
			if (file.size > "3145728") {
				var oVar = "Please note that the maximum attachment size should not exceed 3 MB." +
					" You are advised to use Adobe Acrobat to compress the attachment size and attach again." +
					" For further assistance, please contact IT Service Desk on 51555.";
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
			oReader.onload = jQuery.proxy(function(evt) {
				var vContent = evt.currentTarget.result.replace("data:" + file.type + ";base64,", "");
				if (file.type === "application/pdf") {
					fileIcon = "sap-icon://pdf-attachment";
				} else if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
					fileIcon = "sap-icon://card";
				} else if (file.type === "application/msword" ||
					file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
					fileIcon = "sap-icon://doc-attachment";
				} else {
					fileIcon = "sap-icon://attachment";
				}
				// MessageToast.show("File has been added");
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
					PoNum: model.getProperty("/poNum"),
					Material: model.getProperty("/material"),
					SubMaterial: model.getProperty("/AddlInfo/Matnr"),
					Mimetype: fileType,
					Filename: fileName,
					Filedata: vContent,
					FileSizeTxt: ofileSizeTxt,
					FileIcon: fileIcon
						// folderid: 
						// Operation: "I"
						// Mode
				};

				// var filesData = model.getProperty("/Attachments");
				// // if the data is in good format
				// if (typeof filesData !== "undefined" && filesData !== null && filesData.length > 0) {
				// 	filesData.push(fileRow);
				// } else {
				// 	// if data is not good, append blank line to table
				// 	filesData = [];
				// 	// Append Empty Row
				// 	filesData.push(fileRow);
				// }
				// // Set Model
				// model.setProperty("/Attachments", filesData);
				// this.postFileToBackend(fileRow);
				Data.postMaterialAttachmentFileToBackend(this, fileRow);
			}, this);
			oReader.readAsDataURL(file);
		},

		onListDelete: function(oEvent) {
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
						// data.splice(index, 1);
						// model.setProperty("/Attachments", data);
						MessageToast.show("Attachment Deleted Successfully!");
						var oSelectedObj = model.getProperty("/AddlInfo");
						// this.getAttachments(oSelectedObj);
						Data.getMaterialAttachments(this, oSelectedObj);
					}, this),
					error: jQuery.proxy(function(oErr) {
						this._closeBusyDialog(); //this.getView().setBusy(false);
					}, this)
				});
			} else {
				// var removed = oData.files.splice(iIndex, 1);
				data.splice(index, 1);
				model.setProperty("/Attachments", data);
			}
		},

		onListItemPressed: function(evt) {
			// var oSelectedItem = evt.getParameter("listItem");
			var oObj = evt.getSource().getBindingContext("materialView").getObject(); // .SubMaterial;
			// aFilters.push(new Filter("MListNo", FilterOperator.EQ, obj.MlistNo));
			// aFilters.push(new Filter("Material", FilterOperator.EQ, model.getProperty("/material")));
			// aFilters.push(new Filter("SubMaterial", FilterOperator.EQ, obj.Matnr));
			// this.getView().setBusy(true);
			this.onDisplayAttachment(oObj);
			// this.getModel().read("/GetMLMatAttachSet('" + sMat + "')", {
			// 	success: jQuery.proxy(function(resp) {
			// 		this.getView().setBusy(false);
			// 		this._displayAttachment(resp);
			// 	}, this),
			// 	error: jQuery.proxy(function(resp) {
			// 		this.getView().setBusy(false);
			// 	}, this)
			// });
		},

		onTableUpdateFinished: function(evt) {
			var oList = evt.getSource();
			var oItems = oList.getItems();
			var obj, oDeleteControl;
			for (var i = 0; i < oItems.length; i++) {
				oDeleteControl = oItems[i].getDeleteControl();
				obj = oItems[i].getBindingContext("materialView").getObject();
				if (obj.BOMAttach === "X") {
					oDeleteControl.setEnabled(false);
				} else {
					oDeleteControl.setEnabled(true);
				}
			}
		},

		onDisplayAttachment: function(obj) {
			// var obj = evt.getSource().getBindingContext("materialView").getObject();
			// var sSource = obj.Link;
			// var sSource = this.getView().getBindingContext().getPath() + "/GetMLMatAttachSet('" + obj.SubMaterial + "')/$value";
			var sSource = this.getView().getModel().sServiceUrl + this.getView().getModel().createKey("/GetMLMatAttachSet", {
				SubMaterial: obj.Material,
				Counter: obj.Counter
			}) + "/$value";
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
			var deviceModel = this.getModel("device");
			if (deviceModel.getProperty("/system/desktop") === true)
				sap.m.URLHelper.redirect(sSource, true);
			else
				sap.m.URLHelper.redirect(sSource, true);
			// }
		}

	});

});