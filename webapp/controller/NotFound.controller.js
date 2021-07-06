sap.ui.define([
		"ps/dewa/makelist/MakeList/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("ps.dewa.makelist.MakeList.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);