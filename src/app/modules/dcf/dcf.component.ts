import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { UrlConfigService } from 'src/app/shared/url-config.service';
import { RMIAPIsService } from 'src/app/shared/rmiapis.service';
import { ExcelService } from 'src/app/shared/excel.service';
import { UserDetailModelService } from 'src/app/shared/user-detail-model.service';
import { formatNumber } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import html2canvas from 'html2canvas';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { AuthService } from 'src/app/auth.service';

export interface PLElement {
  inMillions: number;
  EBITDA: string;
  '(–) Depreciation & Amortization': string;
  EBIT: string;
  '(+/–) Net Interest Expense': string;
  EBT: string;
  '(–) NOLs Utilized': string;
  'EBT Post NOL Utilization': string;
  '(–) Cash Taxes': string;
  'Earnings Before Interest After Taxes (EBIAT)': string;
  '(+) Depreciation & Amortization': string;
  '(–) Capex': string;
  '(+/–) Change in Net Working Capital': string;
  'Unlevered Free Cash Flow': string;
  Period: string;
  DiscountFactor: string;
  wacc: string;
}

let ELEMENT_PL_PDF: PLElement[] = [];

@Component({
  selector: 'app-dcf',
  templateUrl: './dcf.component.html',
  styleUrls: ['./dcf.component.scss'],
})
export class DcfComponent implements OnInit {
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  @ViewChild('imagecanvas', { static: true }) imagecanvas: ElementRef;
  scenarioArray = [];
  //scenario = this.UserDetailModelService.getSelectedScenario();
  companyName = this.UserDetailModelService.getSelectedCompany();
  financialObj = new Map();

  corpTaxRate = 21;
  exitMutiple = 40;
  inprogress = true;
  progressBar: boolean;
  years = [];
  financials = [];
  inputColumns = [
    'inMillions',
    'EBITDA',
    'Depreciation & Amortization',
    'EBIT',
    'Net Interest Expense',
    'EBT',
    'NOLs Utilized',
    'EBT Post NOL Utilization',
    'Cash Taxes',
    'Earnings Before Interest After Taxes',
    'Depreciation Amortization',
    'Capex',
    ' Change in Net Working Capital',
    'Unlevered Free Cash Flow',
    'Peroid',
    'DiscountFactor',
    'wacc',
  ];
  displayedColumns: string[] = [];
  displayData: any[];
  companySelected = localStorage.getItem('companySelected');
  //scenarioNumber = localStorage.getItem('scenarioNumber');
  scenario = this.UserDetailModelService.getSelectedScenario();
  selectedCompanyName = localStorage.getItem('selectedCompanyName');
  scenarioName = 'Scenario [0]';
  saveScenarioNumber: any = 0;
  scenarioSelected: any = 0;
  loadedScenario = 'Scenario 0';
  waacEditedValue: any;
  dcf;

  editPopUp = {
    key: "",
    value: 0,
    label: ""
  }

  valuationsLoaded = false;

  @ViewChild('firstBlock', { static: false }) firstBlock: ElementRef;
  valuationSummary;
  @ViewChild('unleveredFreeCashFlow', { static: false })
  unleveredFreeCashFlow: ElementRef;
  @ViewChild('valuations', { static: false }) valuations: ElementRef;
  @ViewChild('valuationSummary', { static: false }) valSummary: ElementRef;

  constructor(
    private urlConfig: UrlConfigService,
    private apiService: RMIAPIsService,
    private UserDetailModelService: UserDetailModelService,
    private excelService: ExcelService,
    public modalService: NgbModal,
    public authService : AuthService,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.excelService.selectedDashboardMenu = 'dcf';
    if(this.authService.authServiceLoaded){
      if (this.UserDetailModelService.selectedScenarioIndex >= 0) {
        this.scenario = this.UserDetailModelService.selectedScenarioIndex;
      }
  
      this.initScenario(this.scenario);
  
      this.UserDetailModelService.updateBalanceSheetScenario.subscribe(() => {
        this.initScenario(this.UserDetailModelService.selectedScenarioIndex);
      });
    }
    else{
      const intervalID = setInterval(()=> {
        if(this.authService.authServiceLoaded){
          this.ngOnInit();
          clearInterval(intervalID);
        }
      }, 100)
    }
  }

