import { Component, OnInit } from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { UrlConfigService } from 'src/app/shared/url-config.service';
import { RMIAPIsService } from '../../shared/rmiapis.service';
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
import { VisualBSInputDialogComponent } from './input-value-dialog.component';
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
  | 'revenue-growth'
  | 'cogs-percent'
  | 'sga-percent'
  | 'dna-percent'
  | 'oincome-expense-percent'
  | 'net-interest-expense';

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
  selector: 'app-visuals-is',
  templateUrl: './visuals-is.component.html',
  styleUrls: ['./visuals-is.component.scss'],
})
export class VisualsISComponent implements OnInit {
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  inprogress: boolean = true;
  progressBar: boolean;
  RGOptions: {};
  COGSOptions: {};
  SGAOptions: {};
  DAOptions: {};
  OIEOptions: {};
  NIEOptions: {};
  PTROptions: {};
  PGPOptions: {};
  PEBITOptions: {};
  PEBITDAOptions: {};
  PEBTOptions: {};
  PNIOptions: {};
  yearsArray = [];
  actualDriversColors = [];
  projectionsYearsArray = [];
  scenarioArray = [];
  driversColors = [];
  scenario = this.UserDetailModelService.getSelectedScenario();
  companyName = this.UserDetailModelService.getSelectedCompany();
  financialObj = new Map();
  Highcharts = Highcharts;
  loadedScenario: string = 'Scenario 0';
  companySelected = localStorage.getItem('companySelected');
  // options needed for click events on columns
  selectedChart: SelectableCharts = null;
  selectedYear: number | null;
  modalDefaultValue: number;
  minValue: undefined | number;
  maxValue: undefined | number;
  // update options
  updateRGBOption = false;
  updateCogsOptions = false;
  updateSGAOptions = false;
  updateDAOptions = false;
  updateIEOOptions = false;
  updateNIEOptions = false;
  saveScenarioNumber: any = 0;
  scenarioSelected: any;
  selectedCompanyName = localStorage.getItem('selectedCompanyName');

  visualsLoaded = false;

