sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./Popover4", "./popover_2", "./Popover3",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Popover4, popover_2, Popover3, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.manageProducts.controller.page_2", {
		handleRouteMatched: function(oEvent) {
			var sAppId = "App663af2ee14b1387880e80373";

			var oParams = {
				"expand": "EnglishDescription"
			};

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

			if (!this.sContext) {
				this.sContext = "ProductSet('SH-001')";
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
		_onFioriObjectPageHeaderPress: function() {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			var oQueryParams = this.getQueryParameters(window.location);

			if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("default", true);
			}

		},
		getQueryParameters: function(oLocation) {
			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},
		formatImageVisibilityFromImageSource: function(sImageSource) {
			var bIsVisible = false;
			if (sImageSource && sImageSource.indexOf("sap-icon://") === -1) {
				bIsVisible = true;
			}
			return bIsVisible;

		},
		formatIconVisibilityFromImageSource: function(sImageSource) {
			var bIsVisible = false;
			if (sImageSource && sImageSource.indexOf("sap-icon://") !== -1) {
				bIsVisible = true;
			}
			return bIsVisible;

		},
		_onFioriObjectPageActionButtonPress: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("page_3", oBindingContext, fnResolve, "");
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
		_onFioriObjectPageActionButtonPress1: function(oEvent) {

			oEvent = jQuery.extend(true, {}, oEvent);
			return new Promise(function(fnResolve) {
					fnResolve(true);
				})
				.then(function(result) {
					return new Promise(function(fnResolve) {
						sap.m.MessageBox.confirm("Delete Product ?", {
							title: "Delete",
							actions: ["Delete", "Cancel"],
							onClose: function(sActionClicked) {
								fnResolve(sActionClicked === "Delete");
							}
						});
					});

				}.bind(this))
				.then(function(result) {
					if (result === false) {
						return false;
					} else {

						var oSource = oEvent.getSource();
						var oSourceBindingContext = oSource.getBindingContext();

						return new Promise(function(fnResolve, fnReject) {
							if (oSourceBindingContext) {
								var oModel = oSourceBindingContext.getModel();
								var fnSync = function() {
									oModel.detachRequestCompleted(fnRefreshCompleted);
									oModel.detachRequestFailed(fnRefreshFailed);
								};
								var fnRefreshCompleted = function() {
									fnSync();
									fnResolve();
								};
								var fnRefreshFailed = function() {
									fnSync();
									fnReject(new Error("refresh failed"));
								};
								var fnResolveAfterRefresh = function() {
									oModel.attachRequestCompleted(fnRefreshCompleted);
									oModel.attachRequestFailed(fnRefreshFailed);
									oModel.refresh(true, true);
								};

								oModel.remove(oSourceBindingContext.getPath(), {
									success: function() {
										fnResolveAfterRefresh();
									},
									error: function() {
										oModel.refresh();
										fnReject(new Error("remove failed"));
									}
								});
							}
						});

					}
				}.bind(this))
				.then(function(result) {
					if (result === false) {
						return false;
					} else {

						var oBindingContext = oEvent.getSource().getBindingContext();

						return new Promise(function(fnResolve) {

							this.doNavigate("page_1", oBindingContext, fnResolve, "");
						}.bind(this));

					}
				}.bind(this)).catch(function(err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});
		},
		_onFioriObjectPageActionButtonPress2: function() {
			alert("Not Implemented Yet!");

		},
		_onFioriObjectPageActionButtonPress3: function(oEvent) {

			var sPopoverName = "Popover4";
			this.mPopovers = this.mPopovers || {};
			var oPopover = this.mPopovers[sPopoverName];

			if (!oPopover) {
				oPopover = new Popover4(this.getView());
				this.mPopovers[sPopoverName] = oPopover;

				oPopover.getControl().setPlacement("Bottom");

				// For navigation.
				oPopover.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oPopover.open(oSource);

		},
		formatStateFromCriticality: function(sCriticality) {
			var sIcon;
			switch (sCriticality) {
				case "Negative":
					sIcon = "Error";
					break;
				case "Critical":
					sIcon = "Warning";
					break;
				case "Positive":
					sIcon = "Success";
					break;
			}
			return sIcon;

		},
		formatIconFromCriticality: function(sCriticality) {
			var sIcon;
			switch (sCriticality) {
				case "Negative":
					sIcon = "sap-icon://status-negative";
					break;
				case "Critical":
					sIcon = "sap-icon://status-critical";
					break;
				case "Positive":
					sIcon = "sap-icon://status-positive";
					break;
			}
			return sIcon;

		},
		formatFractionDigitFromValue: function(sValue) {
			var sNumber;
			if (isNaN(sValue)) {
				sNumber = sValue;
			} else {
				sNumber = Number(sValue).toFixed(2);
			}
			return sNumber;

		},
		_onButtonPress: function(oEvent) {

			var oSource = oEvent.getSource();
			var oSourceBindingContext = oSource.getBindingContext();

			return new Promise(function(fnResolve, fnReject) {
				if (oSourceBindingContext) {
					var oModel = oSourceBindingContext.getModel();

					var oData = oModel._getObject("", oSourceBindingContext, true);

					if (!oData) {
						oModel.read(oSourceBindingContext.sPath, {
							success: function(oData) {
								var sKey = oModel.getKey(oData);
								oData["Quantity"]--
									oModel.update('/' + sKey, oData, {
										success: fnResolve,
										error: fnReject,
										refreshAfterChange: true
									});
							},
							error: fnReject
						});
					} else {
						var sKey = oModel.getKey(oData);
						oData["Quantity"]--
							oModel.update('/' + sKey, oData, {
								success: fnResolve,
								error: fnReject,
								refreshAfterChange: true
							});
					}
				}
			});

		},
		_onButtonPress1: function(oEvent) {

			var oSource = oEvent.getSource();
			var oSourceBindingContext = oSource.getBindingContext();

			return new Promise(function(fnResolve, fnReject) {
				if (oSourceBindingContext) {
					var oModel = oSourceBindingContext.getModel();

					var oData = oModel._getObject("", oSourceBindingContext, true);

					if (!oData) {
						oModel.read(oSourceBindingContext.sPath, {
							success: function(oData) {
								var sKey = oModel.getKey(oData);
								oData["Quantity"]++
									oModel.update('/' + sKey, oData, {
										success: fnResolve,
										error: fnReject,
										refreshAfterChange: true
									});
							},
							error: fnReject
						});
					} else {
						var sKey = oModel.getKey(oData);
						oData["Quantity"]++
							oModel.update('/' + sKey, oData, {
								success: fnResolve,
								error: fnReject,
								refreshAfterChange: true
							});
					}
				}
			});

		},
		_onOverflowToolbarButtonPress: function(oEvent) {

			var sPopoverName = "popover_2";
			this.mPopovers = this.mPopovers || {};
			var oPopover = this.mPopovers[sPopoverName];

			if (!oPopover) {
				oPopover = new popover_2(this.getView());
				this.mPopovers[sPopoverName] = oPopover;

				oPopover.getControl().setPlacement("Bottom");

				// For navigation.
				oPopover.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oPopover.open(oSource);

		},
		_onOverflowToolbarButtonPress1: function() {
			alert("Not Implemented Yet");

		},
		_onOverflowToolbarButtonPress2: function() {
			alert("Not Implemented Yet");

		},
		_onOverflowToolbarButtonPress3: function() {
			alert("Not Implemented Yet");

		},
		_onOverflowToolbarButtonPress4: function() {
			alert("Not Implemented Yet");

		},
		_onOverflowToolbarButtonPress5: function(oEvent) {

			var sPopoverName = "Popover3";
			this.mPopovers = this.mPopovers || {};
			var oPopover = this.mPopovers[sPopoverName];

			if (!oPopover) {
				oPopover = new Popover3(this.getView());
				this.mPopovers[sPopoverName] = oPopover;

				oPopover.getControl().setPlacement("Bottom");

				// For navigation.
				oPopover.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oPopover.open(oSource);

		},
		applyFiltersAndSorters: function(sControlId, sAggregationName, chartBindingInfo) {
			if (chartBindingInfo) {
				var oBindingInfo = chartBindingInfo;
			} else {
				var oBindingInfo = this.getView().byId(sControlId).getBindingInfo(sAggregationName);
			}
			var oBindingOptions = this.updateBindingOptions(sControlId);
			this.getView().byId(sControlId).bindAggregation(sAggregationName, {
				model: oBindingInfo.model,
				path: oBindingInfo.path,
				parameters: oBindingInfo.parameters,
				template: oBindingInfo.template,
				templateShareable: true,
				sorter: oBindingOptions.sorters,
				filters: oBindingOptions.filters
			});

		},
		updateBindingOptions: function(sCollectionId, oBindingData, sSourceId) {
			this.mBindingOptions = this.mBindingOptions || {};
			this.mBindingOptions[sCollectionId] = this.mBindingOptions[sCollectionId] || {};

			var aSorters = this.mBindingOptions[sCollectionId].sorters;
			var aGroupby = this.mBindingOptions[sCollectionId].groupby;

			// If there is no oBindingData parameter, we just need the processed filters and sorters from this function
			if (oBindingData) {
				if (oBindingData.sorters) {
					aSorters = oBindingData.sorters;
				}
				if (oBindingData.groupby || oBindingData.groupby === null) {
					aGroupby = oBindingData.groupby;
				}
				// 1) Update the filters map for the given collection and source
				this.mBindingOptions[sCollectionId].sorters = aSorters;
				this.mBindingOptions[sCollectionId].groupby = aGroupby;
				this.mBindingOptions[sCollectionId].filters = this.mBindingOptions[sCollectionId].filters || {};
				this.mBindingOptions[sCollectionId].filters[sSourceId] = oBindingData.filters || [];
			}

			// 2) Reapply all the filters and sorters
			var aFilters = [];
			for (var key in this.mBindingOptions[sCollectionId].filters) {
				aFilters = aFilters.concat(this.mBindingOptions[sCollectionId].filters[key]);
			}

			// Add the groupby first in the sorters array
			if (aGroupby) {
				aSorters = aSorters ? aGroupby.concat(aSorters) : aGroupby;
			}

			var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, true)] : undefined;
			return {
				filters: aFinalFilters,
				sorters: aSorters
			};

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("page_2").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			var oView = this.getView(),
				oData = {},
				self = this;
			var oModel = new sap.ui.model.json.JSONModel();
			oView.setModel(oModel, "staticDataModel");
			self.oBindingParameters = {};

			oData["Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-1489998041435-sectionContent-sap_m_VBox-1489998099163-items-sap_chart_ColumnChart-1490000879535"] = {};

			oData["Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-1489998041435-sectionContent-sap_m_VBox-1489998099163-items-sap_chart_ColumnChart-1490000879535"]["data"] = [{
				"dim0": "India",
				"mea0": "296",
				"__id": 0
			}, {
				"dim0": "Canada",
				"mea0": "133",
				"__id": 1
			}, {
				"dim0": "USA",
				"mea0": "489",
				"__id": 2
			}, {
				"dim0": "Japan",
				"mea0": "270",
				"__id": 3
			}, {
				"dim0": "Germany",
				"mea0": "350",
				"__id": 4
			}];

			self.oBindingParameters['Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-1489998041435-sectionContent-sap_m_VBox-1489998099163-items-sap_chart_ColumnChart-1490000879535'] = {
				"path": "ChartData",
				"parameters": {
					"entitySet": "ProductSet"
				}
			};

			oData["Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-1489998041435-sectionContent-sap_m_VBox-1489998099163-items-sap_chart_ColumnChart-1490000879535"]["vizProperties"] = {
				"plotArea": {
					"dataLabel": {
						"visible": true,
						"hideWhenOverlap": true
					}
				}
			};

			oView.getModel("staticDataModel").setData(oData, true);

			function dateDimensionFormatter(oDimensionValue, sTextValue) {
				var oValueToFormat = sTextValue !== undefined ? sTextValue : oDimensionValue;
				if (oValueToFormat instanceof Date) {
					var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
						style: "short"
					});
					return oFormat.format(oValueToFormat);
				}
				return oValueToFormat;
			}

			var aDimensions = oView.byId("Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-1489998041435-sectionContent-sap_m_VBox-1489998099163-items-sap_chart_ColumnChart-1490000879535").getDimensions();
			aDimensions.forEach(function(oDimension) {
				oDimension.setTextFormatter(dateDimensionFormatter);
			});

		},
		onExit: function() {

			// to destroy templates for bound aggregations when templateShareable is true on exit to prevent duplicateId issue
			var aControls = [{
				"controlId": "Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-2-sectionContent-Fiori_ObjectPage_Table-1",
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

		},
		onAfterRendering: function() {

			var oChart,
				self = this,
				oBindingParameters = this.oBindingParameters,
				oView = this.getView();

			oView.getModel(undefined).getMetaModel().loaded().then(function() {
				oChart = oView.byId("Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-1489998041435-sectionContent-sap_m_VBox-1489998099163-items-sap_chart_ColumnChart-1490000879535");
				var oParameters = oBindingParameters['Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-1489998041435-sectionContent-sap_m_VBox-1489998099163-items-sap_chart_ColumnChart-1490000879535'];

				oChart.bindData(oBindingParameters['Fiori_ObjectPage_ObjectPage_0-sections-Fiori_ObjectPage_Section-1489998041435-sectionContent-sap_m_VBox-1489998099163-items-sap_chart_ColumnChart-1490000879535']);

			});

		}
	});
}, /* bExport= */ true);
