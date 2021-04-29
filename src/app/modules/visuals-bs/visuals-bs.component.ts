import { Component, OnInit, OnDestroy } from '@angular/core';
import { UrlConfigService } from 'src/app/shared/url-config.service';
import { abbreviateNumber, RMIAPIsService } from '../../shared/rmiapis.service';
import { UserDetailModelService } from '../../shared/user-detail-model.service';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import draggable from 'highcharts/modules/draggable-points';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
import { MatDialog } from '@angular/material';
import { VisualBSInputDialogComponent } from '../visuals-is/input-value-dialog.component';
import { AuthService } from 'src/app/auth.service';
draggable(Highcharts);
const tooltip = {
  backgroundColor: '#5A6574',
  style: {
    color: '#FFFFFF',
  },
  borderWidth: 0,
  borderRadius: 5,
};
const projectionColor = {
  linearGradient: {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 1,
  },
  stops: [
    [0, '#5a656c'],
    [0.2, '#5f777e'],
    [1, '#164a5b'],
  ],
};
const actualColor = {
  linearGradient: {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 1,
  },
  stops: [
    [0, 'rgb(133, 225, 252)'],
    [0.3, 'rgb(105, 185, 234)'],
    [0.6, 'rgb(103, 181, 233)'],
    [1, 'rgb(100, 175, 225)'],
  ],
};
type SelectableCharts =
  | null
  | 'daily-sales'
  | 'inventory-days'
  | 'other-current-assets'
  | 'dasy-payable-outstanding'
  | 'accrued-liabilities'
  | 'other-current-liabilities';
const seriesOption = {
  stickyTracking: true,
  colorByPoint: true,
  fillColor: {
    linearGradient: [0, 0, 0, 300],
    stops: [
      [0, `rgb(22, 68, 91)`],
      [0.5, `rgb(154,198,213)`],
      [1, `rgb(255, 255, 255)`],
    ],
  },
};
@Component({
  selector: 'app-visuals-bs',
  templateUrl: './visuals-bs.component.html',
  styleUrls: ['./visuals-bs.component.scss'],
})
export class VisualsBsComponent implements OnInit {
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  inprogress = true;
  progressBar: boolean;
  DSOOptions: {};
  IDOptions: {};
  OCAOptions: {};
  DPOOptions: {};
  ALOptions: {};
  OCLOptions: {};
  TCAOptions: {};
  TAOptions: {};
  TCLOptions: {};
  TLOptions: {};
  TSEOptions: {};
  TLSEOptions: {};
  yearsArray = [];
  scenarioArray = [];
  scenario = this.UserDetailModelService.getSelectedScenario();
  companyName = this.UserDetailModelService.getSelectedCompany();
  BsfinancialObj = new Map();
  Highcharts = Highcharts;
  companySelected = localStorage.getItem('companySelected');

  loadedScenario = 'Scenario 0';
  // options needed for click events on columns
  selectedChart: SelectableCharts = null;
  selectedYear: number | null;
  modalDefaultValue: number;
  minValue: undefined | number;
  maxValue: undefined | number;
  // update options
  updateDaysOutstandingOption = false;
  updateInventoryDaysOptions = false;
  updateOtherCurrentAssetsOptions = false;
  updateDaysPayableOutstandingOptions = false;
  updateAccruedLibOptions = false;
  updateOtherLibOptions = false;
  saveScenarioNumber: any = 0;
  scenarioSelected: any;
  selectedCompanyName = localStorage.getItem('selectedCompanyName');

  visualsLoaded = false;

