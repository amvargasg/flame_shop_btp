sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./Popover1",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Popover1, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.manageProducts.controller.page_1", {
		handleRouteMatched: function(oEvent) {
			var sAppId = "App663af2ee14b1387880e80373";

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function(oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

		},
		_onFioriListReportTableItemPress: function(oEvent) {

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext();

			return new Promise(function(fnResolve) {
				this.doNavigate("page_2", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet, sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		_onFioriListReportTableUpdateFinished: function(oEvent) {
			var oTable = oEvent.getSource();
			var oHeaderbar = oTable.getAggregation("headerToolbar");
			if (oHeaderbar && oHeaderbar.getAggregation("content")[1]) {
				var oTitle = oHeaderbar.getAggregation("content")[1];
				if (oTable.getBinding("items") && oTable.getBinding("items").isLengthFinal()) {
					oTitle.setText("(" + oTable.getBinding("items").getLength() + ")");
				} else {
					oTitle.setText("(1)");
				}
			}

		},
		_onFioriListReportActionButtonPress: function(oEvent) {

			var oTable = oEvent.getSource().getParent().getParent();
			return new Promise(function(fnResolve, fnReject) {
				if (oTable instanceof sap.m.Table) {
					var aItems = oTable.getSelectedItems();
					var aPromises = [];
					var oModel = oTable.getModel();
					aItems.forEach(function(oItem) {
						aPromises.push(new Promise(function(fnResolve1, fnReject1) {
							oModel.remove(oItem.getBindingContext().getPath(), {
								success: fnResolve1,
								error: fnReject1
							});
						}));
					});
					return Promise.all(aPromises).then(function() {
						oModel.refresh();
						fnResolve();
					});
				} else {
					fnReject(new Error("can't find selected items on provided collection"));
				}
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onFioriListReportUrlColumnPress: function(oEvent) {

			var sPopoverName = "Popover1";
			this.mPopovers = this.mPopovers || {};
			var oPopover = this.mPopovers[sPopoverName];

			if (!oPopover) {
				oPopover = new Popover1(this.getView());
				this.mPopovers[sPopoverName] = oPopover;

				oPopover.getControl().setPlacement("Auto");

				// For navigation.
				oPopover.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oPopover.open(oSource);

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("page_1").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.oFilterBar = null;
			this.oFilterBar = this.getView().byId("ListReportFilterBar");
			var oBasicSearch = new sap.m.SearchField({
				showSearchButton: true
			});
			this.oFilterBar.setBasicSearch(oBasicSearch);

		},
		onExit: function() {

			// to destroy templates for bound aggregations when templateShareable is true on exit to prevent duplicateId issue
			var aControls = [{
				"controlId": "Fiori_ListReport_ListReport_0-content-Fiori_ListReport_Table-1",
				"groups": ["items"]
			}];
			for (var i = 0; i < aControls.length; i++) {
				var oControl = this.getView().byId(aControls[i].controlId);
				if (oControl) {
					for (var j = 0; j < aControls[i].groups.length; j++) {
						var sAggregationName = aControls[i].groups[j];
						var oBindingInfo = oControl.getBindingInfo(sAggregationName);
						if (oBindingInfo) {
							var oTemplate = oBindingInfo.template;
							oTemplate.destroy();
						}
					}
				}
			}

		}
	});
}, /* bExport= */ true);
