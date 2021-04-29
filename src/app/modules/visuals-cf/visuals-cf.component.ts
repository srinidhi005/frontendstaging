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
import { VisualCFInputDialogComponent } from './input-value-dialog.component';
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
  | 'dividend-paid'
  | 'capex'
  | 'assest-sales'
  | 'other-investment';

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
  selector: 'app-visuals-cf',
  templateUrl: './visuals-cf.component.html',
  styleUrls: ['./visuals-cf.component.scss'],
})
export class VisualsCfComponent implements OnInit {
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  inprogress = false;
  progressBar: boolean;
  DPOptions: {};
  CPOptions: {};
  ASOptions: {};
  OIAOptions: {};

  CFOOptions: {};
  CFIOptions: {};
  CFFOptions: {};
  NCOptions: {};

  yearsArray = [];
  scenarioArray = [];
  scenario = this.UserDetailModelService.getSelectedScenario();
  companyName = this.UserDetailModelService.getSelectedCompany();
  CffinancialObj = new Map();
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
  updateDividendPaidOption = false;
  updateCapexOption = false;
  updateAssestSalesOption = false;
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

      this.UserDetailModelService.updateCashFlowScenario.subscribe(() => {
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
    const dialogRef = this.dialog.open(VisualCFInputDialogComponent, {
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
      case 'dividend-paid':
        this.updateDividedPaidChart();
        break;
      case 'capex':
        this.updateCapexChart();
        break;
      case 'assest-sales':
        this.updateAssestSalesChart();
        break;
      case 'other-investment':
        this.updateOtherInvestmentChart();
        break;
      default:
        break;
    }
  }
  /**
   * update dividend-paid chart data
   */
  updateDividedPaidChart() {
    const options = this.DPOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.DPOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateDividendPaidOption = true;
    this.CffinancialObj.get(
      this.selectedYear
    ).dividendspaid = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update capex chart data
   */
  updateCapexChart() {
    const options = this.CPOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.CPOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateCapexOption = true;
    this.CffinancialObj.get(
      this.selectedYear
    ).capexpercent = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update assest-sales chart data
   */
  updateAssestSalesChart() {
    const options = this.ASOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.ASOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateAssestSalesOption = true;
    this.CffinancialObj.get(
      this.selectedYear
    ).assetsalespercent = this.modalDefaultValue;
    this.updateProjection();
  }
  /**
   * update other-investment chart data
   */
  updateOtherInvestmentChart() {
    const options = this.OIAOptions as any;
    const index = options.xAxis.categories.indexOf(this.selectedYear);
    (this.OIAOptions as any).series[0].data[index] = this.modalDefaultValue;
    this.updateDividendPaidOption = true;
    this.CffinancialObj.get(
      this.selectedYear
    ).otherinvestmentpercent = this.modalDefaultValue;
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

    this.yearsArray = [];

    if (scenarioNumber >= 0) {
      this.scenarioSelected = scenarioNumber;
      this.loadedScenario = 'Scenario ' + this.scenarioSelected;
    }

    this.apiService
      .getData(this.urlConfig.getCashActualsAPI() + this.companySelected)
      .subscribe((res: any) => {
        this.progressBar = true;
        for (let j = 0; j < res.length; j++) {
          this.CffinancialObj.set(res[j].asof, {
            netincome: res[j].netincome,
            totalrevenue: res[j].totalrevenue,
            daa: res[j].daa,
            fundsfromoperations: res[j].fundsfromoperations,
            accountreceivablesdelta: res[j].accountreceivablesdelta,
            inventoriesdelta: res[j].inventoriesdelta,
            othercurrentassets: res[j].othercurrentassets,
            accountspayable: res[j].accountspayable,
            accruedliabilities: res[j].accruedliabilities,
            othercurrentliabilities: res[j].othercurrentliabilities,
            cfo: res[j].cfo,
            totalexpenditure: res[j].totalexpenditure,
            assetsales: res[j].assetsales,
            otherinvestingactivities: res[j].otherinvestingactivities,
            cfi: res[j].cfi,
            debtissued: res[j].debtissued,
            commonstockissued: res[j].commonstockissued,
            dividendspaid:
              res[j].dividendspaid > 0
                ? res[j].dividendspaid
                : res[j].dividendspaid * -1,
            cff: res[j].cff,
            netchangeincash: res[j].netchangeincash,
            capexpercent:
              res[j].capexpercent > 0
                ? res[j].capexpercent
                : res[j].capexpercent * -1,
            assetsalespercent: res[j].assetsalespercent,
            otherinvestmentpercent: res[j].otherinvestmentpercent,
            ebitda: res[j].ebitda,
            ffopercentrevenue: res[j].ffopercentrevenue,
            cfopercentrevenue: res[j].cfopercentrevenue,
            dividendspaidpercentincome: res[j].dividendspaidpercentincome,
            cfopercentebitda: res[j].cfopercentebitda,
            capexpercentrevenue: res[j].capexpercentrevenue,
            assetsalespercentrevenue: res[j].assetsalespercentrevenue,
            investingpercentrevenue: res[j].investingpercentrevenue,
            latest: res[j].latest,
          });
        }

        this.apiService
          .getData(this.urlConfig.getCashScenarioAPI() + this.companySelected)
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
                this.urlConfig.getCashProjectionsAPIGET() +
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
                    this.CffinancialObj.set(res[j].asof, {
                      netincome: res[j].netincome,
                      totalrevenue: res[j].totalrevenue,
                      daa: res[j].daa,
                      fundsfromoperations: res[j].fundsfromoperations,
                      accountreceivablesdelta: res[j].accountreceivablesdelta,
                      inventoriesdelta: res[j].inventoriesdelta,
                      othercurrentassets: res[j].othercurrentassets,
                      accountspayable: res[j].accountspayable,
                      accruedliabilities: res[j].accruedliabilities,
                      scenario: res[j].scenario,
                      othercurrentliabilities: res[j].othercurrentliabilities,
                      cfo: res[j].cfo,
                      totalexpenditure: res[j].totalexpenditure,
                      assetsales: res[j].assetsales,
                      otherinvestingactivities: res[j].otherinvestingactivities,
                      cfi: res[j].cfi,
                      debtissued: res[j].debtissued,
                      commonstockissued: res[j].commonstockissued,
                      dividendspaid:
                        res[j].dividendspaid > 0
                          ? res[j].dividendspaid
                          : res[j].dividendspaid * -1,
                      cff: res[j].cff,
                      netchangeincash: res[j].netchangeincash,
                      capexpercent:
                        res[j].capexpercent > 0
                          ? res[j].capexpercent
                          : res[j].capexpercent * -1,
                      assetsalespercent: res[j].assetsalespercent,
                      otherinvestmentpercent: res[j].otherinvestmentpercent,
                      ebitda: res[j].ebitda,
                      ffopercentrevenue: res[j].ffopercentrevenue,
                      cfopercentrevenue: res[j].cfopercentrevenue,
                      dividendspaidpercentincome:
                        res[j].dividendspaidpercentincome,
                      cfopercentebitda: res[j].cfopercentebitda,
                      capexpercentrevenue: res[j].capexpercentrevenue,
                      assetsalespercentrevenue: res[j].assetsalespercentrevenue,
                      investingpercentrevenue: res[j].investingpercentrevenue,
                      latest: res[j].latest,
                    });
                  }
                }
                this.CffinancialObj.forEach((v, k) => {
                  this.yearsArray.push(k);
                  DSOArray.push(
                    v.dividendspaid == undefined ? 0 : v.dividendspaid
                  );
                  IDArray.push(
                    v.capexpercent == undefined ? 0 : v.capexpercent
                  );
                  OCAArray.push(
                    v.assetsalespercent == undefined ? 0 : v.assetsalespercent
                  );
                  DPOArray.push(
                    v.otherinvestmentpercent == undefined
                      ? 0
                      : v.otherinvestmentpercent
                  );
                });

                this.DPOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Dividends Paid' },
                  yAxis: {
                    title: {
                      text: 'USD (billions)',
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
                  xAxis: {
                    categories: this.yearsArray,
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                  },
                  plotOptions: {
                    series: {
                      ...seriesOption,
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
                              that.CffinancialObj.get(
                                e.target.category
                              ).dividendspaid = e.target.y;

                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'dividend-paid';
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
                      return (
                        Highcharts.numberFormat(this.point.y, 0) + ' millions'
                      );
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [
                    {
                      data: DSOArray,
                      dragDrop: { draggableY: true, dragMinY: 0 },
                      minPointLength: 2,
                    },
                  ],
                  legend: false,
                };
                this.CPOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: {
                    text: 'Capex (% of Revenue)',
                    style: {
                      fontSize: '16px',
                    },
                  },
                  yAxis: {
                    title: { text: 'As % of Revenue' },
                    labels: {
                      style: {
                        fontSize: '13px',
                      },
                    },
                    min: 0,
                    max: 50,
                    tickInterval: 10,
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
                    series: {
                      ...seriesOption,
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
                              that.CffinancialObj.get(
                                e.target.category
                              ).capexpercent = e.target.y;
                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'capex';
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
                      return Highcharts.numberFormat(this.point.y, 0) + '%';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [
                    {
                      data: IDArray,
                      dragDrop: { draggableY: true, dragMaxY: 50, dragMinY: 0 },
                    },
                  ],
                  legend: false,
                };
                this.ASOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Asset Sales (% of Revenue)' },
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

                   
                    tickInterval: 10,
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
                    series: {
                      ...seriesOption,
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
                              that.CffinancialObj.get(
                                e.target.category
                              ).assetsalespercent = e.target.y;

                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'assest-sales';
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
                  series: [
                    {
                      data: OCAArray,
                      dragDrop: { draggableY: true, dragMaxY: 50, dragMinY: 0 },
                    },
                  ],
                  legend: false,
                };
                this.OIAOptions = {
                  chart: { type: 'areaspline', animation: false },
                  title: { text: 'Other Investing Activities (% of Revenue)' },
                  yAxis: {
                    title: { text: 'As % of Revenue' },
                    min: -30,
                    max: 30,
                    tickInterval: 10,
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
                    series: {
                      ...seriesOption,
                      stickyTracking: false,
                      dragDrop: {
                        draggableY: true,
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
                              that.CffinancialObj.get(
                                e.target.category
                              ).otherinvestmentpercent = e.target.y;
                              that.updateProjection();
                            }
                          },
                          click() {
                            if (this.index < 2) {
                              return false;
                            }
                            that.minValue = this.series.yAxis.min;
                            that.maxValue = this.series.yAxis.max;
                            that.selectedChart = 'other-investment';
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
                      return Highcharts.numberFormat(this.point.y, 0) + '%';
                    },
                  },
                  credits: { enabled: false },
                  exporting: { enabled: false },
                  series: [
                    {
                      data: DPOArray,
                      dragDrop: {
                        draggableY: true,
                        dragMaxY: 30,
                        dragMinY: -30,
                      },
                    },
                  ],

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
    const CFOArray = [];
    const CFIArray = [];
    const CFFArray = [];
    const NCArray = [];
    let lastKey = 0;

    for (const [key, value] of this.CffinancialObj) {
      if (this.CffinancialObj.get(key).latest > 0) {
        this.CffinancialObj.get(key).netincome = this.CffinancialObj.get(
          key
        ).netincome;
        this.CffinancialObj.get(key).daa = this.CffinancialObj.get(key).daa;
        this.CffinancialObj.get(
          key
        ).fundsfromoperations = this.CffinancialObj.get(
          key
        ).fundsfromoperations;
        this.CffinancialObj.get(
          key
        ).accountreceivablesdelta = this.CffinancialObj.get(
          key
        ).accountreceivablesdelta;
        this.CffinancialObj.get(key).inventoriesdelta = this.CffinancialObj.get(
          key
        ).inventoriesdelta;
        this.CffinancialObj.get(
          key
        ).othercurrentassets = this.CffinancialObj.get(key).othercurrentassets;
        this.CffinancialObj.get(key).accountspayable = this.CffinancialObj.get(
          key
        ).accountspayable;
        this.CffinancialObj.get(
          key
        ).accruedliabilities = this.CffinancialObj.get(key).accruedliabilities;
        this.CffinancialObj.get(
          key
        ).othercurrentliabilities = this.CffinancialObj.get(
          key
        ).othercurrentliabilities;
        this.CffinancialObj.get(key).cfo = Math.round(
          this.CffinancialObj.get(key).fundsfromoperations +
            this.CffinancialObj.get(key).accountreceivablesdelta +
            this.CffinancialObj.get(key).inventoriesdelta +
            this.CffinancialObj.get(key).othercurrentassets +
            this.CffinancialObj.get(key).accountspayable +
            this.CffinancialObj.get(key).accruedliabilities +
            this.CffinancialObj.get(key).othercurrentliabilities
        );
        this.CffinancialObj.get(key).capexpercent = this.CffinancialObj.get(
          key
        ).capexpercent;
        this.CffinancialObj.get(key).totalrevenue = this.CffinancialObj.get(
          key
        ).totalrevenue;
        this.CffinancialObj.get(key).totalexpenditure =
          (this.CffinancialObj.get(key).capexpercent / 100) *
          this.CffinancialObj.get(key).totalrevenue;
        this.CffinancialObj.get(
          key
        ).assetsalespercent = this.CffinancialObj.get(key).assetsalespercent;
        this.CffinancialObj.get(key).assetsales =
          (this.CffinancialObj.get(key).assetsalespercent / 100) *
          this.CffinancialObj.get(key).totalrevenue;
        this.CffinancialObj.get(
          key
        ).otherinvestmentpercent = this.CffinancialObj.get(
          key
        ).otherinvestmentpercent;
        this.CffinancialObj.get(key).otherinvestingactivities =
          Math.round(
            this.CffinancialObj.get(key).otherinvestmentpercent / 100
          ) * this.CffinancialObj.get(key).totalrevenue;

        this.CffinancialObj.get(key).cfi =
          Math.round(
            this.CffinancialObj.get(key).totalexpenditure +
              this.CffinancialObj.get(key).assetsales +
              this.CffinancialObj.get(key).otherinvestingactivities
          ) * -1;
        this.CffinancialObj.get(key).debtissued = this.CffinancialObj.get(
          key
        ).debtissued;
        this.CffinancialObj.get(
          key
        ).commonstockissued = this.CffinancialObj.get(key).commonstockissued;
        this.CffinancialObj.get(key).dividendspaid = this.CffinancialObj.get(
          key
        ).dividendspaid;
        this.CffinancialObj.get(key).cff =
          Math.round(
            this.CffinancialObj.get(key).debtissued +
              this.CffinancialObj.get(key).commonstockissued +
              this.CffinancialObj.get(key).dividendspaid
          ) * -1;
        this.CffinancialObj.get(key).netchangeincash = Math.round(
          this.CffinancialObj.get(key).cfo +
            this.CffinancialObj.get(key).cfi +
            this.CffinancialObj.get(key).cff
        );
      }
      CFOArray.push(this.CffinancialObj.get(key).cfo);
      CFIArray.push(this.CffinancialObj.get(key).cfi);
      CFFArray.push(this.CffinancialObj.get(key).cff);
      NCArray.push(this.CffinancialObj.get(key).netchangeincash);
      lastKey = key;
    }

    this.CFOOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Cash Flow from Operating Activities (CFO)' },
      yAxis: {
        title: {
          text: 'USD (in billions)',
          style: {
            fontSize: '14px',
          },
        },
        labels: {
					formatter: function() {
          return this.value /1000  + 'B';
			},
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
        series: { stickyTracking: false, pointWidth: 35 },
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
          return Highcharts.numberFormat(this.point.y, 0) + ' million';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: CFOArray }],
      legend: false,
    };
    this.CFIOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Cash Flow from Investing Activities (CFI)' },
      yAxis: {
        title: {
          text: 'USD (in billions)',
          style: {
            fontSize: '14px',
          },
        },
        labels: {
					formatter: function() {
          return this.value /1000  + 'B';
			},
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
        series: { stickyTracking: false, pointWidth: 35 },
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
          return Highcharts.numberFormat(this.point.y, 0) + ' USD';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: CFIArray }],
      legend: false,
    };
    this.CFFOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Cash Flow from Financing Activities (CFF)' },
      yAxis: {
        title: { text: 'USD', style: { fontSize: '14px' } },
        labels: {
					formatter: function() {
          return this.value /1000  + 'B';
			},
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
        series: { stickyTracking: false, pointWidth: 35 },
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
          return Highcharts.numberFormat(this.point.y, 0) + ' million';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: CFFArray }],
      legend: false,
    };
    this.NCOptions = {
      chart: { type: 'column', animation: false },
      title: { text: 'Net Change in Cash' },
      yAxis: {
        title: {
          text: 'USD (in billions)',
          style: {
            fontSize: '14px',
          },
        },

        labels: {
					formatter: function() {
          return this.value /1000  + 'B';
			},
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
        series: { stickyTracking: false, pointWidth: 33 },

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
          return Highcharts.numberFormat(this.point.y, 0) + ' million';
        },
      },
      credits: { enabled: false },
      exporting: { enabled: false },
      series: [{ data: NCArray }],
      legend: false,
    };
  }

  saveScenario() {
    this.apiService
      .getData(this.urlConfig.getCashScenarioAPI() + this.companySelected)
      .subscribe((res: any) => {
        if (this.scenarioSelected == 0) {
          this.saveScenarioNumber = res.scenarios.length;
          this.scenarioSelected = res.scenarios.length;
        } else {
          this.saveScenarioNumber = this.scenarioSelected;
        }

        this.loadedScenario = ('Scenario ' + this.scenarioSelected) as any;
        const inputArray = [];
        console.log('cff', this.CffinancialObj);
        for (const [key, value] of this.CffinancialObj) {
          const inputObj: any = {};
          if (this.CffinancialObj.get(key).latest > 0) {
            inputObj.netincome = this.CffinancialObj.get(key).netincome;
            inputObj.daa = this.CffinancialObj.get(key).daa;
            inputObj.fundsfromoperations = this.CffinancialObj.get(
              key
            ).fundsfromoperations;
            inputObj.accountreceivablesdelta = this.CffinancialObj.get(
              key
            ).accountreceivablesdelta;
            inputObj.asof = key.toString();
            inputObj.inventoriesdelta = this.CffinancialObj.get(
              key
            ).inventoriesdelta;
            inputObj.companyname = this.companySelected;
            inputObj.scenario = this.saveScenarioNumber;
            inputObj.othercurrentassets = this.CffinancialObj.get(
              key
            ).othercurrentassets;
            inputObj.accountspayable = this.CffinancialObj.get(
              key
            ).accountspayable;
            inputObj.accruedliabilities = this.CffinancialObj.get(
              key
            ).accruedliabilities;
            inputObj.othercurrentliabilities = this.CffinancialObj.get(
              key
            ).othercurrentliabilities;
            inputObj.cfo = this.CffinancialObj.get(key).cfo;
            inputObj.totalexpenditure = this.CffinancialObj.get(
              key
            ).totalexpenditure;
            inputObj.assetsales = this.CffinancialObj.get(key).assetsales;
            inputObj.otherinvestingactivities = this.CffinancialObj.get(
              key
            ).otherinvestingactivities;
            inputObj.cfi = this.CffinancialObj.get(key).cfi;
            inputObj.debtissued = this.CffinancialObj.get(key).debtissued;
            inputObj.commonstockissued = this.CffinancialObj.get(
              key
            ).commonstockissued;
            inputObj.dividendspaid = this.CffinancialObj.get(key).dividendspaid;
            inputObj.cff = this.CffinancialObj.get(key).cff;
            inputObj.netchangeincash = this.CffinancialObj.get(
              key
            ).netchangeincash;
            inputObj.capexpercent = this.CffinancialObj.get(key).capexpercent;
            inputObj.assetsalespercent = this.CffinancialObj.get(
              key
            ).assetsalespercent;
            inputObj.totalrevenue = this.CffinancialObj.get(key).totalrevenue;
            inputObj.otherinvestmentpercent = this.CffinancialObj.get(
              key
            ).otherinvestmentpercent;
            inputObj.ffopercentrevenue =
              (this.CffinancialObj.get(key).fundsfromoperations /
                this.CffinancialObj.get(key).totalrevenue) *
              100;
            inputObj.cfopercentrevenue =
              (this.CffinancialObj.get(key).cfo /
                this.CffinancialObj.get(key).totalrevenue) *
              100;
            inputObj.dividendspaidpercentincome =
              (this.CffinancialObj.get(key).dividendspaid /
                this.CffinancialObj.get(key).netincome) *
              100;
            inputObj.cfopercentebitda =
              (this.CffinancialObj.get(key).cfo /
                this.CffinancialObj.get(key).ebitda) *
              100;
            inputObj.capexpercentrevenue =
              (this.CffinancialObj.get(key).totalexpenditure /
                this.CffinancialObj.get(key).totalrevenue) *
              100;
            inputObj.assetsalespercentrevenue =
              (this.CffinancialObj.get(key).assetsales /
                this.CffinancialObj.get(key).totalrevenue) *
              100;
            inputObj.investingpercentrevenue =
              (this.CffinancialObj.get(key).otherinvestingactivities /
                this.CffinancialObj.get(key).totalrevenue) *
              100;

            inputObj.latest = this.CffinancialObj.get(key).latest;

            inputArray.push(inputObj);
            console.log('Json stringify', inputArray);
          }
        }
        this.apiService
          .postData(
            this.urlConfig.getCashProjectionsAPIPOST() + this.companySelected,
            JSON.stringify(inputArray)
          )
          .subscribe((res: any) => {
            console.log(inputArray);
            console.log('latest', res);
            if (res.message == 'Success') {
              this._snackBar.openFromComponent(uploadSnackBarCFComponent, {
                duration: 5000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
              });
            } else {
              this._snackBar.openFromComponent(
                uploadFailureSnackBarCFComponent,
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
    let existingScenarios = this.UserDetailModelService.getScenarioNumber();
    if (existingScenarios.length < 9) {
      this.scenario = existingScenarios.length;
      this._snackBar.openFromComponent(uploadSnackBarCFAddComponent, {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
      //loading default scenario
      this.initScenario(0);
    } else {
      this._snackBar.openFromComponent(uploadFailureSnackBarCFAddComponent, {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
    }
  }
  loadScenario(index: any) {
    this.scenario = index;

    this.loadedScenario = 'Scenario ' + index;
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
export class uploadSnackBarCFComponent {
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
export class uploadFailureSnackBarCFComponent {
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
export class uploadSnackBarCFAddComponent {
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
export class uploadFailureSnackBarCFAddComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}
