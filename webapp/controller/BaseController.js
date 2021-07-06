sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Controller, MessageBox, JSONModel, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("ps.dewa.makelist.MakeList.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Adds a history entry in the FLP page history
		 * @public
		 * @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
		 * @param {boolean} bReset If true resets the history before the new entry is added
		 */
		addHistoryEntry: (function() {
			var aHistoryEntries = [];
			return function(oEntry, bReset) {
				if (bReset) {
					aHistoryEntries = [];
				}
				var bInHistory = aHistoryEntries.some(function(entry) {
					return entry.intent === oEntry.intent;
				});
				if (!bInHistory) {
					aHistoryEntries.push(oEntry);
					if (this.getOwnerComponent().getService("ShellUIService")) {
						this.getOwnerComponent().getService("ShellUIService").then(function(oService) {
							oService.setHierarchy(aHistoryEntries);
						});
					}
				}
			};
		})(),

		_addRouteHistory: function(title, intent, bReset) {
			// Add the items page to the flp routing history
			this.addHistoryEntry({
				title: title,
				icon: "sap-icon://enter-more",
				intent: "#MakeList-display&" + intent
			}, bReset ? bReset : false);
		},

		getValueHelpDialog: function(sName) {
			var valueHelpDialog = sap.ui.xmlfragment(this.getResourceBundle().getText("FRAG_PATH") + sName, this); // ps/dewa/makelist/MakeList/fragments/
			this.getView().addDependent(valueHelpDialog);
			return valueHelpDialog;
		},

		getMLValueHelpDialog: function(sName) {
			var valueHelpDialog = sap.ui.xmlfragment(this.getResourceBundle().getText("ML_FRAG_PATH") + sName, this); // ps/dewa/makelist/MakeList/fragments/ML/
			this.getView().addDependent(valueHelpDialog);
			return valueHelpDialog;
		},

		getMSValueHelpDialog: function(sName) {
			var valueHelpDialog = sap.ui.xmlfragment(this.getResourceBundle().getText("MS_FRAG_PATH") + sName, this); // ps/dewa/makelist/MakeList/fragments/MS/
			this.getView().addDependent(valueHelpDialog);
			return valueHelpDialog;
		},

		getModeByStatus: function(status) {
			var bEditableByStatus;
			if (status === "" // Saved
				|| status === this.getResourceBundle().getText("STATUS_CLAR_REQ") // Clarification Required  
			) {
				bEditableByStatus = true;
			} else if (
				status === this.getResourceBundle().getText("STATUS_SUBMITTED") // Submitted
				|| status === this.getResourceBundle().getText("STATUS_APPROVED") // Approved
				|| status === this.getResourceBundle().getText("STATUS_IN_APPROVAL") // In Approval
				|| status === this.getResourceBundle().getText("STATUS_REVIEW") // Under Review
				|| status === this.getResourceBundle().getText("STATUS_REJECTED") // Cancelled
			) {
				bEditableByStatus = false;
			}
			return bEditableByStatus;
		},
		getViewMode: function(viewModeByStatus, viewMode, that) {
			if (that.bAuthEditable === true) {
				if (viewModeByStatus === true) {
					// if (viewMode === "E" || viewMode === "C") {
					that.bViewMode = true;
					// } else {
					// 	this.bViewMode = false;
					// }
				} else {
					that.bViewMode = false;
				}
			} else {
				that.bViewMode = false;
			}
		},
		// setPageMode: function(mode, bEditableByStatus) {
		// 	if ((mode === "E" || mode === "C") && bEditableByStatus === true) {
		// 		return true;
		// 	} else {
		// 		return false;
		// 	}
		// },

		_getAuthorization: function() {
			var promise = jQuery.Deferred();
			this.getView().setBusy(true);
			this.getOwnerComponent().getModel().read("/MLAuthCheckSet('D')", {
				success: jQuery.proxy(function(rsp) {
						this.getView().setBusy(false);
						this.bAuthEditable = (rsp.Accessable === 'E' || rsp.Accessable === 'C') ? true : false;
						var model = new JSONModel({});
						model.setProperty("/bAuthEditable", this.bAuthEditable);
						this.getOwnerComponent().setModel(model, "Auth");
						// if(!this.bAuthEditable){
						// 	MessageBox.error("User is not authorized to edit!", callBack());
						// }
						promise.resolve(rsp);
					}, this)
					// async: false
			});
			return promise;
		},

		_getBusyDialog: function() {
			if (!this._busyDialog) {
				this._busyDialog = sap.ui.xmlfragment(this.getResourceBundle().getText("FRAG_PATH") + "BusyDialog", this); // ps/dewa/makelist/MakeList/fragments/
				this.getView().addDependent(this._busyDialog);
			}
		},

		_openBusyDialog: function(msg) {
			this._busyDialog.setText(msg);
			this._busyDialog.open();
		},

		_closeBusyDialog: function() {
			this._busyDialog.close();
		},

		processAttachListElements: function(list) {
			for (var i = 0; i < list.length; i++) {
				var sType = list[i].MimeType;
				if (sType) {
					if (sType.includes("pdf") || sType.includes("PDF")) {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_PDF"); // sap-icon://pdf-attachment
					} else if (sType.includes("sheet") || sType.includes("xls") || sType.includes("XLS")) {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_EXCEL"); // sap-icon://excel-attachment
					} else if (sType.includes("text") || sType.includes("txt") || sType.includes("TXT")) {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_TEXT"); // sap-icon://attachment-text-file
					} else if (sType.includes("word") || sType.includes("doc") || sType.includes("DOC")) {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_DOC"); // sap-icon://doc-attachment
					} else if (sType.includes("ppt") || sType.includes("power") || sType.includes("PPT") || sType.includes("PPTX") || sType.includes(
							"pptx")) {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_PPT"); // sap-icon://ppt-attachment
					} else if (sType.includes("png") || sType.includes("jpg") || sType.includes("jpeg") || sType.includes("bmp") || sType.includes(
							"image")) {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_IMAGE"); // sap-icon://attachment-photo
					} else if (sType.includes("zip") || sType.includes("rar")) {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_ZIP"); // sap-icon://attachment-zip-file
					} else if (sType.includes("vsd") || sType.includes("vds")) {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_VDS"); // sap-icon://vds-file
					} else {
						list[i].FileIcon = this.getResourceBundle().getText("ICON_ATTACHMENT"); // sap-icon://attachment
					}
				}
			}
		},

		_clearTableFilters: function(oTable) {
			oTable.getBinding().filter(null, "Application");
			var aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				oTable.filter(aColumns[i], null);
			}
		},

		_clearTableSortings: function(oTable) {
			oTable.getBinding().sort(null);
			var aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				aColumns[i].setSorted(false);
			}
		},

		_SetClearFATCheckboxes: function(table, bSelect) {
			var items = table.getRows();
			var check = bSelect === true ? "X" : "";
			for (var i = 0; i < items.length; i++) {
				if (items[i].getBindingContext("objectView")) {
					items[i].getBindingContext("objectView").getObject().FAT = check;
				} else {
					return;
				}
			}
		},

		_SetClearSATCheckboxes: function(table, bSelect) {
			var items = table.getRows();
			var check = bSelect === true ? "X" : "";
			for (var i = 0; i < items.length; i++) {
				if (items[i].getBindingContext("objectView")) {
					items[i].getBindingContext("objectView").getObject().SAT = check;
				} else {
					return;
				}
			}
		},

		_filterF4List: function(sValue, oList, aFields) {
			var contains = FilterOperator.Contains;
			var filters = new sap.ui.model.Filter(aFields.map(function(colName) {
				return new sap.ui.model.Filter(colName, contains, sValue);
			}), false);
			oList.getBinding("items").filter(filters, sap.ui.model.FilterType.Application);
		},

		getDocDownloadURL: function(sPath, obj) {
			var sUrl = this.getView().getModel().sServiceUrl + this.getView().getModel().createKey(sPath, {
				Docclass: obj.Docclass,
				DocGuid: obj.DocGuid
			}) + "/$value";
			return sUrl;
		},

		onBack: function() {
			window.history.back();
		}

		// _throwError: function(msg, callBack){
		// 	MessageBox.error(msg, callBack());
		// }
	});

});