  constructor(
    private urlConfig: UrlConfigService,
    private apiService: RMIAPIsService,
    public authService: AuthService,
    // tslint:disable-next-line:no-shadowed-variable
    private UserDetailModelService: UserDetailModelService,
    // tslint:disable-next-line:variable-name
    private _snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    if (this.authService.authServiceLoaded) {
      if (this.UserDetailModelService.selectedScenarioIndex >= 0) {
        this.scenario = this.UserDetailModelService.selectedScenarioIndex;
      }

      this.initScenario(this.scenario);

      this.UserDetailModelService.updateIncomeSheetScenario.subscribe(() => {
        this.initScenario(this.UserDetailModelService.selectedScenarioIndex);
      });
    } else {
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
      //this.minValue = undefined;
      //this.maxValue = undefined;
    });
  }
  updateChart() {
    switch (this.selectedChart) {
      case 'revenue-growth':
        this.updateRevenueChart();
        break;
      case 'cogs-percent':
        this.updateCogsChart();
        break;
      case 'sga-percent':
        this.updateSGAChart();
        break;
      case 'dna-percent':
        this.updateDNAChart();
        break;
      case 'oincome-expense-percent':
        this.updateOtherIncomeChart();
        break;
      case 'net-interest-expense':
        this.updateNetInterestChart();
        break;
      default:
        break;
    }
  }
  /**
   * update revenue chart data
   */
  updateRevenueChart() {
    const options = this.RGOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.RGOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateRGBOption = true;
    this.financialObj.get(
      this.selectedYear
    ).revenueGrowth = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update cogs chart
   */
  updateCogsChart() {
    const options = this.COGSOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.COGSOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateCogsOptions = true;
    this.financialObj.get(this.selectedYear).COGS = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update SGA Chart
   */
  updateSGAChart() {
    const options = this.SGAOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.SGAOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateSGAOptions = true;
    this.financialObj.get(this.selectedYear).COGS = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update DNA Chart
   */
  updateDNAChart() {
    const options = this.DAOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.DAOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateDAOptions = true;
    this.financialObj.get(this.selectedYear).COGS = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update other income Chart
   */
  updateOtherIncomeChart() {
    const options = this.OIEOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.OIEOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateIEOOptions = true;
    this.financialObj.get(this.selectedYear).COGS = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update other income Chart
   */
  updateNetInterestChart() {
    const options = this.NIEOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.NIEOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateNIEOptions = true;
    this.financialObj.get(this.selectedYear).COGS = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * Initiate Scenario
   * @param scenarioNumber optional
   */
  initScenario(scenarioNumber?) {
    this.progressBar = true;
    const that = this;
    const RGArray = [];
    const COGSArray = [];
    const SGAArray = [];
    const DAArray = [];
    const OIEArray = [];
    const NIEArray = [];
    this.yearsArray = [];
    this.projectionsYearsArray = [];
    let previousAmount;
    if (scenarioNumber >= 0) {
      this.scenarioSelected = scenarioNumber;
      if (this.scenarioSelected == null) {
        this.scenarioSelected = '0';
      }
      this.loadedScenario = 'Scenario ' + this.scenarioSelected;
    }
    this.apiService
      .getData(this.urlConfig.getIsActualsAPI() + this.companySelected)
      .subscribe((res: any) => {
        // tslint:disable-next-line:prefer-for-of
        for (let j = 0; j < res.length; j++) {
          if (res[j].latest === 0) {
            previousAmount = res[j].totalrevenue;
          }
          this.financialObj.set(res[j].asof, {
            totalRevenue: res[j].totalrevenue,
            p_GrossProfit: res[j].grossprofit,
            p_EBIT: res[j].ebit,
            p_EBITDA: res[j].ebitda,
            p_EBT: res[j].ebt,
            p_NetInCome: res[j].netincome,
            latest: res[j].latest,
            revenuepercent: res[j].revenuepercent,
            sgapercent: res[j].sgapercent,
            cogspercent: res[j].cogspercent,
            dapercent: res[j].dapercent,
            netIterestExpense: res[j].netinterest,
          });
        }
        this.apiService
          .getData(this.urlConfig.getScenarioAPI() + this.companySelected)
          .subscribe((res: any) => {
            this.scenarioArray = res.scenarios;
            this.UserDetailModelService.setScenarioNumber(this.scenarioArray);
            this.scenarioSelected = localStorage.getItem('scenarioSelected');
            if (res.scenarios.includes(Number(this.scenarioSelected))) {
              this.inprogress = false;
            } else {
              this.scenarioSelected = '0';
              localStorage.setItem('scenarioSelected', this.scenarioSelected);
              this.inprogress = true;
            }
            this.apiService
              .getData(
                this.urlConfig.getIsProjectionsAPIGET() +
                  this.companySelected +
                  '&scenario=' +
                  this.scenarioSelected
              )
              .subscribe((res: any) => {
                this.progressBar = false;
                if (this.scenarioSelected == null) {
                  this.scenarioSelected = '0';
                }
                this.loadedScenario = 'Scenario ' + this.scenarioSelected;

                let totalRevenue = 0;
                for (let j = 0; j < res.length; j++) {
                  if (j == 0) {
                    totalRevenue = Math.round(
                      previousAmount +
                        previousAmount * (res[j].revenuepercent / 100)
                    );
                  } else {
                    totalRevenue = Math.round(
                      res[j - 1].totalRevenue +
                        res[j - 1].totalRevenue * (res[j].revenuepercent / 100)
                    );
                  }
                  this.financialObj.set(res[j].asof, {
                    totalRevenue,
                    revenueGrowth: res[j].revenuepercent,
                    COGS: res[j].cogspercent,
                    SGAndA: res[j].sgapercent,
                    DAndA: res[j].dapercent,
                    netIterestExpense: res[j].netinterestdollars,
                    otherIncomeOrExpense: res[j].otherincomepercent,
                    netinterest: res[j].netinterest,
                    latest: res[j].latest,
                    taxes: res[j].taxespercent,
                    // "latest" : res[j].latest
                    revenuepercent: res[j].revenuepercent,
                    sgapercent: res[j].sgapercent,
                    cogspercent: res[j].cogspercent,
                    dapercent: res[j].dapercent,
                  });
                }
                this.financialObj.forEach((v, k) => {
                  this.yearsArray.push(k);
                  this.projectionsYearsArray.push(k);
                  RGArray.push(
                    v.revenuepercent == undefined
                      ? 0
                      : +v.revenuepercent.toFixed(0)
                  );
                  COGSArray.push(
                    v.cogspercent == undefined ? 0 : +v.cogspercent.toFixed(0)
                  );
                  SGAArray.push(
                    v.sgapercent == undefined ? 0 : +v.sgapercent.toFixed(0)
                  );
                  DAArray.push(
                    v.dapercent == undefined ? 0 : +v.dapercent.toFixed(0)
                  );
                  OIEArray.push(
                    v.otherincomepercent == undefined
                      ? 0
                      : +v.otherincomepercent.toFixed(0)
                  );
                  NIEArray.push(
                    v.netIterestExpense == undefined
                      ? 0
                      : +v.netIterestExpense.toFixed(0)
                  );
                });
                console.log('years array', this.yearsArray);
                RGArray.shift();
                COGSArray.shift();
                SGAArray.shift();
                DAArray.shift();
                OIEArray.shift();
                NIEArray.shift();

                this.projectionsYearsArray.shift();
                if (this.projectionsYearsArray.length == 6) {
                  this.driversColors = [
                    actualColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                  ];
                } else {
                  this.driversColors = [
                    actualColor,
                    actualColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                  ];
                }

                if (this.yearsArray.length == 7) {
                  this.actualDriversColors = [
                    actualColor,
                    actualColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                  ];
                } else {
                  this.actualDriversColors = [
                    actualColor,
                    actualColor,
                    actualColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                    projectionColor,
                  ];
                }

                console.log(
                  'projection years array',
                  this.projectionsYearsArray
                );
                const _this = this;
                this.RGOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Revenue Growth' },
                  yAxis: {
                    title: {
                      text: 'In Percentage %',
                      style: {
                        fontSize: '14px',
                      },
                    },
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },

                    min: -150,
                    max: 150,
                    tickInterval: 50,
                  },
                  xAxis: {
                    categories: this.projectionsYearsArray,
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: {
                        draggableY: true,
                        dragMaxY: 199,
                        dragMinY: -99,
                      },
                      point: {
                        events: {
                          drag: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              }
                            }
                          },
                          drop: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              } else {
                                that.financialObj.get(
                                  e.target.category
                                ).revenueGrowth = e.target.y;
                                console.log(e.target.y, e.target.category);
                                that.updateProjection();
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              } else {
                                that.financialObj.get(
                                  e.target.category
                                ).revenueGrowth = e.target.y;
                                console.log(e.target.y, e.target.category);
                                that.updateProjection();
                              }
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'revenue-growth';
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
                      colors: this.driversColors,
                      borderRadius: 5,
                    },
                  },
                  tooltip: {
                    ...tooltip,
                    // tslint:disable-next-line:object-literal-shorthand
                    formatter: function () {
                      return Highcharts.numberFormat(this.point.y, 0) + ' %';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [
                    {
                      data: RGArray,
                      dragDrop: { draggableY: true },
                      minPointLength: 2,
                    },
                  ],
                  legend: false,
                };
                this.COGSOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'COGS (% Revenue)' },
                  yAxis: {
                    title: {
                      text: 'As % of Revenue',
                      style: {
                        fontSize: '14px',
                      },
                    },
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },

                    min: 0,
                    max: 100,
                    tickInterval: 25,
                  },
                  xAxis: {
                    categories: this.projectionsYearsArray,
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: { draggableY: true, dragMaxY: 99, dragMinY: 0 },
                      point: {
                        events: {
                          drag: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              }
                            }
                          },
                          drop: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              } else {
                                that.financialObj.get(e.target.category).COGS =
                                  e.target.y;
                                that.updateProjection();
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              } else {
                                that.financialObj.get(e.target.category).COGS =
                                  e.target.y;
                                that.updateProjection();
                              }
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'cogs-percent';
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
                      colors: this.driversColors,
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
                  series: [
                    {
                      data: COGSArray,
                      dragDrop: { draggableY: true },
                      minPointLength: 2,
                    },
                  ],
                  legend: false,
                };
                this.SGAOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'SG&A (% Revenue)' },
                  yAxis: {
                    title: {
                      text: 'As % of Revenue',
                      style: {
                        fontSize: '14px',
                      },
                    },
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },

                    min: 0,
                    max: 100,
                    tickInterval: 25,
                  },
                  xAxis: {
                    categories: this.projectionsYearsArray,
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: { draggableY: true, dragMaxY: 99, dragMinY: 0 },
                      point: {
                        events: {
                          drag: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              }
                            }
                          },
                          drop: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              } else {
                                that.financialObj.get(
                                  e.target.category
                                ).SGAndA = e.target.y;
                                console.log('inside chart', that.financialObj);
                                that.updateProjection();
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              } else {
                                that.financialObj.get(
                                  e.target.category
                                ).SGAndA = e.target.y;
                                console.log('inside chart', that.financialObj);
                                that.updateProjection();
                              }
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'sga-percent';
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
                      colors: this.driversColors,
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
                  series: [
                    {
                      data: SGAArray,
                      dragDrop: { draggableY: true },
                      minPointLength: 2,
                    },
                  ],
                  legend: false,
                };
                this.DAOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'D&A (% Revenue)' },
                  yAxis: {
                    title: {
                      text: 'As % of Revenue',
                      style: {
                        fontSize: '14px',
                      },
                    },
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                    min: 0,
                    max: 50,
                    tickInterval: 25,
                  },
                  xAxis: {
                    categories: this.projectionsYearsArray,
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: { draggableY: true, dragMaxY: 49, dragMinY: 0 },
                      point: {
                        events: {
                          drag: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              }
                            }
                          },
                          drop: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              } else {
                                that.financialObj.get(e.target.category).DAndA =
                                  e.target.y;
                                that.updateProjection();
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              } else {
                                that.financialObj.get(e.target.category).DAndA =
                                  e.target.y;
                                that.updateProjection();
                              }
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'dna-percent';
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
                      colors: this.driversColors,
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
                  series: [
                    {
                      data: DAArray,
                      dragDrop: { draggableY: true },
                      minPointLength: 2,
                    },
                  ],

                  legend: false,
                };
                this.OIEOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Other Income/Expense (% Revenue)' },
                  yAxis: {
                    title: {
                      text: 'As % of Revenue',
                      style: {
                        fontSize: '14px',
                      },
                    },
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                    min: 0,
                    max: 100,
                    tickInterval: 25,
                  },
                  xAxis: {
                    categories: this.projectionsYearsArray,
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: {
                        draggableY: true,
                        dragMaxY: 100,
                        dragMinY: 0,
                      },
                      point: {
                        events: {
                          drag: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              }
                            }
                          },
                          drop: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              } else {
                                that.financialObj.get(
                                  e.target.category
                                ).otherIncomeOrExpense = e.target.y;
                                that.updateProjection();
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              } else {
                                that.financialObj.get(
                                  e.target.category
                                ).otherIncomeOrExpense = e.target.y;
                                that.updateProjection();
                              }
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'oincome-expense-percent';
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
                      colors: this.driversColors,
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
                  series: [
                    {
                      data: OIEArray,
                      dragDrop: { draggableY: true },
                      minPointLength: 2,
                    },
                  ],
                  legend: false,
                };
                this.NIEOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Net Interest Expense' },
                  yAxis: {
                    title: {
                      text: 'USD (millions)',
                      style: {
                        fontSize: '14px',
                      },
                    },
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                    tickInterval: 50,
                  },

                  xAxis: {
                    categories: this.projectionsYearsArray,
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
                      dragDrop: { draggableY: true },
                      point: {
                        events: {
                          drag: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              }
                            }
                          },
                          drop: function (e) {
                            if (_this.projectionsYearsArray.length == 6) {
                              if (e.target.index == 0) {
                                return false;
                              } else {
                                that.financialObj.get(
                                  e.target.category
                                ).netIterestExpense = e.target.y;
                                that.updateProjection();
                              }
                            }
                            if (_this.projectionsYearsArray.length == 7) {
                              if (e.target.index == 0 || e.target.index == 1) {
                                return false;
                              } else {
                                that.financialObj.get(
                                  e.target.category
                                ).netIterestExpense = e.target.y;
                                that.updateProjection();
                              }
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = undefined;
                            that.maxValue = undefined;
                            that.selectedChart = 'net-interest-expense';
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
                      colors: this.driversColors,
                      borderRadius: 5,
                    },
                  },
                  tooltip: {
                    ...tooltip,
                    formatter() {
                      return (
                        Highcharts.numberFormat(this.point.y, 0) + ' millions'
                      );
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [
                    {
                      data: NIEArray,
                      dragDrop: { draggableY: true },
                      minPointLength: 2,
                    },
                  ],
                  legend: false,
                };
                this.updateProjection();

                this.visualsLoaded = true;
              }, error => {
                this.visualsLoaded = true
              }); // end of projections
          }, error => {
            this.visualsLoaded = true
          }); // end of Save Scenarios
      }, error =>{
        this.visualsLoaded = true
      }); // end of actuals

    HC_exporting(Highcharts);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }

  updateProjection() {
    const PTRArray = [];
    const PGPArray = [];
    const PEBITArray = [];
    const PEBITDAArray = [];
    const PEBTArray = [];
    const PNIArray = [];
    let lastKey = 0;
    for (const [key, value] of this.financialObj) {
      if (typeof this.financialObj.get(key).COGS !== 'undefined') {
        this.financialObj.get(key).totalRevenue = Math.round(
          this.financialObj.get(lastKey).totalRevenue +
            this.financialObj.get(lastKey).totalRevenue *
              (this.financialObj.get(key).revenueGrowth / 100)
        );
        this.financialObj.get(key).p_COGS = Math.round(
          this.financialObj.get(key).totalRevenue *
            (this.financialObj.get(key).COGS / 100)
        );
        this.financialObj.get(key).p_GrossProfit = Math.round(
          this.financialObj.get(key).totalRevenue -
            this.financialObj.get(key).p_COGS
        );
        this.financialObj.get(key).p_SGAndA = Math.round(
          this.financialObj.get(key).totalRevenue *
            (this.financialObj.get(key).SGAndA / 100)
        );
        this.financialObj.get(key).p_EBIT = Math.round(
          this.financialObj.get(key).p_GrossProfit -
            this.financialObj.get(key).p_SGAndA
        );
        this.financialObj.get(key).p_DAndA = Math.round(
          this.financialObj.get(key).totalRevenue *
            (this.financialObj.get(key).DAndA / 100)
        );
        this.financialObj.get(key).p_EBITDA = Math.round(
          this.financialObj.get(key).p_EBIT + this.financialObj.get(key).p_DAndA
        );
        this.financialObj.get(key).p_NIE = this.financialObj.get(
          key
        ).netIterestExpense;
        this.financialObj.get(key).p_OIOrE = Math.round(
          this.financialObj.get(key).totalRevenue *
            (this.financialObj.get(key).otherIncomeOrExpense / 100)
        );
        this.financialObj.get(key).p_EBT = Math.round(
          this.financialObj.get(key).p_EBIT -
            this.financialObj.get(key).p_NIE -
            this.financialObj.get(key).p_OIOrE
        );
        this.financialObj.get(key).p_taxes = Math.round(
          this.financialObj.get(key).p_EBT *
            (this.financialObj.get(key).taxes / 100)
        );
        this.financialObj.get(key).p_NetInCome =
          this.financialObj.get(key).p_EBT - this.financialObj.get(key).p_taxes;
      }
      PTRArray.push(this.financialObj.get(key).totalRevenue);
      PGPArray.push(this.financialObj.get(key).p_GrossProfit);
      PEBITArray.push(this.financialObj.get(key).p_EBIT);
      PEBITDAArray.push(this.financialObj.get(key).p_EBITDA);
      PEBTArray.push(this.financialObj.get(key).p_EBT);
      PNIArray.push(this.financialObj.get(key).p_NetInCome);
      lastKey = key;
    }

    this.PTROptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Total Revenue' },
      yAxis: {
        title: {
          text: 'USD',
          style: {
            fontSize: '14px',
          },
        },
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },

      xAxis: {
        categories: this.yearsArray,
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      tooltip: {
        ...tooltip,
        formatter() {
          return Highcharts.numberFormat(this.point.y, 0) + ' USD';
        },
      },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: this.actualDriversColors,
          borderRadius: 5,
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: PTRArray }],
      legend: false,
    };
    this.PGPOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Gross Profit' },
      yAxis: {
        title: {
          text: 'USD',
          style: {
            fontSize: '14px',
          },
        },
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      xAxis: {
        categories: this.yearsArray,
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: this.actualDriversColors,
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter() {
          return Highcharts.numberFormat(this.point.y, 0) + ' USD';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: PGPArray }],
      legend: false,
    };
    this.PEBITOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'EBIT' },
      yAxis: {
        title: { text: 'USD' },
        style: {
          fontSize: '14px',
        },

        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },

      xAxis: {
        categories: this.yearsArray,
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: this.actualDriversColors,
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter() {
          return Highcharts.numberFormat(this.point.y, 0) + ' USD';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: PEBITArray }],
      legend: false,
    };
    this.PEBITDAOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'EBITDA' },
      yAxis: {
        title: {
          text: 'USD',
          style: {
            fontSize: '14px',
          },
        },

        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      xAxis: {
        categories: this.yearsArray,
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: this.actualDriversColors,
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter() {
          return Highcharts.numberFormat(this.point.y, 0) + ' USD';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: PEBITDAArray }],
      legend: false,
    };
    this.PEBTOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'EBT' },
      yAxis: {
        title: {
          text: 'USD',
          style: {
            fontSize: '14px',
          },
        },
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      xAxis: {
        categories: this.yearsArray,
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: this.actualDriversColors,
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter() {
          return Highcharts.numberFormat(this.point.y, 0) + ' USD';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: PEBTArray }],
      legend: false,
    };
    this.PNIOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Net Income' },
      yAxis: {
        title: {
          text: 'USD',
          style: {
            fontSize: '14px',
          },
        },
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      xAxis: {
        categories: this.yearsArray,
        labels: {
          style: {
            fontSize: '13px',
          },
        },
      },
      plotOptions: {
        series: { stickyTracking: false },
        column: {
          stacking: 'normal',
          minPointLength: 2,
          colorByPoint: true,
          cursor: 'ns-resize',
          colors: this.actualDriversColors,
          borderRadius: 5,
        },
      },
      tooltip: {
        ...tooltip,
        formatter() {
          return Highcharts.numberFormat(this.point.y, 0) + ' USD';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: PNIArray }],
      legend: false,
    };
  }

  saveScenario() {
    this.apiService
      .getData(this.urlConfig.getScenarioAPI() + this.companySelected)
      .subscribe((res: any) => {
        if (this.scenarioSelected == 0) {
          this.saveScenarioNumber = res.scenarios.length;
          console.log('In If', res.scenarios.length);
        } else {
          this.saveScenarioNumber = this.scenarioSelected;
          console.log('In Else', this.scenarioSelected);
        }
        this.scenarioSelected = localStorage.setItem(
          'scenarioSelected',
          this.saveScenarioNumber
        );
        const inputArray = [];

        for (const [key, value] of this.financialObj) {
          const inputObj: any = {};

          if (this.financialObj.get(key).latest > 0) {
            inputObj.asof = key.toString();
            inputObj.cogs = this.financialObj.get(key).p_COGS;
            inputObj.cogspercent = this.financialObj.get(key).COGS;
            inputObj.companyname = this.companySelected;
            inputObj.da = this.financialObj.get(key).p_DAndA;
            inputObj.dapercent = this.financialObj.get(key).DAndA;
            inputObj.ebit = this.financialObj.get(key).p_EBIT;
            inputObj.ebitda = this.financialObj.get(key).p_EBITDA;
            inputObj.ebitdamargin = Math.round(
              (this.financialObj.get(key).p_EBITDA /
                this.financialObj.get(key).totalRevenue) *
                100
            );
            inputObj.ebitmargin = Math.round(
              (this.financialObj.get(key).p_EBIT /
                this.financialObj.get(key).totalRevenue) *
                100
            );
            inputObj.ebt = this.financialObj.get(key).p_EBT;
            inputObj.ebtmargin = Math.round(
              (this.financialObj.get(key).p_EBT /
                this.financialObj.get(key).totalRevenue) *
                100
            );
            inputObj.grossprofit = this.financialObj.get(key).p_GrossProfit;
            inputObj.grossprofitmargin = Math.round(
              (this.financialObj.get(key).p_GrossProfit /
                this.financialObj.get(key).totalRevenue) *
                100
            );
            inputObj.latest = this.financialObj.get(key).latest;
            inputObj.netincome = this.financialObj.get(key).p_NetInCome;
            inputObj.netincomemargin = Math.round(
              (this.financialObj.get(key).p_NetInCome /
                this.financialObj.get(key).totalRevenue) *
                100
            );
            inputObj.netinterest = this.financialObj.get(key).netinterest;
            inputObj.netinterestdollars = this.financialObj.get(
              key
            ).netIterestExpense; /****/
            inputObj.otherincome = this.financialObj.get(key).p_OIOrE;
            inputObj.otherincomepercent = this.financialObj.get(
              key
            ).otherIncomeOrExpense;
            inputObj.revenuepercent = this.financialObj.get(key).revenueGrowth;
            inputObj.scenario = this.saveScenarioNumber;
            inputObj.sga = this.financialObj.get(key).p_SGAndA;
            inputObj.sgapercent = this.financialObj.get(key).SGAndA;
            inputObj.taxes = this.financialObj.get(key).p_taxes;
            inputObj.taxespercent = this.financialObj.get(key).taxes;
            inputObj.totalrevenue = this.financialObj.get(key).totalRevenue;
            inputArray.push(inputObj);
            console.log('inputArray', inputArray);
          }
        }
        this.apiService
          .postData(
            this.urlConfig.getIsProjectionsAPIPOST() + this.companySelected,
            JSON.stringify(inputArray)
          )
          .subscribe((res: any) => {
            console.log('res', res);
            if (res.message == 'Success') {
              this._snackBar.openFromComponent(uploadSnackBarISComponent, {
                duration: 5000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
              });
            } else {
              this._snackBar.openFromComponent(
                uploadFailureSnackBarISComponent,
                {
                  duration: 5000,
                  horizontalPosition: this.horizontalPosition,
                  verticalPosition: this.verticalPosition,
                }
              );
            }
          });
        this.ngOnInit();
      });
  }
  // end of save
  addScenario() {
    const existingScenarios = this.UserDetailModelService.getScenarioNumber();
    if (existingScenarios.length < 9) {
      localStorage.setItem('scenarioSelected', '0');
      this.scenario = existingScenarios.length;

      this._snackBar.openFromComponent(uploadSnackBarISAddComponent, {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
      this.ngOnInit();
    } else {
      this._snackBar.openFromComponent(uploadFailureSnackBarISAddComponent, {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
    }
  }

  loadScenario(index: any) {
    this.scenario = index;
    this.scenarioSelected = localStorage.setItem('scenarioSelected', index);
    let indexNumber = localStorage.getItem('scenarioSelected');
    this.loadedScenario = 'Scenario ' + indexNumber;
    this.ngOnInit();
  }
}

@Component({
  // tslint:disable-next-line:component-selector
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
// tslint:disable-next-line:class-name
export class uploadSnackBarISComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'snackBarFailure',
  templateUrl: 'snackBarFailure.html',
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
// tslint:disable-next-line:class-name
export class uploadFailureSnackBarISComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'snackBarAddScenario',
  templateUrl: 'snackBarAddScenario.html',
  styles: [
    `
      .snackBar {
        color: #fff;
        text-align: center;
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
// tslint:disable-next-line:class-name
export class uploadSnackBarISAddComponent {
  constructor(private UserDetailModelService: UserDetailModelService) {}
  totalScenario = this.UserDetailModelService.getScenarioNumber();
  scenarioBanner = this.totalScenario.length;
}

@Component({
  // tslint:disable-next-line:component-selector
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
// tslint:disable-next-line:class-name
export class uploadFailureSnackBarISAddComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}