  constructor(
    private urlConfig: UrlConfigService,
    private apiService: RMIAPIsService,
    // tslint:disable-next-line:no-shadowed-variable
    private UserDetailModelService: UserDetailModelService,
    public authService: AuthService,
    // tslint:disable-next-line:variable-name
    private _snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    if(this.authService.authServiceLoaded){
      if (this.UserDetailModelService.selectedScenarioIndex >= 0) {
        this.scenario = this.UserDetailModelService.selectedScenarioIndex;
      }
  
      this.initScenario(this.scenario);
  
      this.UserDetailModelService.updateBalanceSheetScenario.subscribe(() => {
        this.initScenario(this.UserDetailModelService.selectedScenarioIndex);
      });
    }else {
      const intervalID = setInterval(() => {
        if (this.authService.authServiceLoaded) {
          this.ngOnInit();
          clearInterval(intervalID);
        }
      }, 100);
    }
  }
  openDialog(): void {
    const dialogRef = this.dialog.open(VisualBSInputDialogComponent, {
      width: '250px',
      data: {
        value: this.modalDefaultValue,
        min: this.minValue,
        max: this.maxValue,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.modalDefaultValue = result;
      if (result) {
        this.updateChart();
      } else {
        this.selectedChart = null;
        this.selectedYear = null;
      }
    });
  }
  updateChart() {
    switch (this.selectedChart) {
      case 'daily-sales':
        this.updateDailySalesChart();
        break;
      case 'inventory-days':
        this.updateInventoryChart();
        break;
      case 'other-current-assets':
        this.updateOtherCurrentAssetsChart();
        break;
      case 'dasy-payable-outstanding':
        this.updateDailyPayableChart();
        break;
      case 'accrued-liabilities':
        this.updateAccruedLiabilityChart();
        break;
      case 'other-current-liabilities':
        this.updateOtherLiabilityChart();
        break;
      default:
        break;
    }
  }
  /**
   * update daily sales chart data
   */
  updateDailySalesChart() {
    const options = this.DSOOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.DSOOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateDaysOutstandingOption = true;
    this.BsfinancialObj.get(this.selectedYear).dso = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update inventory chart data
   */
  updateInventoryChart() {
    const options = this.IDOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.IDOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateInventoryDaysOptions = true;
    this.BsfinancialObj.get(
      this.selectedYear
    ).inventorydays = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update other current assets chart data
   */
  updateOtherCurrentAssetsChart() {
    const options = this.OCAOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.OCAOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateOtherCurrentAssetsOptions = true;
    this.BsfinancialObj.get(
      this.selectedYear
    ).othercurrentassetspercent = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update daily payable chart data
   */
  updateDailyPayableChart() {
    const options = this.DPOOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.DPOOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateDaysOutstandingOption = true;
    this.BsfinancialObj.get(this.selectedYear).dpo = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update accreued liability chart data
   */
  updateAccruedLiabilityChart() {
    const options = this.ALOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.ALOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateAccruedLibOptions = true;
    this.BsfinancialObj.get(
      this.selectedYear
    ).accruedliabilitiespercent = this.modalDefaultValue;
    this.updateProjection();
  }

  /**
   * update other liability chart data
   */
  updateOtherLiabilityChart() {
    const options = this.OCLOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.OCLOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateOtherCurrentAssetsOptions = true;
    this.BsfinancialObj.get(
      this.selectedYear
    ).othercurrentliabilitiespercent = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   *
   * @param scenarioNumber option
   */
  initScenario(scenarioNumber?) {
    this.progressBar = true;

    const that = this;
    const DSOArray = [];
    const IDArray = [];
    const OCAArray = [];
    const DPOArray = [];
    const ALArray = [];
    const OCLArray = [];
    this.yearsArray = [];

    if (scenarioNumber >= 0) {
      this.scenarioSelected = scenarioNumber;
      this.loadedScenario = 'Scenario ' + this.scenarioSelected;
    }

    // this.UserDetailModelService.updatedScenario.next();

    // if(this.UserDetailModelService.selectedScenarioIndex >= 0){
    //   this.scenario = this.UserDetailModelService.selectedScenarioIndex
    //   this.loadedScenario = "Scenario "+this.scenario;
    // }

    this.apiService
      .getData(this.urlConfig.getBsActualsAPI() + this.companySelected)
      .subscribe((res: any) => {
        this.progressBar = true;
        // tslint:disable-next-line:prefer-for-of
        for (let j = 0; j < res.length; j++) {
          this.BsfinancialObj.set(res[j].asof, {
            totalcurrentassets: res[j].totalcurrentassets,
            totalassets: res[j].totalassets,
            totalcurrentliabilities: res[j].totalcurrentliabilities,
            totalliabilities: res[j].totalliabilities,
            totalshareholdersequity: res[j].totalshareholdersequity,
            totalliabilitiesandequity: res[j].totalliabilitiesandequity,
            dso: res[j].dso,
            inventorydays: res[j].inventorydays,
            othercurrentassetspercent: res[j].othercurrentassetspercent,
            dpo: res[j].dpo,
            accruedliabilitiespercent: res[j].accruedliabilitiespercent,
            othercurrentliabilitiespercent:
              res[j].othercurrentliabilitiespercent,
            ppe: res[j].ppe,
            goodwill: res[j].goodwill,
            intangibleassets: res[j].intangibleassets,
            otherassets: res[j].otherassets,
            currentportionlongtermdebt: res[j].currentportionlongtermdebt,
            longtermdebt: res[j].longtermdebt,
            otherliabilities: res[j].otherliabilities,
			totalcurrentassestexcash:res[j].accountsreceivable+res[j].inventories+res[j].othercurrentassets,
			 totalassestexcash:res[j].accountsreceivable+res[j].inventories+res[j].othercurrentassets+res[j].ppe+res[j].goodwill+res[j].intangibleassets+res[j].otherassets,
            // "totalshareholdersequity":res[j].totalshareholdersequity
          });
        }

        this.apiService
          .getData(this.urlConfig.getScenarioAPI() + this.companySelected)
          .subscribe((res: any) => {
            this.scenarioArray = res.scenarios;
            this.UserDetailModelService.setScenarioNumber(this.scenarioArray);
            // this.scenarioSelected = localStorage.getItem('scenarioSelected');
            if (this.scenarioArray.includes(+this.scenarioSelected)) {
              this.loadedScenario = ('Scenario ' +
                this.scenarioSelected) as any;
              this.inprogress = true;
            } else {
              this.scenarioSelected = 0;
              this.loadedScenario = ('Scenario ' +
                this.scenarioSelected) as any;
              this.inprogress = true;
            }
            this.apiService
              .getData(
                this.urlConfig.getBsProjectionsAPIGET() +
                  this.companySelected +
                  '&scenario=' +
                  this.scenarioSelected
              )
              // tslint:disable-next-line:no-shadowed-variable
              .subscribe((res: any) => {
                this.loadedScenario = 'Scenario ' + this.scenarioSelected;
                this.progressBar = false;
                if (Array.isArray(res)) {
                  for (let j = 0; j < res.length; j++) {
                    this.BsfinancialObj.set(res[j].asof, {
                      totalcurrentassets: res[j].totalcurrentassets,
                      totalassets: res[j].totalassets,
                      totalcurrentliabilities: res[j].totalcurrentliabilities,
                      totalliabilities: res[j].totalliabilities,
                      totalshareholdersequity: res[j].totalshareholdersequity,
                      totalliabilitiesandequity:
                        res[j].totalliabilitiesandequity,
                      dso: res[j].dso,
                      inventorydays: res[j].inventorydays,
                      othercurrentassetspercent:
                        res[j].othercurrentassetspercent,
                      dpo: res[j].dpo,
                      accruedliabilitiespercent:
                        res[j].accruedliabilitiespercent,
                      othercurrentliabilitiespercent:
                        res[j].othercurrentliabilitiespercent,
                      scenarioNumber: res[j].scenario,
                      otherliabilities: res[j].otherliabilities,
                      longtermdebt: res[j].longtermdebt,
                      othercurrentliabilities: res[j].othercurrentliabilities,
                      accruedliabilities: res[j].accruedliabilities,
                      accountspayable: res[j].accountspayable,
                      currentportionlongtermdebt:
                        res[j].currentportionlongtermdebt,
                      otherassets: res[j].otherassets,
                      goodwill: res[j].goodwill,
                      intangibleassets: res[j].intangibleassets,
                      ppe: res[j].ppe,
                      inventories: res[j].inventories,
                      accountsreceivable: res[j].accountsreceivable,
                      cashequivalents: res[j].cashequivalents,
                      cogs: res[j].ic_cogs,
                      netincome: res[j].ic_netincome,
                      totalrevenue: res[j].ic_totalrevenue,
                      memocheck: res[j].memocheck,
                      othercurrentassets: res[j].othercurrentassets,
					  totalcurrentassestexcash:res[j].accountsreceivable+res[j].inventories+res[j].othercurrentassets,
			 totalassestexcash:res[j].accountsreceivable+res[j].inventories+res[j].othercurrentassets+res[j].ppe+res[j].goodwill+res[j].intangibleassets+res[j].otherassets,
                      latest: res[j].latest,
                    });
                  }
                }
                this.BsfinancialObj.forEach((v, k) => {
                  this.yearsArray.push(k);
                  DSOArray.push(v.dso == undefined ? 0 : v.dso);
                  IDArray.push(
                    v.inventorydays == undefined ? 0 : v.inventorydays
                  );
                  OCAArray.push(
                    v.othercurrentassetspercent == undefined
                      ? 0
                      : v.othercurrentassetspercent
                  );
                  DPOArray.push(v.dpo == undefined ? 0 : v.dpo);
                  ALArray.push(
                    v.accruedliabilitiespercent == undefined
                      ? 0
                      : v.accruedliabilitiespercent
                  );
                  OCLArray.push(
                    v.othercurrentliabilitiespercent == undefined
                      ? 0
                      : v.othercurrentliabilitiespercent
                  );
                });

                this.DSOOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Days Sales Outstanding' },
                  yAxis: {
                    title: { text: 'Days',
					style: {
                        fontSize: '14px',
                      }  
					},
					labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
                    min: 0,
                    max: 180,
                    tickInterval: 30,
                  },
                  xAxis: { categories: this.yearsArray,
				  labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
				  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: {
                        draggableY: true,
                        dragMaxY: 180,
                        dragMinY: 0,
                      },
                      point: {
                        events: {
                          drag: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            }
                          },
                          drop: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            } else {
                              that.BsfinancialObj.get(e.target.category).dso =
                                e.target.y;
                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'daily-sales';
                            that.selectedYear = this.category;
                            that.modalDefaultValue = +Math.round(this.y).toFixed(0);
                            that.openDialog();
                          },
                        },
                      },
                    },
                    areaspline: {
                      stacking: 'normal',
                      minPointLength: 2,
                      colorByPoint: true,
                      cursor: 'ns-resize',
                      colors: [
                        actualColor,
                        actualColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
						projectionColor,
                      ],
                      borderRadius: 5,
                    },
                  },
                  tooltip: {
                    ...tooltip,
                    formatter() {
                      return Highcharts.numberFormat(this.point.y, 0) + ' Days';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [
                    {
                      data: DSOArray,
                      dragDrop: { draggableY: true },
                      minPointLength: 2,
                    },
                  ],
                  legend: false,
                };
                this.IDOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Inventory Days' },
                  yAxis: {
                    title: { text: 'Days',
					style: {
                        fontSize: '14px',
                      }  
					},
					labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
                    min: 0,
                    max: 180,
                    tickInterval: 30,
                  },
                  xAxis: { categories: this.yearsArray,
				  labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
				  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: {
                        draggableY: true,
                        dragMaxY: 180,
                        dragMinY: 0,
                      },
                      point: {
                        events: {
                          drag: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            }
                          },
                          drop: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            } else {
                              that.BsfinancialObj.get(
                                e.target.category
                              ).inventorydays = e.target.y;
                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'inventory-days';
                            that.selectedYear = this.category;
                            that.modalDefaultValue = +Math.round(this.y).toFixed(0);
                            that.openDialog();
                          },
                        },
                      },
                    },
                    areaspline: {
                      stacking: 'normal',
                      minPointLength: 2,
                      colorByPoint: true,
                      cursor: 'ns-resize',
                      colors: [
                        actualColor,
                        actualColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
						projectionColor,
                      ],
                      borderRadius: 5,
                    },
                  },
                  tooltip: {
                    ...tooltip,
                    formatter: function () {
                      return Highcharts.numberFormat(this.point.y, 0) + ' Days';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [{ data: IDArray, dragDrop: { draggableY: true } }],
                  legend: false,
                };
                this.OCAOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Other Current Assets (% of Revenue)' },
                  yAxis: {
                    title: { text: 'As % of Revenue',
						style: {
                        fontSize: '14px',
                      }  
						},
						labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
                    min: 0,
                    max: 100,
                    tickInterval: 25,
                  },
                  xAxis: { categories: this.yearsArray,
				  labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
				  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: { draggableY: true, dragMaxY: 99, dragMinY: 0 },
                      point: {
                        events: {
                          drag: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            }
                          },
                          drop: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            } else {
                              that.BsfinancialObj.get(
                                e.target.category
                              ).othercurrentassetspercent = e.target.y;
                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'other-current-assets';
                            that.selectedYear = this.category;
                            that.modalDefaultValue = +Math.round(this.y).toFixed(0);
                            that.openDialog();
                          },
                        },
                      },
                    },
                    areaspline: {
                      stacking: 'normal',
                      minPointLength: 2,
                      colorByPoint: true,
                      cursor: 'ns-resize',
                      colors: [
                        actualColor,
                        actualColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
						projectionColor,
                      ],
                      borderRadius: 5,
                    },
                  },
                  tooltip: {
                    ...tooltip,
                    formatter: function () {
                      return Highcharts.numberFormat(this.point.y, 0) + ' %';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [{ data: OCAArray, dragDrop: { draggableY: true } }],
                  legend: false,
                };
                this.DPOOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Days Payable Outstanding' },
                  yAxis: {
                    title: { text: 'Days',
					style: {
                        fontSize: '14px',
                      }  
					},
					labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
                    min: 0,
                    max: 180,
                    tickInterval: 30,
                  },
                  xAxis: { categories: this.yearsArray,
				  labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
				  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: {
                        draggableY: true,
                        dragMaxY: 180,
                        dragMinY: 0,
                      },
                      point: {
                        events: {
                          drag: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            }
                          },
                          drop: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            } else {
                              that.BsfinancialObj.get(e.target.category).dpo =
                                e.target.y;
                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'dasy-payable-outstanding';
                            that.selectedYear = this.category;
                            that.modalDefaultValue = +Math.round(this.y).toFixed(0);
                            that.openDialog();
                          },
                        },
                      },
                    },
                    areaspline: {
                      stacking: 'normal',
                      minPointLength: 2,
                      colorByPoint: true,
                      cursor: 'ns-resize',
                      colors: [
                        actualColor,
                        actualColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
						projectionColor,
                      ],
                      borderRadius: 5,
                    },
                  },
                  tooltip: {
                    ...tooltip,
                    formatter: function () {
                      return Highcharts.numberFormat(this.point.y, 0) + ' Days';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [{ data: DPOArray, dragDrop: { draggableY: true } }],

                  legend: false,
                };
                this.ALOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Accrued Liabilities (% of COGS)' },
                  yAxis: {
                    title: { text: 'As % of COGS',
					style: {
                        fontSize: '14px',
                      }  
					
					},
					
					labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
                    min: 0,
                    max: 100,
                    tickInterval: 25,
                  },
                  xAxis: { categories: this.yearsArray,
				  labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
				  },
                  plotOptions: {
                    series: {
						
                      ...seriesOption,
                      dragDrop: { draggableY: true, dragMaxY: 99, dragMinY: 0 },
                      point: {
                        events: {
                          drag: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            }
                          },
                          drop: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            } else {
                              that.BsfinancialObj.get(
                                e.target.category
                              ).accruedliabilitiespercent = e.target.y;
                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'accrued-liabilities';
                            that.selectedYear = this.category;
                            that.modalDefaultValue = +Math.round(this.y).toFixed(0);
                            that.openDialog();
                          },
                        },
                      },
                    },
                    areaspline: {
                      stacking: 'normal',
                      minPointLength: 2,
                      colorByPoint: true,
                      cursor: 'ns-resize',
                      colors: [
                        actualColor,
                        actualColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
						projectionColor,
                      ],
                      borderRadius: 5,
                    },
                  },
                  tooltip: {
                    ...tooltip,
                    formatter: function () {
                      return Highcharts.numberFormat(this.point.y, 0) + ' %';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [{ data: ALArray, dragDrop: { draggableY: true } }],
                  legend: false,
                };
                this.OCLOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Other Current Liabilities (% of COGS)' },
                  yAxis: {
                    title: { text: 'As % of COGS',
					style: {
                        fontSize: '13px',
                      }
					},
							labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
                    min: 0,
                    max: 100,
                    tickInterval: 25,
                  },
                  xAxis: { categories: this.yearsArray,
				  		labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
				  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: { draggableY: true, dragMaxY: 99, dragMinY: 0 },
                      point: {
                        events: {
                          drag: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            }
                          },
                          drop: function (e) {
                            if (e.target.index == 0 || e.target.index == 1) {
                              return false;
                            } else {
                              that.BsfinancialObj.get(
                                e.target.category
                              ).othercurrentliabilitiespercent = e.target.y;
                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'other-current-liabilities';
                            that.selectedYear = this.category;
                            that.modalDefaultValue = +Math.round(this.y).toFixed(0);
                            that.openDialog();
                          },
                        },
                      },
                    },
                    areaspline: {
                      stacking: 'normal',
                      minPointLength: 2,
                      colorByPoint: true,
                      cursor: 'ns-resize',
                      colors: [
                        actualColor,
                        actualColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
                        projectionColor,
						projectionColor,
                      ],
                      borderRadius: 5,
                    },
                  },
                  tooltip: {
                    ...tooltip,
                    formatter: function () {
                      return Highcharts.numberFormat(this.point.y, 0) + ' %';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [{ data: OCLArray, dragDrop: { draggableY: true } }],
                  legend: false,
                };
                this.updateProjection();

                this.visualsLoaded = true
              }, error => {
                this.visualsLoaded = true

              }); // end of projections
          }, error => {
            this.visualsLoaded = true

          }); // end of Save Scenarios
      }, error => {
        this.visualsLoaded = true

      }); // end of actuals

    HC_exporting(Highcharts);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  updateProjection() {
    const TCAArray = [];
    const TAArray = [];
    const TCLArray = [];
    const TLArray = [];
    const TSEArray = [];
    const TLSEArray = [];
    let lastKey = 0;
    for (const [key, value] of this.BsfinancialObj) {
      if (this.BsfinancialObj.get(key).latest > 0) {
        this.BsfinancialObj.get(
          key
        ).currentportionlongtermdebt = this.BsfinancialObj.get(
          lastKey
        ).currentportionlongtermdebt;
        this.BsfinancialObj.get(key).accountspayable =
          (this.BsfinancialObj.get(key).dpo / 365) *
          this.BsfinancialObj.get(key).cogs;
        this.BsfinancialObj.get(key).accruedliabilities =
          (this.BsfinancialObj.get(key).accruedliabilitiespercent / 100) *
          this.BsfinancialObj.get(key).cogs;
        this.BsfinancialObj.get(key).othercurrentliabilities =
          (this.BsfinancialObj.get(key).othercurrentliabilitiespercent / 100) *
          this.BsfinancialObj.get(key).cogs;
        this.BsfinancialObj.get(key).totalcurrentliabilities =
          this.BsfinancialObj.get(key).currentportionlongtermdebt +
          this.BsfinancialObj.get(key).accountspayable +
          this.BsfinancialObj.get(key).accruedliabilities +
          this.BsfinancialObj.get(key).othercurrentliabilities;
        this.BsfinancialObj.get(key).longtermdebt = this.BsfinancialObj.get(
          lastKey
        ).longtermdebt;
        this.BsfinancialObj.get(key).otherliabilities = this.BsfinancialObj.get(
          lastKey
        ).otherliabilities;
        this.BsfinancialObj.get(key).totalliabilities =
          this.BsfinancialObj.get(key).totalcurrentliabilities +
          this.BsfinancialObj.get(key).longtermdebt +
          this.BsfinancialObj.get(key).otherliabilities;
        this.BsfinancialObj.get(key).totalshareholdersequity =
          this.BsfinancialObj.get(lastKey).totalshareholdersequity +
          this.BsfinancialObj.get(key).netincome;
        this.BsfinancialObj.get(key).totalliabilitiesandequity =
          this.BsfinancialObj.get(key).totalliabilities +
          this.BsfinancialObj.get(key).totalshareholdersequity;
        this.BsfinancialObj.get(key).goodwill = this.BsfinancialObj.get(
          lastKey
        ).goodwill;
        this.BsfinancialObj.get(key).otherassets = this.BsfinancialObj.get(
          lastKey
        ).otherassets;
        this.BsfinancialObj.get(key).intangibleassets = this.BsfinancialObj.get(
          lastKey
        ).intangibleassets;
        this.BsfinancialObj.get(key).ppe = this.BsfinancialObj.get(lastKey).ppe;
        this.BsfinancialObj.get(key).accountsreceivable =
          (this.BsfinancialObj.get(key).dso / 365) *
          this.BsfinancialObj.get(key).totalrevenue;
        this.BsfinancialObj.get(key).inventories =
          (this.BsfinancialObj.get(key).inventorydays / 365) *
          this.BsfinancialObj.get(key).cogs;
        this.BsfinancialObj.get(key).othercurrentassets =
          (this.BsfinancialObj.get(key).othercurrentassetspercent / 100) *
          this.BsfinancialObj.get(key).totalrevenue;
        this.BsfinancialObj.get(key).cashequivalents =
          this.BsfinancialObj.get(key).totalliabilitiesandequity -
          (this.BsfinancialObj.get(key).accountsreceivable +
            this.BsfinancialObj.get(key).inventories +
            this.BsfinancialObj.get(key).othercurrentassets +
            this.BsfinancialObj.get(key).ppe +
            this.BsfinancialObj.get(key).intangibleassets +
            this.BsfinancialObj.get(key).goodwill +
            this.BsfinancialObj.get(key).otherassets);
        this.BsfinancialObj.get(key).totalcurrentassets =
          this.BsfinancialObj.get(key).cashequivalents +
          this.BsfinancialObj.get(key).accountsreceivable +
          this.BsfinancialObj.get(key).inventories +
          this.BsfinancialObj.get(key).othercurrentassets;
		  
		  this.BsfinancialObj.get(key).totalcurrentassestexcash =
          this.BsfinancialObj.get(key).accountsreceivable +
          this.BsfinancialObj.get(key).inventories +
          this.BsfinancialObj.get(key).othercurrentassets;
        this.BsfinancialObj.get(key).totalassets =
          this.BsfinancialObj.get(key).totalcurrentassets +
          this.BsfinancialObj.get(key).ppe +
          this.BsfinancialObj.get(key).intangibleassets +
          this.BsfinancialObj.get(key).goodwill +
          this.BsfinancialObj.get(key).otherassets;
		  this.BsfinancialObj.get(key).totalassestexcash =
		  this.BsfinancialObj.get(key).accountsreceivable +
          this.BsfinancialObj.get(key).inventories +
          this.BsfinancialObj.get(key).othercurrentassets+
          this.BsfinancialObj.get(key).ppe +
          this.BsfinancialObj.get(key).intangibleassets +
          this.BsfinancialObj.get(key).goodwill +
          this.BsfinancialObj.get(key).otherassets;
      }
      TCAArray.push(this.BsfinancialObj.get(key).totalcurrentassestexcash);
      TAArray.push(this.BsfinancialObj.get(key).totalassets);
      TCLArray.push(this.BsfinancialObj.get(key).totalcurrentliabilities);
      TLArray.push(this.BsfinancialObj.get(key).totalliabilities);
      TSEArray.push(this.BsfinancialObj.get(key).totalassestexcash);
      TLSEArray.push(this.BsfinancialObj.get(key).totalliabilitiesandequity);
      lastKey = key;
    }

    this.TCAOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Total Current Assets (Excluding Cash)' },
      yAxis: { title: { text: 'USD (in billions)',
	style: {
                        fontSize: '14px',
                      }  
	  },
				labels: {
					formatter: function() {
          return this.value /1000  + 'B';
        },
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      xAxis: { categories: this.yearsArray,
	labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },

	},
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: [
            actualColor,
            actualColor,
            projectionColor,
            projectionColor,
            projectionColor,
            projectionColor,
			projectionColor,
          ],
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter: function () {
          return Highcharts.numberFormat(this.point.y, 0) + ' millions';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: TCAArray }],
      legend: false,
    };
    this.TAOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Total Assets' },
      yAxis: { title: { text: 'USD (in billions)',
	style: {
                        fontSize: '14px',
                      }  
	  },
				labels: {
					formatter: function() {
          return this.value /1000  + 'B';
        },
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      xAxis: { categories: this.yearsArray,
	  		labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: [
            actualColor,
            actualColor,
            projectionColor,
            projectionColor,
            projectionColor,
            projectionColor,
			projectionColor,
          ],
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter: function () {
          return Highcharts.numberFormat(this.point.y, 0) + ' millions';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: TAArray }],
      legend: false,
    };
    this.TCLOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Total Current Liabilities' },
      yAxis: { title: { text: 'USD (in billions)',
	  style: {
                        fontSize: '14px',
                      }  
	  },
				labels: {
					formatter: function() {
          return this.value /1000  + 'B';
        },
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      xAxis: { categories: this.yearsArray,
	  		labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: [
            actualColor,
            actualColor,
            projectionColor,
            projectionColor,
            projectionColor,
            projectionColor,
			projectionColor,
          ],
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter: function () {
          return Highcharts.numberFormat(this.point.y, 0) + ' millions';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: TCLArray }],
      legend: false,
    };
    this.TLOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Total Liabilities' },
      yAxis: { title: { text: 'USD (in billions)',
	  style: {
                        fontSize: '14px',
                      }
					  },
		labels: {
			formatter: function() {
          return this.value /1000  + 'B';
        },
                      style: {
                        fontSize: '13px',
                      }
                    },					  
					  
			},
      xAxis: { categories: this.yearsArray,
	  		labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: [
            actualColor,
            actualColor,
            projectionColor,
            projectionColor,
            projectionColor,
			projectionColor,
            projectionColor,
          ],
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter: function () {
          return Highcharts.numberFormat(this.point.y, 0) + ' millions';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: TLArray }],
      legend: false,
    };
    this.TSEOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Total Assets (Excluding Cash)' },
      yAxis: { title: { text: 'USD (in billions)',
		style: {
                        fontSize: '14px',
                      }  
	  },
				labels: {
					formatter: function() {
          return this.value /1000  + 'B';
        },
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      xAxis: { categories: this.yearsArray,
		labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: [
            actualColor,
            actualColor,
            projectionColor,
            projectionColor,
            projectionColor,
            projectionColor,
			projectionColor,
          ],
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter: function () {
          return Highcharts.numberFormat(this.point.y, 0) + ' millions';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: TSEArray }],
      legend: false,
    };
    this.TLSEOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Total Liabilities & Shareholders Equity' },
      yAxis: { title: { text: 'USD (in billions)',
	  style: {
                        fontSize: '14px',
                      }  
	  },
		labels: {
			formatter: function() {
          return this.value /1000  + 'B';
        },
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      xAxis: { categories: this.yearsArray,
	  		labels: {
                      style: {
                        fontSize: '13px',
                      }
                    },
	  },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: [
            actualColor,
            actualColor,
            projectionColor,
            projectionColor,
            projectionColor,
            projectionColor,
			projectionColor,
          ],
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter: function () {
          return Highcharts.numberFormat(this.point.y, 0) + ' millions';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: TLSEArray }],
      legend: false,
    };
  }

  saveScenario() {
    this.apiService
      .getData(this.urlConfig.getScenarioAPI() + this.companySelected)
      .subscribe((res: any) => {
        if (this.scenarioSelected == 0) {
          this.saveScenarioNumber = res.scenarios.length;
          this.scenarioSelected = res.scenarios.length;
        } else {
          this.saveScenarioNumber = this.scenarioSelected;
        }

        this.loadedScenario = ('Scenario ' + this.scenarioSelected) as any;
        const inputArray = [];
        for (const [key, value] of this.BsfinancialObj) {
          const inputObj: any = {};
          if (this.BsfinancialObj.get(key).latest > 0) {
            inputObj.accountspayable = this.BsfinancialObj.get(
              key
            ).accountspayable;
            inputObj.accountsreceivable = this.BsfinancialObj.get(
              key
            ).accountsreceivable;
            inputObj.accruedliabilities = this.BsfinancialObj.get(
              key
            ).accruedliabilities;
            inputObj.accruedliabilitiespercent = this.BsfinancialObj.get(
              key
            ).accruedliabilitiespercent;
            inputObj.asof = key.toString();
            inputObj.cashequivalents = this.BsfinancialObj.get(
              key
            ).cashequivalents;
            inputObj.companyname = this.companySelected;
            inputObj.currentportionlongtermdebt = this.BsfinancialObj.get(
              key
            ).currentportionlongtermdebt;
            inputObj.dpo = this.BsfinancialObj.get(key).dpo;
            inputObj.dso = this.BsfinancialObj.get(key).dso;
            inputObj.goodwill = this.BsfinancialObj.get(key).goodwill;
            inputObj.cogs = this.BsfinancialObj.get(key).cogs;
            inputObj.netincome = this.BsfinancialObj.get(key).netincome;
            inputObj.totalrevenue = this.BsfinancialObj.get(key).totalrevenue;
            inputObj.intangibleassets = this.BsfinancialObj.get(
              key
            ).intangibleassets;
            inputObj.inventories = this.BsfinancialObj.get(key).inventories;
            inputObj.inventorydays = this.BsfinancialObj.get(key).inventorydays;
            inputObj.latest = this.BsfinancialObj.get(key).latest;
            inputObj.longtermdebt = this.BsfinancialObj.get(key).longtermdebt;
            inputObj.memocheck = this.BsfinancialObj.get(key).memocheck;
            inputObj.otherassets = this.BsfinancialObj.get(key).otherassets;
            inputObj.othercurrentassets = this.BsfinancialObj.get(
              key
            ).othercurrentassets;
            inputObj.othercurrentassetspercent = this.BsfinancialObj.get(
              key
            ).othercurrentassetspercent;
            inputObj.othercurrentliabilities = this.BsfinancialObj.get(
              key
            ).othercurrentliabilities;
            inputObj.othercurrentliabilitiespercent = this.BsfinancialObj.get(
              key
            ).othercurrentliabilitiespercent;
            inputObj.otherliabilities = this.BsfinancialObj.get(
              key
            ).otherliabilities;
            inputObj.ppe = this.BsfinancialObj.get(key).ppe;

            inputObj.totalassets = this.BsfinancialObj.get(key).totalassets;
            inputObj.totalcurrentassets = this.BsfinancialObj.get(
              key
            ).totalcurrentassets;
            inputObj.totalcurrentliabilities = this.BsfinancialObj.get(
              key
            ).totalcurrentliabilities;
            inputObj.totalliabilities = this.BsfinancialObj.get(
              key
            ).totalliabilities;
            inputObj.totalliabilitiesandequity = this.BsfinancialObj.get(
              key
            ).totalliabilitiesandequity;
            inputObj.totalshareholdersequity = this.BsfinancialObj.get(
              key
            ).totalshareholdersequity;
			inputObj.totalassestexcash = this.BsfinancialObj.get(
              key
            ).totalassets;
			inputObj.totalcurrentassestexcash = this.BsfinancialObj.get(
              key
            ).totalcurrentassestexcash;
            inputObj.scenario = this.saveScenarioNumber;
            inputArray.push(inputObj);
          }
        }
        this.apiService
          .postData(
            this.urlConfig.getBsProjectionsAPIPOST() + this.companySelected,
            JSON.stringify(inputArray)
          )
          .subscribe((res: any) => {
            console.log(res);
            if (res.message == '') {
              this._snackBar.openFromComponent(uploadSnackBarBSComponent, {
                duration: 5000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
              });
            } else {
              this._snackBar.openFromComponent(
                uploadFailureSnackBarBSComponent,
                {
                  duration: 5000,
                  horizontalPosition: this.horizontalPosition,
                  verticalPosition: this.verticalPosition,
                }
              );
            }
          });
        this.initScenario(this.scenarioSelected);
      });
  }
  addScenario() {
    const existingScenarios = this.UserDetailModelService.getScenarioNumber();
    if (existingScenarios.length < 9) {
      this.scenario = existingScenarios.length;
      this._snackBar.openFromComponent(uploadSnackBarBSAddComponent, {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
      //loading default scenario
      this.initScenario(0);
    } else {
      this._snackBar.openFromComponent(uploadFailureSnackBarBSAddComponent, {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
    }
  }
  loadScenario(index: number) {
    this.loadedScenario = 'Scenario ' + index;
    this.scenario = index;
    this.initScenario(index);
  }
}

@Component({
  selector: 'snackBar',
  templateUrl: 'snackBar.html',
  styles: [
    `
      .snackBar {
        color: #fff;
      }
      b {
        color: #fff !important;
      }
      .material-icons {
        color: lightgreen;
      }
    `,
  ],
})
export class uploadSnackBarBSComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}

@Component({
  selector: 'snackBar',
  templateUrl: 'snackBar.html',
  styles: [
    `
      .snackBar {
        color: #fff;
      }
      b {
        color: #fff !important;
      }
      .material-icons {
        color: lightgreen;
      }
    `,
  ],
})
export class uploadFailureSnackBarBSComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}

@Component({
  selector: 'snackBarAddScenario',
  templateUrl: 'snackBarAddScenario.html',
  styles: [
    `
      .snackBar {
        color: #fff;
      }
      b {
        color: #fff !important;
      }
      .material-icons {
        color: lightgreen;
      }
    `,
  ],
})
export class uploadSnackBarBSAddComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}

@Component({
  selector: 'snackBarAddScenarioFailure',
  templateUrl: 'snackBarAddScenarioFailure.html',
  styles: [
    `
      .snackBar {
        color: #fff;
      }
      b {
        color: #fff !important;
      }
      .material-icons {
        color: lightgreen;
      }
    `,
  ],
})
export class uploadFailureSnackBarBSAddComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}