  initScenario(scenarioNumber?) {
    const ELEMENT_PL = [] as any;
    this.progressBar = true;

    if (scenarioNumber >= 0) {
      this.scenarioSelected = scenarioNumber;
      this.loadedScenario = 'Scenario ' + this.scenarioSelected;
    }

    this.apiService
      .getData(this.urlConfig.getdcfCompaniesAPI() + this.companySelected)
      .subscribe(
        (res) => {
          console.log('DCF ASSUMPTINS', res);

          this.dcf = res;
        },
        (error) => {
          console.log(error);
          this.valuationsLoaded = true;
        }
      );

    this.apiService
      .getData(
        this.urlConfig.getDCFAPI() +
          this.companySelected +
          '&scenario=' +
          this.scenarioSelected
      )
      .subscribe((res: any) => {
        for (let j = 0; j < res.length; j++) {
          this.financialObj.set(res[j].asof, {
            EBITDA: res[j].ebitda,
            DepreciationAmortization: res[j].da,
            EBIT: res[j].ebit,
            NetInterestExpense: res[j].netinterest,
            EBT: res[j].ebt,
            NOLsUtilized: res[j].nols,
            EBTPostNOLUtilization: res[j].ebtpostnol,
            CashTaxes: res[j].cashtaxes,
            EarningsBeforeInterestAfterTaxes: res[j].ebiat,
            DA: res[j].da,
            Capex: res[j].capex,
            ChangeinNetWorkingCapital: res[j].networkingcapitalchange,
            UnleveredFreeCashFlow: res[j].unleveredfreecash,
            Period: res[j].period,

            PresentFcf: res[j].presentfcf,
            PresentTerminalValue: res[j].presentterminalvalue,
            Total: res[j].presentfcf + res[j].presentterminalvalue,
            current: res[j].currentnetdebt,
            equity: res[j].equityvalue,

            totalEnterpriseValue: res[j].totalenterprisevalue,

            // afterTaxCostOfDebt: res[j].after_tax_debt_cost,
            costOfDebt: res[j].costofdebt,
            costOfEquity: res[j].costofequity,
            debtEquity: res[j].debequity,

            debtToTotalCap: res[j].debttotalcap,
            ebitdaExitMultiple: res[j].ebitdaexitmultiple,
            equityToTotalCap: res[j].equitytotalcap,
            leveredBeta: res[j].leveredbeta,
            afterTaxCostOfDebt: res[j].aftertaxcostdebt,
            equityRiskPremium: res[j].equityriskpremium,
            riskFreeRate: res[j].riskfreerate,
            taxRate: res[j].taxrate,

            // costOfEquity: res[j].cost_of_equity,
            // debtEquity: res[j].debt_equity,
            // debtToTotalCapitalization: res[j].debt_to_total_cap,
            // equityToTotalCapitalization: res[j].equity_to_total_cap,
            // leveredBeta: res[j].levered_beta,
            wacc: res[j].wacc,
            DiscountFactor:
              (1 / (1 + res[j].wacc / 100) ** res[j].period) * 100,
            fpyebitdaexitmultiple: res[j].fpyebitdaexitmultiple,
            spyebitdaexitmultiple: res[j].spyebitdaexitmultiple,
          });
        }

        this.apiService
          .getData(this.urlConfig.getdcfscenarioAPI() + this.companySelected)
          .subscribe((res: any) => {
            this.scenarioArray = res.scenarios;
            this.UserDetailModelService.setScenarioNumber(this.scenarioArray);
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
                this.urlConfig.getDCFAPI() +
                  this.companySelected +
                  '&scenario=' +
                  this.scenarioSelected
              )
              .subscribe((res: any) => {
                console.log('wacc', res);
                for (let j = 0; j < res.length; j++) {
                  this.financialObj.set(res[j].asof, {
                    EBITDA: res[j].ebitda,
                    DepreciationAmortization: res[j].da,
                    EBIT: res[j].ebit,
                    NetInterestExpense: res[j].netinterest,
                    EBT: res[j].ebt,
                    NOLsUtilized: res[j].nols,
                    EBTPostNOLUtilization: res[j].ebtpostnol,
                    CashTaxes: res[j].cashtaxes,
                    EarningsBeforeInterestAfterTaxes: res[j].ebiat,
                    DA: res[j].da,
                    Capex: res[j].capex,
                    ChangeinNetWorkingCapital: res[j].networkingcapitalchange,
                    UnleveredFreeCashFlow: res[j].unleveredfreecash,
                    Period: res[j].period,
                    //Total: res[j].valuationtotal,
                    totalEnterpriseValue: res[j].totalenterprisevalue,

                    costOfDebt: res[j].costofdebt,
                    costOfEquity: res[j].costofequity,
                    debtEquity: res[j].debequity,

                    debtToTotalCap: res[j].debttotalcap,
                    ebitdaExitMultiple: res[j].ebitdaexitmultiple,
                    equityToTotalCap: res[j].equitytotalcap,
                    leveredBeta: res[j].leveredbeta,
                    afterTaxCostOfDebt: res[j].aftertaxcostdebt,
                    equityRiskPremium: res[j].equityriskpremium,
                    riskFreeRate: res[j].riskfreerate,
                    taxRate: res[j].taxrate,
                    // afterTaxCostOfDebt: res[j].after_tax_debt_cost,
                    // costOfDebt: res[j].cost_of_debt,
                    // costOfEquity: res[j].cost_of_equity,
                    // debtEquity: res[j].debt_equity,
                    // debtToTotalCapitalization: res[j].debt_to_total_cap,
                    // equityRiskPremium: res[j].equity_risk_premium,
                    // equityToTotalCapitalization: res[j].equity_to_total_cap,
                    // leveredBeta: res[j].levered_beta,
                    // riskFreeRate: res[j].risk_free_rate,
                    // taxRate: res[j].tax_rate,
                    wacc: res[j].wacc,
                    DiscountFactor: res[j].discountfactor,
                      // (1 / (1 + res[j].wacc / 100) ** res[j].period) * 100,
                    current: res[j].currentnetdebt,
                    PresentFcf:res[j].presentfcf,
                      // res[j].unleveredfreecash *
                      // (1 / (1 + res[j].wacc / 100) ** res[j].period),
                    PresentTerminalValue: res[j].presentterminalvalue,
                    Total: res[j].valuationtotal,
                      // res[j].unleveredfreecash *
                      //   (1 / (1 + res[j].wacc / 100) ** res[j].period) +
                      // res[j].presentterminalvalue,
                    equity: res[j].equityvalue,
                    fpyebitdaexitmultiple: res[j].fpyebitdaexitmultiple,
                    spyebitdaexitmultiple: res[j].spyebitdaexitmultiple,
                    scenarioNumber: res[j].scenario,
                  });
                }

                this.financialObj.forEach((v, k) => {
                  var pushData = {
                    inMillions: k,
                    EBITDA:
                      '$ ' + formatNumber(Number(v.EBITDA), 'en-US', '1.0-0'),
                    '(–) Depreciation & Amortization':
                      '$ ' +
                      formatNumber(
                        Number(v.DepreciationAmortization),
                        'en-US',
                        '1.0-0'
                      ),
                    EBIT: '$ ' + formatNumber(Number(v.EBIT), 'en-US', '1.0-0'),
                    '(+/–) Net Interest Expense':
                      '$ ' +
                      formatNumber(
                        Number(v.NetInterestExpense),
                        'en-US',
                        '1.0-0'
                      ),
                    EBT: '$ ' + formatNumber(Number(v.EBT), 'en-US', '1.0-0'),
                    '(–) NOLs Utilized':
                      '$ ' +
                      formatNumber(Number(v.NOLsUtilized), 'en-US', '1.0-0'),
                    'EBT Post NOL Utilization':
                      '$ ' +
                      formatNumber(
                        Number(v.EBTPostNOLUtilization),
                        'en-US',
                        '1.0-0'
                      ),
                    '(–) Cash Taxes':
                      '$ ' +
                      formatNumber(Number(v.CashTaxes), 'en-US', '1.0-0'),
                    'Earnings Before Interest After Taxes (EBIAT)':
                      '$ ' +
                      formatNumber(
                        Number(v.EarningsBeforeInterestAfterTaxes),
                        'en-US',
                        '1.0-0'
                      ),
                    '(+) Depreciation & Amortization':
                      '$ ' +
                      formatNumber(Number(v.DAmortization), 'en-US', '1.0-0'),
                    '(–) Capex':
                      '$ ' + formatNumber(Number(v.Capex), 'en-US', '1.0-0'),
                    '(+/–) Change in Net Working Capital':
                      '$ ' +
                      formatNumber(
                        Number(v.ChangeinNetWorkingCapital),
                        'en-US',
                        '1.0-0'
                      ),
                    'Unlevered Free Cash Flow':
                      '$ ' +
                      formatNumber(
                        Number(v.UnleveredFreeCashFlow),
                        'en-US',
                        '1.0-0'
                      ),
                    Period:
                      '$ ' + formatNumber(Number(v.period), 'en-US', '1.0-0'),
                    DiscountFactor:
                      '$ ' +
                      formatNumber(Number(v.discountfactor), 'en-US', '1.0-0'),
                    PresentFcf:
                      '$ ' +
                      formatNumber(Number(v.presentfcf), 'en-US', '1.0-0'),
                    PresentTerminalValue:
                      '$ ' +
                      formatNumber(
                        Number(v.presentterminalvalue),
                        'en-US',
                        '1.0-0'
                      ),
                    Total:
                      '$ ' +
                      formatNumber(Number(v.valuationtotal), 'en-US', '1.0-0'),
                  };
                  ELEMENT_PL.push(pushData);
                });
                ELEMENT_PL_PDF = ELEMENT_PL;
                this.displayedColumns = ['0'].concat(
                  ELEMENT_PL.map((x) => x.inMillions.toString())
                );
                this.displayData = this.inputColumns.map((x) =>
                  formatInputRow(x)
                );
                this.progressBar = false;
                const obj = {};
                this.financialObj.forEach((value, key) => {
                  obj[key] = value;
                });
                this.years = Object.keys(obj);
                console.log('years', this.years);
                this.financials = Object.values(obj);
                console.log('financials', this.financials);
                this.initCalculation();
                this.valuationsLoaded = true;

              }); //end of projections
          }, error => {
            this.valuationsLoaded = true;
          }); 
          
          //end of Save Scenarios
      }, error => {
        this.valuationsLoaded = true;
      }); //end of actuals

      // this.valuationsLoaded = true;
    function formatInputRow(row) {
      const output = {};
      output[0] = row;
      for (let i = 0; i < ELEMENT_PL.length; ++i) {
        output[ELEMENT_PL[i].inMillions] = ELEMENT_PL[i][row];
      }
      return output;
    }
  }

  getTotalForPresentValue(){
    return this.financials[0]?.PresentFcf + this.financials[1]?.PresentFcf + this.financials[2]?.PresentFcf + this.financials[3]?.PresentFcf + this.financials[4]?.PresentFcf
  }

  getTotal(){
    return (40 * this.financials[4]?.EBITDA * this.financials[6]?.DiscountFactor) /
                100 +
                this.financials[0]?.PresentFcf +
                this.financials[1]?.PresentFcf +
                this.financials[2]?.PresentFcf +
                this.financials[3]?.PresentFcf +
                this.financials[4]?.PresentFcf
  }

  vkjsda(){

  }

  getTerminalTotal(){
    return  (40 *
      this.financials[4]?.EBITDA *
      this.financials[6]?.DiscountFactor) /
      100 +
      this.financials[6]?.PresentFcf
  }

  saveScenario() {
    this.apiService
      .getData(this.urlConfig.getdcfscenarioAPI() + this.companySelected)
      .subscribe((res: any) => {
        if (this.scenarioSelected == 0) {
          this.saveScenarioNumber = res.scenarios.length;
          this.scenarioSelected = res.scenarios.length;
        } else {
          this.saveScenarioNumber = this.scenarioSelected;
        }

        this.loadedScenario = ('Scenario ' + this.scenarioSelected) as any;
        console.log('finals', this.financialObj);
        const inputArray = [];

        console.log(this.financialObj.get(this.years[0]))

        for (const [key, value] of this.financialObj) {
          const inputObj: any = {};

          inputObj.companyname = this.companySelected;
          inputObj.asof = key.toString();
          // inputObj.wacc = this.financialObj.get(key).wacc;
          inputObj.period = this.financialObj.get(key).Period;
          // inputObj.scenario = this.saveScenarioNumber;
          inputObj.ebitda = this.financialObj.get(key).EBITDA;
          inputObj.scenario = this.scenarioSelected;

          inputObj.costofdebt = this.financialObj.get(this.years[0]).costOfDebt;
          inputObj.costofequity = this.financialObj.get(this.years[0]).costOfEquity;
          inputObj.debequity = this.financialObj.get(this.years[0]).debtEquity;
          inputObj.debttotalcap = this.financialObj.get(this.years[0]).debtToTotalCap;
          inputObj.equitytotalcap = this.financialObj.get(this.years[0]).equityToTotalCap;
          inputObj.ebitdaexitmultiple = this.financialObj.get(this.years[0]).ebitdaExitMultiple;
          inputObj.leveredbeta = this.financialObj.get(this.years[0]).leveredBeta;
          inputObj.aftertaxcostdebt = this.financialObj.get(this.years[0]).afterTaxCostOfDebt;
          inputObj.equityriskpremium = this.financialObj.get(this.years[0]).equityRiskPremium;
          inputObj.riskfreerate = this.financialObj.get(this.years[0]).riskFreeRate;
          inputObj.taxrate = this.financialObj.get(this.years[0]).taxRate;
          inputObj.wacc = this.financialObj.get(this.years[0]).wacc;

          (inputObj.da = this.financialObj.get(key).DepreciationAmortization),
            (inputObj.ebit = this.financialObj.get(key).EBIT),
            (inputObj.netinterest = this.financialObj.get(
              key
            ).NetInterestExpense),
            (inputObj.ebt = this.financialObj.get(key).EBT),
            (inputObj.nols = this.financialObj.get(key).NOLsUtilized),
            (inputObj.ebtpostnol = this.financialObj.get(
              key
            ).EBTPostNOLUtilization),
            (inputObj.cashtaxes = this.financialObj.get(key).CashTaxes),
            (inputObj.ebiat = this.financialObj.get(
              key
            ).EarningsBeforeInterestAfterTaxes),
            (inputObj.da = this.financialObj.get(key).DA),
            (inputObj.capex = this.financialObj.get(key).Capex),
            (inputObj.networkingcapitalchange = this.financialObj.get(
              key
            ).ChangeinNetWorkingCapital),
            (inputObj.unleveredfreecash = this.financialObj.get(
              key
            ).UnleveredFreeCashFlow),
            (inputObj.presentfcf = this.financialObj.get(key).PresentFcf),
            (inputObj.presentterminalvalue = this.financialObj.get(
              key
            ).PresentTerminalValue),
            (inputObj.valuationtotal = this.financialObj.get(key).Total),
            (inputObj.currentnetdebt = this.financialObj.get(key).current),
            (inputObj.equityvalue = this.financialObj.get(this.years[0]).equity),
            (inputObj.totalenterprisevalue = this.financialObj.get(this.years[0]).totalEnterpriseValue),
            (inputObj.DiscountFactor =
              (1 / (1 + inputObj.wacc / 100) ** inputObj.Period) * 100);
          //inputObj.DiscountFactor = this.financialObj.get(key).DiscountFactor;
          (inputObj.fpyebitdaexitmultiple = this.financialObj.get(
            key
          ).fpyebitdaexitmultiple),
            (inputObj.spyebitdaexitmultiple = this.financialObj.get(
              key
            ).spyebitdaexitmultiple),
            inputArray.push(inputObj);
          console.log('Json stringify', inputArray);
        }

        this.apiService
          .postData(
            this.urlConfig.getdcfPOST() + this.companySelected,
            JSON.stringify(inputArray)
          )
          .subscribe((res: any) => {
            console.log(inputArray);
            console.log('latest', res);
            if (res.message == 'Success') {
              this._snackBar.openFromComponent(uploadSnackBarDCFComponent, {
                duration: 5000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
              });
            } else {
              this._snackBar.openFromComponent(
                uploadFailureSnackBarDCFComponent,
                {
                  duration: 5000,
                  horizontalPosition: this.horizontalPosition,
                  verticalPosition: this.verticalPosition,
                }
              );
            }
          });
        // this.initScenario(this.scenarioSelected);
      });
  }

  addScenario() {
    const existingScenarios = this.UserDetailModelService.getScenarioNumber();
    if (existingScenarios.length < 9) {
      this.scenario = existingScenarios.length;
      this._snackBar.openFromComponent(uploadSnackBarDCFAddComponent, {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
      //loading default scenario
      this.initScenario(0);
    } else {
      this._snackBar.openFromComponent(uploadFailureSnackBarDCFAddComponent, {
        duration: 5000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
      });
    }
  }

  openPopUpModal(content, key, label) {

    this.editPopUp = {
      key: key,
      label: label,
      value: this.financialObj && this.financialObj.get(this.years[0]) && this.financialObj.get(this.years[0])[key] ? this.financialObj.get(this.years[0])[key] : 0
    }
    
    this.modalService.open(content, { centered: true });
  }

  getValue(event){
    let value = 0;
    console.log(event)
    value = this.financialObj && this.financialObj[5] && this.financialObj[5][this.editPopUp.key] ? +this.financialObj[5][this.editPopUp.key] : 0;

    return (+value).toFixed(2);
  }

  assignValues(){
    this.financialObj.get(this.years[0])[this.editPopUp.key] = this.editPopUp.value;

    this.initCalculation()
  }

  initCalculation(){
    // const keys = this.financialObj.keys();


    // WACC Calculation
    this.calculateDebtToEquity()

    this.calculateLeveredBeta();

    this.calculateCostOfEquity();

    this.calculateAfterTaxCostOfDebt();

    this.calculateWacc();
    // WACC Calculation


    //Valutions Calculation
    this.calculateDiscountFactor();

    this.calculatePresentValueFCF();

    this.calculateTotalPresentValueFCF()

    this.calculatePresentValueOfTerminalValue()

    this.calculateTotalPresentValueOfTerminalValue()

    this.calculateTotal()

    this.calculateEnterpriseValue();

    this.calculateEquityValue();

    this.calculateFYProjEbitdaMultiple();

    this.calculateSYProjEbitdaMultiple();

    //Valutions Calculation


    const obj = {};
    
    this.financialObj.forEach((value, key) => {
      obj[key] = value;
    });

    this.years = Object.keys(obj);
    console.log('years', this.years);
    this.financials = Object.values(obj);

    console.log("After Calc", this.financials)
  }



  calculateDiscountFactor(){
    for (const [key, value] of this.financialObj){
      if(key.indexOf("-") == -1 ){
        const operand1 = (1 + (this.financialObj.get(key).wacc/100)) ** this.financialObj.get(key).Period
        this.financialObj.get(key).DiscountFactor = (1/operand1) * 100;
		console.log("discount",this.financialObj.get(key).wacc)
		console.log("discount",this.financialObj.get(key).DiscountFactor)
		console.log("period",this.financialObj.get(key).Period)
      }
    }
  }

  calculatePresentValueFCF(){
    this.years.forEach( fy => {
      if(fy.indexOf("-") == -1 && fy != "terminal"){
        this.financialObj.get(fy).PresentFcf = (this.financialObj.get(fy).DiscountFactor/100) * this.financialObj.get(fy).UnleveredFreeCashFlow
		console.log("fcf",this.financialObj.get(fy).PresentFcf)
		console.log("discountfactor",this.financialObj.get(fy).DiscountFactor/100)
		console.log("uncf",this.financialObj.get(fy).UnleveredFreeCashFlow)
      }
    })
  }
  

  calculatePresentValueOfTerminalValue(){
    const totalYear = this.years.find( fy => fy.indexOf("-") >= 0)
    let lastPY = ""
    if(totalYear){
      lastPY = totalYear.split("-")[1];
    }
    this.financialObj.get("terminal").PresentTerminalValue = this.financialObj.get(this.years[0]).ebitdaExitMultiple * this.financialObj.get(lastPY).EBITDA * (this.financialObj.get("terminal").DiscountFactor/100)
  }

  calculateTotalPresentValueFCF(){
	const totalYear = this.years.find( fy => fy.indexOf("-") >= 0)
	this.financialObj.get(totalYear).PresentFcf = this.financialObj.get(this.years[0]).PresentFcf+this.financialObj.get(this.years[1]).PresentFcf+this.financialObj.get(this.years[2]).PresentFcf+this.financialObj.get(this.years[3]).PresentFcf+this.financialObj.get(this.years[4]).PresentFcf
  }
  

  calculateTotalPresentValueOfTerminalValue(){
    const totalYear = this.years.find( fy => fy.indexOf("-") >= 0)
    this.financialObj.get(totalYear).PresentTerminalValue = this.financialObj.get(this.years[6]).PresentTerminalValue
console.log("PFCF",this.financialObj.get(this.years[6]).PresentTerminalValue)
  }

  calculateTotal(){
    this.years.forEach( fy => {
      this.financialObj.get(fy).Total = this.financialObj.get(fy).PresentTerminalValue + this.financialObj.get(fy).PresentFcf
    })
  }

  calculateEnterpriseValue(){
    const totalYear = this.years.find( fy => fy.indexOf("-") >= 0)
    if(totalYear){
      this.financialObj.get(this.years[0]).totalEnterpriseValue = this.financialObj.get(totalYear).PresentTerminalValue + this.financialObj.get(totalYear).PresentFcf    

    }
  }

  calculateEquityValue(){
    const totalYear = this.years.find( fy => fy.indexOf("-") >= 0)
    if(totalYear){
      this.financialObj.get(this.years[0]).equity = this.financialObj.get(this.years[0]).totalEnterpriseValue + this.financialObj.get(totalYear).current    
    }
  }

  calculateDebtToEquity(){
    console.log(this.financialObj.get(this.years[0]))
    this.financialObj.get(this.years[0]).equityToTotalCap =  100 - (this.financialObj.get(this.years[0]).debtToTotalCap ? this.financialObj.get(this.years[0]).debtToTotalCap : 0)
    this.financialObj.get(this.years[0]).debtEquity = (+this.financialObj.get(this.years[0]).debtToTotalCap / this.financialObj.get(this.years[0]).equityToTotalCap) * 100;
  }

  calculateFYProjEbitdaMultiple(){
    this.financialObj.get(this.years[0]).fpyebitdaexitmultiple = this.financialObj.get(this.years[0]).totalEnterpriseValue/this.financialObj.get(this.years[0]).EBITDA
  }

  calculateSYProjEbitdaMultiple(){
    this.financialObj.get(this.years[1]).spyebitdaexitmultiple = this.financialObj.get(this.years[0]).totalEnterpriseValue/this.financialObj.get(this.years[1]).EBITDA
  }

  calculateLeveredBeta(){

    const operand1 = this.dcf.median.unlevered_beta;
    const operand2 = 1 - (this.financialObj.get(this.years[0]).taxRate/100)
    const operand3 = this.financialObj.get(this.years[0]).debtEquity/100


    this.financialObj.get(this.years[0]).leveredBeta = operand1 * (1 + operand2 * operand3)
  }

  calculateCostOfEquity(){
    this.financialObj.get(this.years[0]).costOfEquity = this.financialObj.get(this.years[0]).riskFreeRate + +this.financialObj.get(this.years[0]).equityRiskPremium * +this.financialObj.get(this.years[0]).leveredBeta
  }

  calculateAfterTaxCostOfDebt(){
    this.financialObj.get(this.years[0]).afterTaxCostOfDebt = ((this.financialObj.get(this.years[0]).costOfDebt/100) * (1 - (+this.financialObj.get(this.years[0]).taxRate/100))) * 100;
  }

  calculateWacc(){
	  this.years.forEach( fy => {
    this.financialObj.get(fy).wacc = (((+this.financialObj.get(this.years[0]).equityToTotalCap/100) * (+this.financialObj.get(this.years[0]).costOfEquity/100)) + ((+this.financialObj.get(this.years[0]).debtToTotalCap/100) * (this.financialObj.get(this.years[0]).afterTaxCostOfDebt/100))) * 100
  })
  }


  getWaccValue(value) {
    value = value;
    return value;
  }

  assignValueToDCFAssumptions(event, key) {
    console.log('event', event);
    const editedValue = event;
    for (const [key, value] of this.financialObj) {
      this.financialObj.get(key).key = editedValue;
    }
  }

  loadScenario(index: number) {
    this.loadedScenario = 'Scenario ' + 'index';
    this.scenario = index;
    this.ngOnInit();
  }

  exportToPdf1() {
    const content = [];
    html2canvas(this.firstBlock.nativeElement).then((canvas1) => {
      const canvasData1 = canvas1.toDataURL();
      content.push({
        image: canvasData1,
        width: 500,
      });

      html2canvas(this.unleveredFreeCashFlow.nativeElement).then((canvas2) => {
        content.push({
          image: canvas2.toDataURL(),
          width: 500,
        });

        html2canvas(this.valuations.nativeElement).then((canvas3) => {
          content.push({
            image: canvas3.toDataURL(),
            width: 500,
          });

          html2canvas(this.valSummary.nativeElement).then((canvas4) => {
            content.push({
              image: canvas4.toDataURL(),
              width: 200,
            });
            let docDefinition = {
              content: content,
            };

            pdfMake
              .createPdf(docDefinition)
              .download(
                'RMI_Insights_Export_' + this.companySelected + '_' + '.pdf'
              );
          });
        });
      });
    });
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
export class uploadSnackBarDCFComponent {
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
export class uploadFailureSnackBarDCFComponent {
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
export class uploadSnackBarDCFAddComponent {
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
export class uploadFailureSnackBarDCFAddComponent {
  scenarioBanner = localStorage.getItem('scenarioSelected');
}
