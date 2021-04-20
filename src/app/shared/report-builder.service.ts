import { Injectable } from '@angular/core';
import { RMIAPIsService } from './rmiapis.service';
import { UrlConfigService } from './url-config.service';
import { formatNumber } from '@angular/common';
import { ExcelService } from './excel.service';
import pdfMake from 'pdfmake/build/pdfmake';
import html2canvas from 'html2canvas';
import { MatDialog } from '@angular/material';
import { cloneDeep } from 'lodash';

import * as moment from 'moment';

import { LoadingPopupComponent } from '../modules/loading-popup/loading-popup.component';
import { isArray } from 'highcharts';
// import { CreditScorecardComponent } from '../modules/credit-scorecard/credit-scorecard.component';
// import pdfFonts from 'pdfmake/build/vfs_fonts';
// pdfMake.vfs = pdfFonts.pdfMake.vfs;
export interface PLElement {  
  inMillions: number;
  'Total Revenue': string;
  'Revenue Y-O-Y Growth rate': string;
  '(-) Cost of Goods Sold (COGS)': string;
  'Gross Profit': string;
  'Gross Margin': string;
  '(-) Selling, General & Administrative Expense (SG&A)': string;
  EBIT: string;
  'EBIT Margin': string;
  '(+) Depreciation & Amortization (D&A)': string;
  EBITDA: string;
  'EBITDA Margin': string;
  '(-) Net Interest/Other Income Expense': string;
  EBT: string;
  'EBT Margin': string;
  '(-) Taxes': string;
  'Net Income': string;
  'Net Income Margin': string;
}
let ELEMENT_PL_PDF: PLElement[] = [];

export interface BSElement {
  inMillions: number;
  'Cash Equivalents': string;
  'Accounts Receivable': string;
  Inventories: string;
  'Prepaid Expenses & Other Current Assets': string;
  'Total Current Assets': string;
  'Property Plant & Equipment': string;
  'Intangible Assets': string;
  Goodwill: string;
  'Other Assets': string;
  'Total Assets': string;
  'Current Portion Long Term Debt': string;
  'Accounts Payable': string;
  'Accrued Liabilities': string;
  'Other Current Liabilities': string;
  'Total Current Liabilities': string;
  'Long Term Debt': string;
  'Other Liabilities': string;
  'Total Shareholders Equity': string;
  'Total Liabilities and Shareholders Equity': string;
  'Memo Check': string;
}
let ELEMENT_BS_PDF: BSElement[] = [];

export interface CFElement {
  inMillions: number;
  NetIncome: string;
  '(+) D&A': string;
  'Funds from Operations': string;
  '(+/–) Δ in Accounts Receivable': string;
  '(+/–) Δ in Inventories': string;
  '(+/–) Δ in Accounts Payable': string;
  '(+/–) Δ in Accrued Liabilities': string;
  '(+/–) Δ in Other Current Liabilities': string;
  'Cash Flow from Operating Activities (CFO)': string;
  '(–) Total Capital Expenditures': string;
  '(+) Asset Sales': string;
  '(+/–) Other Investing Activities': string;
  'Cash Flow from Investing Activities (CFI)': string;
  '(+/–) Debt Issued (Retired)': string;
  '(+/–) Common Stock Issued (Retired)': string;
  '(–) Dividends Paid': string;
  'Cash Flow from Financing Activities (CFF)': string;
  'Net Change in Cash': string;
}

let ELEMENT_CF_PDF: CFElement[] = [];

export interface PeriodicElement {
  position: number;
  name: string;
  fromyear: number;
  toyear: number;
  KPIValue: any;
}


@Injectable({
  providedIn: 'root',
})
export class ReportBuilderService {
  constructor(
    private urlConfig: UrlConfigService,
    private dialog: MatDialog,
    private apiService: RMIAPIsService,
    private excelService: ExcelService,
  ) {}

  reportSelection;
  selectedCompany;
  selectedScenario;

  message = "";

  dataColumnsForProfitability = [
    'Gross Margin: Gross Profit / Revenue',
    'EBITDA Margin: EBITDA / Revenue',
    'Operating Profit Margin: EBIT / Revenue',
    'Pre-Tax Margin: EBT / Revenue',
    'Net Income Margin: Net Income / Revenue',
  ];

  dataColumnsForReturn = [
    'Operating Return on Assets (ROA): EBIT / Average Total Assets',
    'Cash Return on Assets (ROA): CFO / Average Total Assets',
    'Return on Assets (ROA): Net Income / Average Total Assets',
    'Return on Total Capital: EBIT / Total Debt and Equity',
    `Return on Equity (ROE): Net Income / Average Shareholder's Equity`,
  ];

  dataColumnsForLiquidity = [
    'Current Ratio (Current Assets / Current Liabilities)',
    'Quick Ratio (Cash + Accounts Receivables / Current Liabilities)',
    'Cash Ratio (Cash / Current Liabilities)',
  ];

  dataColumnsForSolvency = [
    'Solvency Ratio (Net Income + D&A / Total Liabilities)',
    'Debt-to-Equity (Total Debt / Total Equity)',
    'Debt-to-Assets (Total Debt / Total Assets)',
    'Equity-to-Assets (Total Equity / Total Assets)',
    'Net Debt-to-EBITDA (Net Debt / EBITDA)',
    'Total Debt-to-EBITDA (Total Debt / EBITDA)',
    'Interest Coverage Ratio (EBIT / Interest Expense)',
    'Debt Service Coverage Ratio (NOI / Total Debt Service)',
  ];

  dataColumnsActualsForIS: string[] = [
    'Revenue CAGR',
    'COGS CAGR',
    'Gross Profit CAGR',
    'EBITDA CAGR',
    'Avg. Gross Margin',
    'Avg. SG&A (as % of Revenue)',
    'Avg. EBIT Margin',
    'Avg. D&A (as % of Revenue)',
    'Avg. EBITDA Margin',
    'Avg. EBT Margin',
    'Avg. Net Income Margin',
  ];
  dataColumnsProjectionsForIS: string[] = [
    'Revenue CAGR',
    'COGS CAGR',
    'Gross Profit CAGR',
    'EBITDA CAGR',
    'Avg. Gross Margin',
    'Avg. SG&A (as % of Revenue)',
    'Avg. EBIT Margin',
    'Avg. D&A (as % of Revenue)',
    'Avg. EBITDA Margin',
    'Avg. EBT Margin',
    'Avg. Net Income Margin',
  ];

  dataColumnsForBS: string[] = [
    'Avg. Days Sales Outstanding (DSO)',
    'Avg. Inventory Days',
    'Avg. Other Current Assets (as % of Revenue)',
    'Avg. Days Payable Outstanding (DPO)',
    'Avg. Accrued Liabilities (as % of COGS)',
    'Avg. Other Current Liabilties (as % of COGS)',
  ];

  dataColumnsActualsForCF: string[] = [
    'Avg. Capex as % of Revenue',
    'Avg. Asset Sales as % of Revenue',
    'Avg. Other Investing Activites as % of Revenue',
    'Avg. Dividends Paid as % of Net Income',
    'Avg. FFO as % of Revenue',
  ];
  dataColumnsProjectionsForCF: string[] = [
    'Avg. Capex as % of Revenue',
    'Avg. Asset Sales as % of Revenue',
    'Avg. Other Investing Activites as % of Revenue',
    'Avg. Dividends Paid as % of Net Income',
    'Avg. FFO as % of Revenue',
    'Avg. CFO as % of Revenue',
    'Avg. CFO as % of EBITDA',
    
  ];

  financialObjForIncomeStatement = new Map();
  financialObjForBS = new Map();
  financialObjForCF = new Map();

  
  ELEMENT_KPI_ACTUALS_IS: PeriodicElement[] = [];
  ELEMENT_KPI_PROJECTIONS_IS: PeriodicElement[] = [];

  ELEMENT_KPI_ACTUALS_BS: PeriodicElement[] = [];
  ELEMENT_KPI_PROJECTIONS_BS: PeriodicElement[] = [];

  ELEMENT_KPI_ACTUALS_CF: PeriodicElement[] = [];
  ELEMENT_KPI_PROJECTIONS_CF: PeriodicElement[] = [];

  imagermi;

  organizationLogo
  
  async initReportBuild(reportSelection, selectedCompany, selectedScenario, imagermi, valuationsContent,cover, creditScoreCard, organizationLogo) {

    this.imagermi = imagermi;
    this.reportSelection = reportSelection;
    this.selectedCompany = selectedCompany;
    this.selectedScenario = selectedScenario;
    this.organizationLogo = organizationLogo

    let finalContent = [];
    for (let index = 0; index < reportSelection.length; index++) {
      const eachReport = reportSelection[index];
      if (eachReport.isSelected) {
        let content;
        const typeOfReport = eachReport.name;
        switch (typeOfReport) {
          case 'Financial Statements':
            try {
              content = await this.buildReportForFinancialStatements(eachReport);
            } catch (error) {
              
            }
            break;

          case 'KPI':
            try {
              content = await this.buildReportForKPI(eachReport);
            } catch (error) {
              
            }

            break;

          case 'Valuations':
            let valData = []

            let valHeaders : any = ["Name", "Actuals", "1.0", "2.0", "3.0", "4.0", "5.0", "Factor Score", "Factor Weight"]

            const mainHeaderV = valHeaders.map((year, index) => {
              if(index == 0){
                return {
                  text: "Valuations",
                  style: 'header',
                  alignment: 'left',
                  colSpan: 3
                }
              }
              else{
                return {}
              }
            })
        
            const subHeaderV = valHeaders.map((year, index) => {
              if(index == 0){
                return {
                  text: this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
                  style: 'subheader',
                  alignment: 'left',
                  colSpan: 3
                }
              }
              else{
                return {}
              }
            })
        
            const imagesV = valHeaders.map((year, index) => {
              if(index == 0){
                return this.getRMILogo()
              }
              else if(index == valHeaders.length - 2 && this.organizationLogo){
                return this.getOrganizationalLogo()
              }
              else{
                return {
                  // text: index,
                  // style: 'subheader',
                  // alignment: 'left',
                }
              }
            })

            valData.push(imagesV)
            valData.push(mainHeaderV)
            valData.push(subHeaderV)

            const tableData = {
              //style: 'tableExample',
              // layout: 'lightHorizontalLines',
      
              table: {
                headerRows: 1,
                heights: 20,
                //width:'auto',
                // widths: [250, 75, 75, 75, 75, 75, 75, 75, 75],
                widths: [235, 70, 70, 70, 70, 70, 70, 70, 70],
      
                body: valData,
              },
              layout: this.getLayoutForTable(),
      
              // pageBreak: "after"
            }

            valuationsContent.unshift(tableData)
        
            content = valuationsContent;

            console.log("Valuations Data", content)
            break;

          case 'Financial Health Scorecard':

            let scoreCardData = []

            let headers : any = ["Name", "Actuals", "1.0", "2.0", "3.0", "4.0", "5.0", "Factor Score", "Factor Weight"]

            const mainHeader = headers.map((year, index) => {
              if(index == 0){
                return {
                  text: "Financial Health Score Card",
                  style: 'header',
                  alignment: 'left',
                  colSpan: 3
                }
              }
              else{
                return {}
              }
            })
        
            const subHeader = headers.map((year, index) => {
              if(index == 0){
                return {
                  text: this.selectedCompany.compName,
                  style: 'subheader',
                  alignment: 'left',
                  colSpan: 3
                }
              }
              else{
                return {}
              }
            })
        
            const images = headers.map((year, index) => {
              if(index == 0){
                return this.getRMILogo()
              }
              else if(index == headers.length - 2 && this.organizationLogo){
                return this.getOrganizationalLogo()
              }
              else{
                return {
                  // text: index,
                  // style: 'subheader',
                  // alignment: 'left',
                }
              }
            })

            scoreCardData.push(images)
            scoreCardData.push(mainHeader)
            scoreCardData.push(subHeader)
        

            content = [      
              {
                //style: 'tableExample',
                // layout: 'lightHorizontalLines',
        
                table: {
                  headerRows: 1,
                  heights: 20,
                  //width:'auto',
                  // widths: [250, 75, 75, 75, 75, 75, 75, 75, 75],
                  widths: [235, 70, 70, 70, 70, 70, 70, 70, 70],
        
                  body: scoreCardData,
                },
                layout: this.getLayoutForTable(),
        
                // pageBreak: "after"
              },
            //   { image: this.imagermi, width: 130, height: 90 },
            //   {
            //     text: "Financial Health Score Card",
            //     style: 'header',
            //  },
            //   {
            //     text: this.selectedCompany.compName,
            //     style: 'subheader',
            //   },

            {
              image: creditScoreCard,
              width: 870,
              pageBreak: "after",
              margin: [0, 10, 0, 10],
              pageOrientation: "portrait",

            }]
            break;

          case 'Ratios':
            let actuals
            try {
              actuals = await this.apiService.getData(`ratios-actuals?company=${this.selectedCompany.compName}`).toPromise();
            } catch (error) {
              
            }
        
            let projections;
            try {
              projections = await this.apiService.getData(`ratios-projections?company=${this.selectedCompany.compName}&scenario=${this.selectedScenario}`).toPromise();
              
            } catch (error) {
              
            }
            try {
              content = this.buildReportForRatios(eachReport, actuals, projections)
            } catch (error) {
              
            }
            break;   
        }

        if (content && content.length > 0) {
          finalContent = finalContent.concat(content);
        }
      }
    }

    const outerLength = finalContent.length - 1
    if(isArray(finalContent[outerLength])){
      const innerLength = finalContent[outerLength].length - 1
      delete finalContent[outerLength][innerLength]["pageBreak"];

    }
    else if(finalContent[outerLength]["pageBreak"]){
      delete finalContent[outerLength]["pageBreak"]
    }

    this.message = ""

    for (let outerIndex = 0; outerIndex < finalContent.length; outerIndex++) {
      for (let innerIndex = 0; innerIndex < finalContent[outerIndex].length; innerIndex++) {
        const obj = finalContent[outerIndex][innerIndex]
        obj["pageOrientation"] = 'portrait'
        finalContent[outerIndex][innerIndex] = obj  
        
      }
    }

    console.log(finalContent);
const imagecover=[]
      imagecover.push({
        text: "",
        // width: 800,
        // height: 1000,
        pageOrientation: "portrait",
        //margin: [120, 10, 100, 10],
		    pageBreak: 'after',
      });
	  
	  finalContent.unshift(imagecover)
    this.exportToFinalPDf(finalContent, cover);

    // setTimeout(() => {
    //   this.dialog.closeAll();
    // }, 1500);
    
  }

  async buildReportForScoreCard(eachReport){
    let content = []
    let scoreCardData
    let actuals;
    let sumProduct

    try {
      scoreCardData = await this.apiService.getData(this.urlConfig.getCreditScoreCardAPI() + this.selectedCompany.compName).toPromise();

      actuals = scoreCardData[1];

      sumProduct = (((scoreCardData[0].revenuecagr)*(scoreCardData[0].factorweight/100))+
      ((scoreCardData[0].avggrossmargin)*(scoreCardData[0].factorweight/100))+
      ((scoreCardData[0].avgebitdamargin)*(scoreCardData[0].factorweight/100))+
      ((scoreCardData[0].totaldebtebitda)*(scoreCardData[0].factorweight/100))
      +((scoreCardData[0].currentratio)*(scoreCardData[0].factorweight/100))+
      ((scoreCardData[0].capexpercent)*(scoreCardData[0].factorweight/100))+
      ((scoreCardData[0].returnassets)*(scoreCardData[0].factorweight/100))
      +((scoreCardData[0].returnequity)*(scoreCardData[0].factorweight/100))+
      ((scoreCardData[0].solvencyratio)*(scoreCardData[0].factorweight/100))+
      ((scoreCardData[0].ebitdacagr)*(scoreCardData[0].factorweight/100)));

    } catch (error) {
      console.log(error)
    }

    const contentScoreCard = this.exportPDFForScoreCard(scoreCardData[0], actuals, sumProduct)

    content.push(contentScoreCard)

    return content;
  }

buildReportForRatios(eachReport, actuals, projections){
  let content;
  const selectedMetric = eachReport.selectedMetric;

  switch (selectedMetric.key) {
    case 'all':
      content = this.buildReportForEachRatios('all', actuals, projections);
      break;

    case 'profitabilityRatios':
      content = this.buildReportForEachRatios('profitabilityRatios', actuals, projections);
      break;

    case 'returnRatios':
      content = this.buildReportForEachRatios('returnRatios', actuals, projections);
      break;

    case 'solvencyRatios':
      content = this.buildReportForEachRatios('solvencyRatios', actuals, projections);
      break;

    case 'liquidityRatios':
      content = this.buildReportForEachRatios('liquidityRatios', actuals, projections);
      break;
  }

  return content;
}

  async buildReportForKPI(eachReport){
    let content;
    const selectedMetric = eachReport.selectedMetric;
    switch (selectedMetric.key) {
      case 'all':
        content = await this.buildReportForEachKPI('all');
        break;

      case 'incomeStatement':
        content = await this.buildReportForEachKPI('incomeStatement');
        break;

      case 'balanceSheet':
        content = await this.buildReportForEachKPI('balanceSheet');
        break;

      case 'cashflow':
        content = await this.buildReportForEachKPI('cashflow');
        break;
    }

    return content;
  }

  buildReportForEachRatios(typeOfSelection, actuals, projections){
    let content = [];

    if(typeOfSelection == 'all' || typeOfSelection == 'profitabilityRatios'){
      const data = [];
      const columnFields = ['name'];
      const actualColumns = [];
      const projectionColumn = [];
      const averages = [];
      const averageColumns = [];
      actuals.forEach((d: any, index: number) => {
        if (typeof d.asof === 'number') {
          actualColumns.push({ value: String(d.asof), index });
        } else {
          averages.push({ value: d.asof, isActual: true, index });
          averageColumns.push(d.asof);
        }
      });
      projections.forEach((d: any, index: number) => {
        if (typeof d.asof === 'number') {
          projectionColumn.push({ value: String(d.asof), index });
        } else {
          averages.push({ value: d.asof, isActual: false, index });
          averageColumns.push(d.asof);
        }
      });
      const actualSpan = actualColumns.length;
      const projectionSpan = projectionColumn.length;
      const grossmargin: any = {
        name: this.dataColumnsForProfitability[0],
      };
      actualColumns.forEach((d: any) => {
        grossmargin[d.value] = (actuals[d.index] || {}).grossmargin || 0;
      });
      projectionColumn.forEach((d: any) => {
        grossmargin[d.value] =
          (projections[d.index] || {}).grossmargin || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          grossmargin[a.value] =
            (actuals[a.index] || {}).grossmargin || 0.0;
        } else {
          grossmargin[a.value] =
            (projections[a.index] || {}).grossmargin || 0.0;
        }
      });
      data.push(grossmargin);
      const ebitdamargin: any = {
        name: this.dataColumnsForProfitability[1],
      };
      actualColumns.forEach((d: any) => {
        ebitdamargin[d.value] = (actuals[d.index] || {}).ebitdamargin || 0;
      });
      projectionColumn.forEach((d: any) => {
        ebitdamargin[d.value] =
          (projections[d.index] || {}).ebitdamargin || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          ebitdamargin[a.value] =
            (actuals[a.index] || {}).ebitdamargin || 0.0;
        } else {
          ebitdamargin[a.value] =
            (projections[a.index] || {}).ebitdamargin || 0.0;
        }
      });
      data.push(ebitdamargin);
      const operatingprofitmargin: any = {
        name: this.dataColumnsForProfitability[2],
      };
      actualColumns.forEach((d: any) => {
        operatingprofitmargin[d.value] =
          (actuals[d.index] || {}).operatingprofitmargin || 0;
      });
      projectionColumn.forEach((d: any) => {
        operatingprofitmargin[d.value] =
          (projections[d.index] || {}).operatingprofitmargin || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          operatingprofitmargin[a.value] =
            (actuals[a.index] || {}).operatingprofitmargin || 0.0;
        } else {
          operatingprofitmargin[a.value] =
            (projections[a.index] || {}).operatingprofitmargin || 0.0;
        }
      });
      data.push(operatingprofitmargin);
      const pretaxmargin: any = {
        name: this.dataColumnsForProfitability[3],
      };
      actualColumns.forEach((d: any) => {
        pretaxmargin[d.value] = (actuals[d.index] || {}).pretaxmargin || 0;
      });
      projectionColumn.forEach((d: any) => {
        pretaxmargin[d.value] =
          (projections[d.index] || {}).pretaxmargin || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          pretaxmargin[a.value] =
            (actuals[a.index] || {}).pretaxmargin || 0.0;
        } else {
          pretaxmargin[a.value] =
            (projections[a.index] || {}).pretaxmargin || 0.0;
        }
      });
      data.push(pretaxmargin);
      const netincomemargin: any = {
        name: this.dataColumnsForProfitability[4],
      };
      actualColumns.forEach((d: any) => {
        netincomemargin[d.value] =
          (actuals[d.index] || {}).netincomemargin || 0;
      });
      projectionColumn.forEach((d: any) => {
        netincomemargin[d.value] =
          (projections[d.index] || {}).netincomemargin || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          netincomemargin[a.value] =
            (actuals[a.index] || {}).netincomemargin || 0.0;
        } else {
          netincomemargin[a.value] =
            (projections[a.index] || {}).netincomemargin || 0.0;
        }
      });
      data.push(netincomemargin);
      columnFields.push(
        ...actualColumns.map((a) => a.value),
        ...projectionColumn.map((a) => a.value),
        ...averages.map((a) => a.value)
      );
      // console.log('Loaded!', this.loading, this.actuals, this.projections);
        this.excelService.profitabilityRatiosData = data;


        const contentProfit = this.exportToPDFProfitability()

        content.push(contentProfit);
    }

    if(typeOfSelection == 'all' || typeOfSelection == 'returnRatios'){
      const data = [];
      const columnFields = ['name'];
      const actualColumns = [];
      const projectionColumn = [];
      const averages = [];
      const averageColumns = [];
      actuals.forEach((d: any, index: number) => {
        if (typeof d.asof === 'number') {
          actualColumns.push({ value: String(d.asof), index });
        } else {
          averages.push({ value: d.asof, isActual: true, index });
          averageColumns.push(d.asof);
        }
      });
      projections.forEach((d: any, index: number) => {
        if (typeof d.asof === 'number') {
          projectionColumn.push({ value: String(d.asof), index });
        } else {
          averages.push({ value: d.asof, isActual: false, index });
          averageColumns.push(d.asof);
        }
      });
      const actualSpan = actualColumns.length;
      const projectionSpan = projectionColumn.length;
      const operatingreturnassets: any = {
        name: this.dataColumnsForReturn[0],
      };
      actualColumns.forEach((d: any) => {
        operatingreturnassets[d.value] =
          actuals[d.index].operatingreturnassets || 0;
      });
      projectionColumn.forEach((d: any) => {
        operatingreturnassets[d.value] =
          projections[d.index].operatingreturnassets || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          operatingreturnassets[a.value] =
            actuals[a.index].operatingreturnassets || 0.0;
        } else {
          operatingreturnassets[a.value] =
            projections[a.index].operatingreturnassets || 0.0;
        }
      });
      data.push(operatingreturnassets);
      const cashreturnassets: any = {
        name: this.dataColumnsForReturn[1],
      };
      actualColumns.forEach((d: any) => {
        cashreturnassets[d.value] = actuals[d.index].cashreturnassets || 0;
      });
      projectionColumn.forEach((d: any) => {
        cashreturnassets[d.value] =
          projections[d.index].cashreturnassets || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          cashreturnassets[a.value] =
            actuals[a.index].cashreturnassets || 0.0;
        } else {
          cashreturnassets[a.value] =
            projections[a.index].cashreturnassets || 0;
        }
      });
      data.push(cashreturnassets);
      const returnassets: any = {
        name: this.dataColumnsForReturn[2],
      };
      actualColumns.forEach((d: any) => {
        returnassets[d.value] = actuals[d.index].returnassets || 0;
      });
      projectionColumn.forEach((d: any) => {
        returnassets[d.value] = projections[d.index].returnassets || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          returnassets[a.value] = actuals[a.index].returnassets || 0;
        } else {
          returnassets[a.value] = projections[a.index].returnassets || 0;
        }
      });
      data.push(returnassets);
      const returntotalcapital: any = {
        name: this.dataColumnsForReturn[3],
      };
      actualColumns.forEach((d: any) => {
        returntotalcapital[d.value] =
          actuals[d.index].returntotalcapital || 0;
      });
      projectionColumn.forEach((d: any) => {
        returntotalcapital[d.value] =
          projections[d.index].returntotalcapital || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          returntotalcapital[a.value] =
            actuals[a.index].returntotalcapital || 0;
        } else {
          returntotalcapital[a.value] =
            projections[a.index].returntotalcapital || 0;
        }
      });
      data.push(returntotalcapital);
      const returnequity: any = {
        name: this.dataColumnsForReturn[4],
      };
      actualColumns.forEach((d: any) => {
        returnequity[d.value] = actuals[d.index].returnequity || 0;
      });
      projectionColumn.forEach((d: any) => {
        returnequity[d.value] = projections[d.index].returnequity || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          returnequity[a.value] = actuals[a.index].returnequity || 0;
        } else {
          returnequity[a.value] = projections[a.index].returnequity || 0;
        }
      });
      data.push(returnequity);

      columnFields.push(
        ...actualColumns.map((a) => a.value),
        ...projectionColumn.map((a) => a.value),
        ...averages.map((a) => a.value)
      );
      // console.log('Loaded!', this.loading, this.actuals, this.projections);
      this.excelService.returnRatiosData = data

      const contentReturn = this.exportToPDFReturn()

      content.push(contentReturn);
    }

    if(typeOfSelection == 'all' || typeOfSelection == 'liquidityRatios'){
      const data = [];
      const columnFields = ['name'];
      const actualColumns = [];
      const projectionColumn = [];
      const averages = [];
      const averageColumns = [];
      actuals.forEach((d: any, index: number) => {
        if (typeof d.asof === 'number') {
          actualColumns.push({ value: String(d.asof), index });
        } else {
          averages.push({ value: d.asof, isActual: true, index });
          averageColumns.push(d.asof);
        }
      });
      projections.forEach((d: any, index: number) => {
        if (typeof d.asof === 'number') {
          projectionColumn.push({ value: String(d.asof), index });
        } else {
          averages.push({ value: d.asof, isActual: false, index });
          averageColumns.push(d.asof);
        }
      });
      const actualSpan = actualColumns.length;
      const projectionSpan = projectionColumn.length;
      const currentRatio: any = {
        name: this.dataColumnsForLiquidity[0],
      };
      actualColumns.forEach((d: any) => {
        currentRatio[d.value] = actuals[d.index].currentRatio || 0;
      });
      projectionColumn.forEach((d: any) => {
        currentRatio[d.value] = projections[d.index].currentRatio || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          currentRatio[a.value] = actuals[a.index].currentRatio || 0.0;
        } else {
          currentRatio[a.value] = projections[a.index].currentRatio || 0.0;
        }
      });
      data.push(currentRatio);
      const quickratio: any = {
        name: this.dataColumnsForLiquidity[1],
      };
      actualColumns.forEach((d: any) => {
        quickratio[d.value] = actuals[d.index].quickratio || 0;
      });
      projectionColumn.forEach((d: any) => {
        quickratio[d.value] = projections[d.index].quickratio || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          quickratio[a.value] = actuals[a.index].quickratio || 0.0;
        } else {
          quickratio[a.value] = projections[a.index].quickratio || 0.0;
        }
      });
      data.push(quickratio);
      const cashratio: any = {
        name: this.dataColumnsForLiquidity[2],
      };
      actualColumns.forEach((d: any) => {
        cashratio[d.value] = actuals[d.index].cashratio || 0;
      });
      projectionColumn.forEach((d: any) => {
        cashratio[d.value] = projections[d.index].cashratio || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          cashratio[a.value] = actuals[a.index].cashratio || 0.0;
        } else {
          cashratio[a.value] = projections[a.index].cashratio || 0.0;
        }
      });
      data.push(cashratio);
      columnFields.push(
        ...actualColumns.map((a) => a.value),
        ...projectionColumn.map((a) => a.value),
        ...averages.map((a) => a.value)
      );
      // console.log('Loaded!', this.loading, this.actuals, this.projections);
      this.excelService.liquidityRatiosData = data;

      const contentLiquidity = this.exportToPDFLiquidity()

      content.push(contentLiquidity);
    }

    if(typeOfSelection == 'all' || typeOfSelection == 'solvencyRatios'){
      const data = [];
      const columnFields = ['name'];
      const actualColumns = [];
      const projectionColumn = [];
      const averages = [];
      const averageColumns = [];
      actuals.forEach((d: any, index: number) => {
        if (typeof d.asof === 'number') {
          actualColumns.push({ value: String(d.asof), index });
        } else {
          averages.push({ value: d.asof, isActual: true, index });
          averageColumns.push(d.asof);
        }
      });
      projections.forEach((d: any, index: number) => {
        if (typeof d.asof === 'number') {
          projectionColumn.push({ value: String(d.asof), index });
        } else {
          averages.push({ value: d.asof, isActual: false, index });
          averageColumns.push(d.asof);
        }
      });
      const actualSpan = actualColumns.length;
      const projectionSpan = projectionColumn.length;
      // solvency ratio
      const solvencyratio: any = {
        name: this.dataColumnsForSolvency[0],
      };
      actualColumns.forEach((d: any) => {
        solvencyratio[d.value] = actuals[d.index].solvencyratio || 0;
      });
      projectionColumn.forEach((d: any) => {
        solvencyratio[d.value] = projections[d.index].solvencyratio || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          solvencyratio[a.value] = actuals[a.index].solvencyratio || 0;
        } else {
          solvencyratio[a.value] = projections[a.index].solvencyratio || 0;
        }
      });
      data.push(solvencyratio);
      // debtequity
      const debtequity: any = {
        name: this.dataColumnsForSolvency[1],
      };
      actualColumns.forEach((d: any) => {
        debtequity[d.value] = actuals[d.index].debtequity || 0;
      });
      projectionColumn.forEach((d: any) => {
        debtequity[d.value] = projections[d.index].debtequity || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          debtequity[a.value] = actuals[a.index].debtequity || 0;
        } else {
          debtequity[a.value] = projections[a.index].debtequity || 0;
        }
      });
      data.push(debtequity);
      // debtassets
      const debtassets: any = {
        name: this.dataColumnsForSolvency[2],
      };
      actualColumns.forEach((d: any) => {
        debtassets[d.value] = actuals[d.index].debtassets || 0;
      });
      projectionColumn.forEach((d: any) => {
        debtassets[d.value] = projections[d.index].debtassets || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          debtassets[a.value] = actuals[a.index].debtassets || 0;
        } else {
          debtassets[a.value] = projections[a.index].debtassets || 0;
        }
      });
      data.push(debtassets);
      // equity assets
      const equityassets: any = {
        name: this.dataColumnsForSolvency[3],
      };
      actualColumns.forEach((d: any) => {
        equityassets[d.value] = actuals[d.index].equityassets || 0;
      });
      projectionColumn.forEach((d: any) => {
        equityassets[d.value] = projections[d.index].equityassets || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          equityassets[a.value] = actuals[a.index].equityassets || 0;
        } else {
          equityassets[a.value] = projections[a.index].equityassets || 0;
        }
      });
      data.push(equityassets);
      // net detebitda
      const netdebtebitda: any = {
        name: this.dataColumnsForSolvency[4],
      };
      actualColumns.forEach((d: any) => {
        netdebtebitda[d.value] = actuals[d.index].netdebtebitda || 0;
      });
      projectionColumn.forEach((d: any) => {
        netdebtebitda[d.value] = projections[d.index].netdebtebitda || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          netdebtebitda[a.value] = actuals[a.index].netdebtebitda || 0;
        } else {
          netdebtebitda[a.value] = projections[a.index].netdebtebitda || 0;
        }
      });
      data.push(netdebtebitda);
      // total debt ebitda
      const totaldebtebitda: any = {
        name: this.dataColumnsForSolvency[5],
      };
      actualColumns.forEach((d: any) => {
        totaldebtebitda[d.value] = actuals[d.index].totaldebtebitda || 0;
      });
      projectionColumn.forEach((d: any) => {
        totaldebtebitda[d.value] =
          projections[d.index].totaldebtebitda || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          totaldebtebitda[a.value] = actuals[a.index].totaldebtebitda || 0;
        } else {
          totaldebtebitda[a.value] =
            projections[a.index].totaldebtebitda || 0;
        }
      });
      data.push(totaldebtebitda);
      // interest coverage ration
      const interestcoverageratio: any = {
        name: this.dataColumnsForSolvency[6],
      };
      actualColumns.forEach((d: any) => {
        interestcoverageratio[d.value] =
          actuals[d.index].interestcoverageratio || 0;
      });
      projectionColumn.forEach((d: any) => {
        interestcoverageratio[d.value] =
          projections[d.index].interestcoverageratio || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          interestcoverageratio[a.value] =
            actuals[a.index].interestcoverageratio || 0;
        } else {
          interestcoverageratio[a.value] =
            projections[a.index].interestcoverageratio || 0;
        }
      });
      data.push(interestcoverageratio);
      // debt coverage ratio
      const debtcoverageratio: any = {
        name: this.dataColumnsForSolvency[7],
      };
      actualColumns.forEach((d: any) => {
        debtcoverageratio[d.value] =
          actuals[d.index].debtcoverageratio || 0;
      });
      projectionColumn.forEach((d: any) => {
        debtcoverageratio[d.value] =
          projections[d.index].debtcoverageratio || 0;
      });
      averages.forEach((a) => {
        if (a.isActual) {
          debtcoverageratio[a.value] =
            actuals[a.index].debtcoverageratio || 0;
        } else {
          debtcoverageratio[a.value] =
            projections[a.index].debtcoverageratio || 0;
        }
      });
      data.push(debtcoverageratio);

      columnFields.push(
        ...actualColumns.map((a) => a.value),
        ...projectionColumn.map((a) => a.value),
        ...averages.map((a) => a.value)
      );
      // console.log('Loaded!', this.loading, this.actuals, this.projections);
      this.excelService.solvencyRatiosData = data;

      const contentSolvency = this.exportToPDFSolvency()

      content.push(contentSolvency);
    }

    return content;
  }

  exportToPDFSolvency(){

    const keysSolvency = Object.keys(this.excelService.solvencyRatiosData[0]);
    const onlyYears = keysSolvency.filter( k => {
      return k.indexOf("-") < 0 && k != "name";
    })

    const solvencyRatiosKeys = ["name"].concat(onlyYears).concat(keysSolvency.filter( k => k.indexOf("-") >= 0))
    const solvencyRatiosHeaders = solvencyRatiosKeys.map( (name, index) => {
      if(index == 0){
        return {text: "Solvency Ratios", bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else if (index <= (solvencyRatiosKeys.length - 3) && index >= (solvencyRatiosKeys.length - 7)){
        return {text: name+"E", bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else if(index <= (solvencyRatiosKeys.length - 8) && index >= (solvencyRatiosKeys.length - 10)){
        return {text: name+"A", bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    let solvencyRatiosData = []
    this.excelService.solvencyRatiosData.forEach((obj,index) => {
      const values = []
      solvencyRatiosKeys.forEach( key => {
        values.push(obj[key]);
      })
      solvencyRatiosData.push(this.getMappedArrS(values,index))
    });

    const commmonHeaders = keysSolvency.map( (name, index) => {
      if(index == 2){
        return {text: "Actuals", bold: true, fillColor: '#fff', color: "#000", margin: [10, 10, 0, 10], border: [0, 0, 10, 0], alignment: "left"}
      }
      else if(index == 6){
        return {text: "Projections", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 10, 0], alignment: "left"}
      }
      else if(index == 9){
        return {text: "Average", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 0, 0], alignment: "right"}
      }
      else{
        return {text: "", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 0, 0], alignment: "right"}
      }
    })

    const mainHeader = solvencyRatiosKeys.map((year, index) => {
      if(index == 0){
        return {
          text: "Solvency Ratios"  ,
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeader = solvencyRatiosKeys.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const images = solvencyRatiosKeys.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == solvencyRatiosKeys.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })

    const finalDataForSolvency = [images].concat([mainHeader]).concat([subHeader]).concat([cloneDeep(commmonHeaders)]).concat([solvencyRatiosHeaders]).concat(solvencyRatiosData)

    const content = [

    //   { image: this.imagermi, width: 130, height: 90 },
    //   {
    //     text: "Solvency Ratios"  ,
    //     style: 'header',
    //  },
    //   {
    //     text: this.selectedCompany.compName + " - Scenario " + this.selectedScenario,
    //     style: 'subheader',
    //   },
      
      
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',
        // style: 'tableExample',
        table: {
          headerRows: 2,
          height: "auto",
          // width:'auto',
          widths: this.getWidthsForRatios(),
          body: finalDataForSolvency
        },
        layout: this.getLayoutForTable(3),

        pageBreak: 'after'
      }
    ]

    return content
  }

  exportToPDFLiquidity(){
    const keysLiquidity = Object.keys(this.excelService.liquidityRatiosData[0]);
    const onlyYears = keysLiquidity.filter( k => {
      return k.indexOf("-") < 0 && k != "name";
    })

    const liquidityRatiosKeys = ["name"].concat(onlyYears).concat(keysLiquidity.filter( k => k.indexOf("-") >= 0))
    const liquidityRatiosHeaders = liquidityRatiosKeys.map( (name, index) => {
      if(index == 0){
        return {text: "Liquidity Ratios", bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else if (index <= (liquidityRatiosKeys.length - 3) && index >= (liquidityRatiosKeys.length - 7)){
        return {text: name+"E", bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else if(index <= (liquidityRatiosKeys.length - 8) && index >= (liquidityRatiosKeys.length - 10)){
        return {text: name+"A", bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    let liquidityRatiosData = []
    this.excelService.liquidityRatiosData.forEach((obj) => {
      const values = []
      liquidityRatiosKeys.forEach( key => {
        values.push(obj[key]);
      })
      liquidityRatiosData.push(this.getMappedArr(values))
    });

    const commmonHeaders = liquidityRatiosKeys.map( (name, index) => {
      if(index == 2){
        return {text: "Actuals", bold: true, fillColor: '#fff', color: "#000", margin: [10, 10, 0, 10], border: [0, 0, 10, 0], alignment: "left"}
      }
      else if(index == 6){
        return {text: "Projections", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 10, 0], alignment: "left"}
      }
      else if(index == 9){
        return {text: "Average", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 0, 0], alignment: "right"}
      }
      else{
        return {text: "", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 0, 0], alignment: "right"}
      }
    })

    const mainHeader = liquidityRatiosKeys.map((year, index) => {
      if(index == 0){
        return {
          text: "Liquidity Ratios"  ,
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeader = liquidityRatiosKeys.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const images = liquidityRatiosKeys.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == liquidityRatiosKeys.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })

    const finalDataForLiquidity= [images].concat([mainHeader]).concat([subHeader]).concat([cloneDeep(commmonHeaders)]).concat([liquidityRatiosHeaders]).concat(liquidityRatiosData)

    const content = [
      // { image: this.imagermi, width: 130, height: 90 },

      // {
      //   text: "Liquidity Ratios"  ,
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - Scenario " + this.selectedScenario,
      //   style: 'subheader',
      // },
      {
      //style: 'tableExample',
      // layout: 'lightHorizontalLines',
      // style: 'tableExample',
      table: {
        headerRows: 2,
        height: "auto",
        // width:'auto',
        widths: this.getWidthsForRatios(),
        body: finalDataForLiquidity
      },
      layout: this.getLayoutForTable(3),
      pageBreak: "after"
    }
    ]

    return content

  }

  exportToPDFReturn(){
    const keysReturn = Object.keys(this.excelService.returnRatiosData[0]);
    let onlyYears = keysReturn.filter( k => {
      return k.indexOf("-") < 0 && k != "name";
    })

    const returnRatiosKeys = ["name"].concat(onlyYears).concat(keysReturn.filter( k => k.indexOf("-") >= 0))
    const returnRatiosHeaders = returnRatiosKeys.map( (name, index) => {
      if(index == 0){
        return {text: "Return Ratios", bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else if (index <= (returnRatiosKeys.length - 3) && index >= (returnRatiosKeys.length - 7)){
        return {text: name+"E", bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else if(index <= (returnRatiosKeys.length - 8) && index >= (returnRatiosKeys.length - 10)){
        return {text: name+"A", bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    let returnRatiosData = []
    this.excelService.returnRatiosData.forEach((obj) => {
      const values = []
      returnRatiosKeys.forEach( key => {
        values.push(obj[key]);
      })
      returnRatiosData.push(this.getMappedArr(values))
    });


    const commmonHeaders = returnRatiosKeys.map( (name, index) => {
      if(index == 2){
        return {text: "Actuals", bold: true, fillColor: '#fff', color: "#000", margin: [10, 10, 0, 10], border: [0, 0, 10, 0], alignment: "left"}
      }
      else if(index == 6){
        return {text: "Projections", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 10, 0], alignment: "left"}
      }
      else if(index == 9){
        return {text: "Average", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 0, 0], alignment: "right"}
      }
      else{
        return {text: "", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 0, 0], alignment: "right"}
      }
    })

    const mainHeader = returnRatiosKeys.map((year, index) => {
      if(index == 0){
        return {
          text: "Return Ratios"  ,
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeader = returnRatiosKeys.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const images = returnRatiosKeys.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == returnRatiosKeys.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })


    const finalDataForReturn = [images].concat([mainHeader]).concat([subHeader]).concat([cloneDeep(commmonHeaders)]).concat([returnRatiosHeaders]).concat(returnRatiosData)
    const content = [
      // { image: this.imagermi, width: 130, height: 90 },

      // {
      //   text: "Return Ratios"  ,
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - Scenario " + this.selectedScenario,
      //   style: 'subheader',
      // },
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',
        // style: 'tableExample',
        table: {
          headerRows: 2,
          height: 'auto',
          // width:'auto',
          widths: this.getWidthsForRatios(),
          body: finalDataForReturn
        },
        layout: this.getLayoutForTable(3),
        pageBreak: "after"
      },
    ]

    return content;
  }

  exportToPDFProfitability(){
    
    const keysProfit = Object.keys(this.excelService.profitabilityRatiosData[0]);
    const onlyYears = keysProfit.filter( k => {
      return k.indexOf("-") < 0 && k != "name";
    })

    const profitabilityRatiosKeys = ["name"].concat(onlyYears).concat(keysProfit.filter( k => k.indexOf("-") >= 0))
    const profitabilityRatiosHeaders = profitabilityRatiosKeys.map( (name, index) => {
      if(index == 0){
        return {text: "Profitability Ratios", bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else if (index <= (profitabilityRatiosKeys.length - 3) && index >= (profitabilityRatiosKeys.length - 7)){
        return {text: name+"E", bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else if(index <= (profitabilityRatiosKeys.length - 8) && index >= (profitabilityRatiosKeys.length - 10)){
        return {text: name+"A", bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    const mainHeader : any = profitabilityRatiosKeys.map((year, index) => {
      if(index == 0){
        return {
          text: "Profitability Ratios"  ,
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeader = profitabilityRatiosKeys.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const images = profitabilityRatiosKeys.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == profitabilityRatiosKeys.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })


    const commmonHeaders = profitabilityRatiosKeys.map( (name, index) => {
      if(index == 2){
        return {text: "Actuals", bold: true, fillColor: '#fff', color: "#000", margin: [10, 10, 0, 10], border: [0, 0, 10, 0], alignment: "left"}
      }
      else if(index == 6){
        return {text: "Projections", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 10, 0], alignment: "left"}
      }
      else if(index == 9){
        return {text: "Average", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 0, 0], alignment: "right"}
      }
      else{
        return {text: "", bold: true, fillColor: '#fff', color: "#000", margin: [0, 10, 0, 10], border: [0, 0, 0, 0], alignment: "right"}
      }
    })

    let profitabilityRatiosData = []
    this.excelService.profitabilityRatiosData.forEach((obj) => {
      const values = []
      profitabilityRatiosKeys.forEach( key => {
        values.push(obj[key]);
      })
      profitabilityRatiosData.push(this.getMappedArr(values))
    });

    const finalDataForProfit : any = [images].concat([mainHeader]).concat([subHeader]).concat([cloneDeep(commmonHeaders)]).concat([profitabilityRatiosHeaders]).concat(profitabilityRatiosData) as any

    console.log("finalDataForProfit", finalDataForProfit)

    const content =  [
      // { image: this.imagermi, width: 130, height: 90 },

      // // { image: imagermi, width: 150, height: 75 },
      // // { image: imagermi, width: 150, height: 75 },
      // {
      //   text: "Profitability Ratios"  ,
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - Scenario " + this.selectedScenario  ,
      //   style: 'subheader',
      // },
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',
        // style: 'tableExample',
        table: {
          headerRows: 2,
          height: "auto",
          // width:'auto',
          widths: this.getWidthsForRatios(),
          body: finalDataForProfit
        },
        layout: this.getLayoutForTable(3),
        pageBreak: "after"
      },
    ]

    return content
  }

  async buildReportForEachKPI(typeOfSelection){
    let content = [];
    if(typeOfSelection == 'all' || typeOfSelection == 'incomeStatement'){
      this.ELEMENT_KPI_ACTUALS_IS = [];
      this.ELEMENT_KPI_PROJECTIONS_IS = [];
      try {
        const actualsData = await this.apiService.getData(this.urlConfig.getIsKPIActuals() + this.selectedCompany.compName).toPromise();
        const dataValuesActuals = [
          actualsData[0].revenuecagr,
          actualsData[0].cogscagr,
          actualsData[0].grossprofitcagr,
          actualsData[0].ebitdacagr,
          actualsData[0].avggrossmargin,
          actualsData[0].avgsgaasrevenue,
          actualsData[0].avgebitmargin,
          actualsData[0].avgdnaasrevenue,
          actualsData[0].avgebitdamargin,
          actualsData[0].avgebtmargin,
          actualsData[0].avgnetincomemargin,
        ];
        for (
          let index = 0;
          index <= this.dataColumnsActualsForIS.length - 1;
          index++
        ) {
          const pushData = {
            position: index + 1,
            name: this.dataColumnsActualsForIS[index],
            fromyear: actualsData[0].fromyear,
            toyear: actualsData[0].toyear,
            KPIValue: dataValuesActuals[index],
          };
          this.ELEMENT_KPI_ACTUALS_IS.push(pushData);
        }
      } catch (error) {
        
      }

      try {
        const projectedData = await this.apiService
          .getData(
            this.urlConfig.getIsKPIProjections() +
              this.selectedCompany.compName +
              '&scenario=' +
              this.selectedScenario
          ).toPromise();

          const dataValuesProjections = [
            projectedData[0].revenuecagr,
            projectedData[0].cogscagr,
            projectedData[0].grossprofitcagr,
            projectedData[0].ebitdacagr,
            projectedData[0].avggrossmargin,
            projectedData[0].avgsgaasrevenue,
            projectedData[0].avgebitmargin,
            projectedData[0].avgdnaasrevenue,
            projectedData[0].avgebitdamargin,
            projectedData[0].avgebtmargin,
            projectedData[0].avgnetincomemargin,
          ];
          for (
            let index = 0;
            index <= this.dataColumnsProjectionsForIS.length - 1;
            index++
          ) {
            const pushData = {
              position: index + 1,
              name: this.dataColumnsProjectionsForIS[index],
              fromyear: projectedData[0].fromyear,
              toyear: projectedData[0].toyear,
              KPIValue: dataValuesProjections[index],
            };
            this.ELEMENT_KPI_PROJECTIONS_IS.push(pushData);
          }
      } catch (error) {
        
      }

      const contentIS = this.exportToPDFKPIIS();

      content.push(contentIS);
    }

    if(typeOfSelection == 'all' || typeOfSelection == 'balanceSheet'){
      this.ELEMENT_KPI_PROJECTIONS_BS = [];
      this.ELEMENT_KPI_ACTUALS_BS = [];

      try {
        const actualsData = await this.apiService.getData(this.urlConfig.getBsKPIActuals() + this.selectedCompany.compName).toPromise();

        const dataValuesActuals = [
          actualsData[0].dso,
          actualsData[0].inventorydays,
          actualsData[0].othercurrentassetspercent,
          actualsData[0].dpo,
          actualsData[0].accruedliabilitiespercent,
          actualsData[0].othercurrentliabilitiespercent,
        ];
        for (let index = 0; index <= this.dataColumnsForBS.length - 1; index++) {
          const pushData = {
            position: index + 1,
            name: this.dataColumnsForBS[index],
            fromyear: actualsData[0].fromyear,
            toyear: actualsData[0].toyear,
            KPIValue: dataValuesActuals[index],
          };
          this.ELEMENT_KPI_ACTUALS_BS.push(pushData);
        }
      } catch (error) {
        
      }

      try {
        const projectedData = await this.apiService
        .getData(
          this.urlConfig.getBsKPIProjections() +
            this.selectedCompany.compName +
            '&scenario=' +
            this.selectedScenario
        ).toPromise();

        const dataValuesProjections = [
          projectedData[0].dso,
          projectedData[0].inventorydays,
          projectedData[0].othercurrentassetspercent,
          projectedData[0].dpo,
          projectedData[0].accruedliabilitiespercent,
          projectedData[0].othercurrentliabilitiespercent,
        ];
        for (let index = 0; index <= this.dataColumnsForBS.length - 1; index++) {
          let pushData = {
            position: index + 1,
            name: this.dataColumnsForBS[index],
            fromyear: projectedData[0].fromyear,
            toyear: projectedData[0].toyear,
            KPIValue: dataValuesProjections[index],
          };
          this.ELEMENT_KPI_PROJECTIONS_BS.push(pushData);
        }
      } catch (error) {
        
      }

      let contentBS = this.exportToPDFKPIBS();

      content.push(contentBS);

    } 
    if(typeOfSelection == 'all' || typeOfSelection == 'cashflow'){
      this.ELEMENT_KPI_PROJECTIONS_CF = [];
      this.ELEMENT_KPI_ACTUALS_CF = [];

      try {
        const actualsData = await this.apiService
        .getData(this.urlConfig.getKPICashActuals() + this.selectedCompany.compName).toPromise();

        const dataValuesActuals = [
          actualsData[0].capexpercentrevenue,
          actualsData[0].assetsalespercentrevenue,
          actualsData[0].investingpercentrevenue,
          actualsData[0].dividendspaidpercentincome,
          actualsData[0].ffopercentrevenue,
        ];
        for (
          let index = 0;
          index <= this.dataColumnsActualsForCF.length - 1;
          index++
        ) {
          const pushData = {
            position: index + 1,
            name: this.dataColumnsActualsForCF[index],
            fromyear: actualsData[0].fromyear,
            toyear: actualsData[0].toyear,
            KPIValue: dataValuesActuals[index].toFixed(1),
          };
          this.ELEMENT_KPI_ACTUALS_CF.push(pushData);

        }

      } catch (error) {
        
      }

      try {
        const projectedData = await this.apiService
        .getData(this.urlConfig.getKPICashProjections() + this.selectedCompany.compName + '&scenario=' +
        this.selectedScenario).toPromise();

        const dataValuesProjections = [
          projectedData[0].capexpercentrevenue,
          projectedData[0].assetsalespercentrevenue,
          projectedData[0].investingpercentrevenue,
          projectedData[0].dividendspaidpercentincome,
          projectedData[0].ffopercentrevenue,
          projectedData[0].cfopercentrevenue,
          projectedData[0].cfopercentebitda
        ];

        for (
          let index = 0;
          index <= this.dataColumnsProjectionsForCF.length - 1;
          index++
        ) {
          const pushData = {
            position: index + 1,
            name: this.dataColumnsProjectionsForCF[index],
            fromyear: projectedData[0].fromyear,
            toyear: projectedData[0].toyear,
            KPIValue: dataValuesProjections[index].toFixed(1),
          };
          this.ELEMENT_KPI_PROJECTIONS_CF.push(pushData);
        }
      } catch (error) {
        
      }

      let contentCF = this.exportToPDFKPICF();

      content.push(contentCF);
    }

    return content;
  }

  async buildReportForFinancialStatements(eachReport) {
    let content;
    const selectedMetric = eachReport.selectedMetric;
    switch (selectedMetric.key) {
      case 'all':
        content = await this.buildReportForEachMetric('all');
        break;

      case 'incomeStatement':
        content = await this.buildReportForEachMetric('incomeStatement');
        break;

      case 'balanceSheet':
        content = await this.buildReportForEachMetric('balanceSheet');
        break;

      case 'cashflow':
        content = await this.buildReportForEachMetric('cashflow');
        break;
    }

    return content;
  }

  async buildReportForEachMetric(typeOfSelection) {
    const content = [];
    if (typeOfSelection == 'all' || typeOfSelection == 'incomeStatement') {
      let previousAmount = 0;
      const ELEMENT_PL: PLElement[] = [];
      try {
        const actualsData: any = await this.apiService
          .getData(
            this.urlConfig.getIsActualsAPI() + this.selectedCompany.compName
          )
          .toPromise();
        for (let j = 0; j < actualsData.length; j++) {
          if (actualsData[j].latest === 0) {
            previousAmount = actualsData[j].totalrevenue;
          }
          this.financialObjForIncomeStatement.set(actualsData[j].asof, {
            totalRevenue: actualsData[j].totalrevenue,
            revenuepercent: actualsData[j].revenuepercent,
            COGS: actualsData[j].cogs,
            GrossProfit: actualsData[j].grossprofit,
            GrossMargin: actualsData[j].grossprofitmargin,
            SGA: actualsData[j].sga,
            EBIT: actualsData[j].ebit,
            EBITMargin: actualsData[j].ebitmargin,
            DandA: actualsData[j].da,
            EBITDA: actualsData[j].ebitda,
            EBITDAMargin: actualsData[j].ebitdamargin,
            EBT: actualsData[j].ebt,
            EBTMargin: actualsData[j].ebtmargin,
            Taxes: actualsData[j].taxes,
            netIterestExpense: actualsData[j].netinterest,
            NetIncome: actualsData[j].netincome,
            NetIncomeMargin: actualsData[j].netincomemargin,
          });
        }
      } catch (error) {
        console.log('incomeStatement', error);
      }

      try {
        const projectionsData: any = await this.apiService
          .getData(
            this.urlConfig.getIsProjectionsAPIGET() +
              this.selectedCompany.compName +
              '&scenario=' +
              this.selectedScenario
          )
          .toPromise();
        let totalRevenue = 0;
        for (let j = 0; j < projectionsData.length; j++) {
          if (j == 0) {
            totalRevenue = Math.round(
              previousAmount +
                previousAmount * (projectionsData[j].revenuepercent / 100)
            );
          } else {
            totalRevenue = Math.round(
              projectionsData[j - 1].totalRevenue +
                projectionsData[j - 1].totalRevenue *
                  (projectionsData[j].revenuepercent / 100)
            );
          }
          this.financialObjForIncomeStatement.set(projectionsData[j].asof, {
            totalRevenue: projectionsData[j].totalrevenue,
            revenuepercent: projectionsData[j].revenuepercent,
            COGS: projectionsData[j].cogs,
            GrossProfit: projectionsData[j].grossprofit,
            GrossMargin: projectionsData[j].grossprofitmargin,
            SGA: projectionsData[j].sga,
            EBIT: projectionsData[j].ebit,
            EBITMargin: projectionsData[j].ebitmargin,
            DandA: projectionsData[j].da,
            EBITDA: projectionsData[j].ebitda,
            EBITDAMargin: projectionsData[j].ebitdamargin,
            EBT: projectionsData[j].ebt,
            EBTMargin: projectionsData[j].ebtmargin,
            Taxes: projectionsData[j].taxes,
            netIterestExpense: projectionsData[j].netinterestdollars,
            NetIncome: projectionsData[j].netincome,
            NetIncomeMargin: projectionsData[j].netincomemargin,
          });
        }

        this.financialObjForIncomeStatement.forEach((v, k) => {
          var pushData = {
            inMillions: k,
            'Total Revenue':
              '$ ' + formatNumber(Number(v.totalRevenue), 'en-US', '1.0-0'),
            'Revenue Y-O-Y Growth rate': v.revenuepercent + '%',
            '(-) Cost of Goods Sold (COGS)':
              '$ ' + formatNumber(Number(v.COGS), 'en-US', '1.0-0'),
            'Gross Profit':
              '$ ' + formatNumber(Number(v.GrossProfit), 'en-US', '1.0-0'),
            'Gross Margin': v.GrossMargin + '%',
            '(-) Selling, General & Administrative Expense (SG&A)':
              '$ ' + formatNumber(Number(v.SGA), 'en-US', '1.0-0'),
            EBIT: '$ ' + formatNumber(Number(v.EBIT), 'en-US', '1.0-0'),
            'EBIT Margin': v.EBITMargin + '%',
            '(+) Depreciation & Amortization (D&A)':
              '$ ' + formatNumber(Number(v.DandA), 'en-US', '1.0-0'),
            EBITDA: '$ ' + formatNumber(Number(v.EBITDA), 'en-US', '1.0-0'),
            'EBITDA Margin': v.EBITDAMargin + '%',
            '(-) Net Interest/Other Income Expense':
              '$ ' +
              formatNumber(Number(v.netIterestExpense), 'en-US', '1.0-0'),
            EBT: '$ ' + formatNumber(Number(v.EBT), 'en-US', '1.0-0'),
            'EBT Margin': v.EBTMargin + '%',
            '(-) Taxes': '$ ' + formatNumber(Number(v.Taxes), 'en-US', '1.0-0'),
            'Net Income':
              '$ ' + formatNumber(Number(v.NetIncome), 'en-US', '1.0-0'),
            'Net Income Margin': v.NetIncomeMargin + '%',
          };
          ELEMENT_PL.push(pushData);
        });
        ELEMENT_PL_PDF = ELEMENT_PL;
      } catch (error) {
        console.log('incomeStatement', error);
      }

      const contentIS = this.exportToPDFIS();

      content.push(contentIS);
    }

    if (typeOfSelection == 'all' || typeOfSelection == 'balanceSheet') {
      const ELEMENT_BS: BSElement[] = [];

      try {
        const actualsData: any = await this.apiService
          .getData(
            this.urlConfig.getBsActualsAPI() + this.selectedCompany.compName
          )
          .toPromise();
        var memocheck;
        for (let j = 0; j < actualsData.length; j++) {
          if (actualsData[j].memocheck === 0) {
            memocheck = 'Match';
          } else {
            memocheck = 'Not Match';
          }
          this.financialObjForBS.set(actualsData[j].asof, {
            cashequivalents: actualsData[j].cashequivalents,
            accountsreceivable: actualsData[j].accountsreceivable,
            inventories: actualsData[j].inventories,
            othercurrentassets: actualsData[j].othercurrentassets,
            totalcurrentassets: actualsData[j].totalcurrentassets,
            ppe: actualsData[j].ppe,
            intangibleassets: actualsData[j].intangibleassets,
            goodwill: actualsData[j].goodwill,
            otherassets: actualsData[j].otherassets,
            totalassets: actualsData[j].totalassets,
            currentportionlongtermdebt:
              actualsData[j].currentportionlongtermdebt,
            accountspayable: actualsData[j].accountspayable,
            accruedliabilities: actualsData[j].accruedliabilities,
            othercurrentliabilities: actualsData[j].othercurrentliabilities,
            totalcurrentliabilities: actualsData[j].totalcurrentliabilities,
            longtermdebt: actualsData[j].longtermdebt,
            otherliabilities: actualsData[j].otherliabilities,
            totalliabilities: actualsData[j].totalliabilities,
            totalshareholdersequity: actualsData[j].totalshareholdersequity,
            totalliabilitiesandequity: actualsData[j].totalliabilitiesandequity,
            'Memo Check': memocheck,
          });
        }
      } catch (error) {}

      try {
        const projectionsData: any = await this.apiService
          .getData(
            this.urlConfig.getBsProjectionsAPIGET() +
              this.selectedCompany.compName +
              '&scenario=' +
              this.selectedScenario
          )
          .toPromise();
        for (let j = 0; j < projectionsData.length; j++) {
          if (projectionsData[j].memocheck === 0) {
            memocheck = 'Match';
          } else {
            memocheck = 'Not Match';
          }
          this.financialObjForBS.set(projectionsData[j].asof, {
            cashequivalents: projectionsData[j].cashequivalents,
            accountsreceivable: projectionsData[j].accountsreceivable,
            inventories: projectionsData[j].inventories,
            othercurrentassets: projectionsData[j].othercurrentassets,
            totalcurrentassets: projectionsData[j].totalcurrentassets,
            ppe: projectionsData[j].ppe,
            intangibleassets: projectionsData[j].intangibleassets,
            goodwill: projectionsData[j].goodwill,
            otherassets: projectionsData[j].otherassets,
            totalassets: projectionsData[j].totalassets,
            currentportionlongtermdebt:
              projectionsData[j].currentportionlongtermdebt,
            accountspayable: projectionsData[j].accountspayable,
            accruedliabilities: projectionsData[j].accruedliabilities,
            othercurrentliabilities: projectionsData[j].othercurrentliabilities,
            totalcurrentliabilities: projectionsData[j].totalcurrentliabilities,
            longtermdebt: projectionsData[j].longtermdebt,
            otherliabilities: projectionsData[j].otherliabilities,
            totalliabilities: projectionsData[j].totalliabilities,
            totalshareholdersequity: projectionsData[j].totalshareholdersequity,
            totalliabilitiesandequity:
              projectionsData[j].totalliabilitiesandequity,
            'Memo Check': memocheck,
          });
        }

        this.financialObjForBS.forEach((v, k) => {
          var pushData = {
            inMillions: k,
            'Cash Equivalents':
              '$ ' + formatNumber(Number(v.cashequivalents), 'en-US', '1.0-0'),
            'Accounts Receivable':
              '$ ' +
              formatNumber(Number(v.accountsreceivable), 'en-US', '1.0-0'),
            Inventories:
              '$ ' + formatNumber(Number(v.inventories), 'en-US', '1.0-0'),
            'Prepaid Expenses & Other Current Assets':
              '$ ' +
              formatNumber(Number(v.othercurrentassets), 'en-US', '1.0-0'),
            'Total Current Assets':
              '$ ' +
              formatNumber(Number(v.totalcurrentassets), 'en-US', '1.0-0'),
            'Property Plant & Equipment':
              '$ ' + formatNumber(Number(v.ppe), 'en-US', '1.0-0'),
            'Intangible Assets':
              '$ ' + formatNumber(Number(v.intangibleassets), 'en-US', '1.0-0'),
            Goodwill: '$ ' + formatNumber(Number(v.goodwill), 'en-US', '1.0-0'),
            'Other Assets':
              '$ ' + formatNumber(Number(v.otherassets), 'en-US', '1.0-0'),
            'Total Assets':
              '$ ' + formatNumber(Number(v.totalassets), 'en-US', '1.0-0'),
            'Current Portion Long Term Debt':
              '$ ' +
              formatNumber(
                Number(v.currentportionlongtermdebt),
                'en-US',
                '1.0-0'
              ),
            'Accounts Payable':
              '$ ' + formatNumber(Number(v.accountspayable), 'en-US', '1.0-0'),
            'Accrued Liabilities':
              '$ ' +
              formatNumber(Number(v.accruedliabilities), 'en-US', '1.0-0'),
            'Other Current Liabilities':
              '$ ' +
              formatNumber(Number(v.othercurrentliabilities), 'en-US', '1.0-0'),
            'Total Current Liabilities':
              '$ ' +
              formatNumber(Number(v.totalcurrentliabilities), 'en-US', '1.0-0'),
            'Long Term Debt':
              '$ ' + formatNumber(Number(v.longtermdebt), 'en-US', '1.0-0'),
            'Other Liabilities':
              '$ ' + formatNumber(Number(v.otherliabilities), 'en-US', '1.0-0'),
            'Total Shareholders Equity':
              '$ ' +
              formatNumber(Number(v.totalshareholdersequity), 'en-US', '1.0-0'),
            'Total Liabilities and Shareholders Equity':
              '$ ' +
              formatNumber(
                Number(v.totalliabilitiesandequity),
                'en-US',
                '1.0-0'
              ),
            'Memo Check': memocheck,
          };
          ELEMENT_BS.push(pushData);

          ELEMENT_BS_PDF = ELEMENT_BS;
        });
      } catch (error) {}

      const contentBS = this.exportToPDFBS();

      content.push(contentBS);
    }

    if (typeOfSelection == 'all' || typeOfSelection == 'cashflow') {
      const ELEMENT_CF = [] as any;
      try {
        const actualsData: any = await this.apiService
          .getData(
            this.urlConfig.getCashActualsAPI() + this.selectedCompany.compName
          )
          .toPromise();
        for (let j = 0; j < actualsData.length; j++) {
          this.financialObjForCF.set(actualsData[j].asof, {
            Netincome: actualsData[j].netincome,
            DandA: actualsData[j].daa,
            FundsFromOperations: actualsData[j].fundsfromoperations,
            Accountreceivables: actualsData[j].accountreceivablesdelta,
            Inventories: actualsData[j].inventoriesdelta,
            OtherCurrentassets: actualsData[j].othercurrentassets,
            Accountspayable: actualsData[j].accountspayable,

            AccuredLiabilites: actualsData[j].accruedliabilities,
            OtherCurrentliabilities: actualsData[j].othercurrentliabilities,
            CashFlowFromOperatingActivites: actualsData[j].cfo,
            Totalexpenditure: actualsData[j].totalexpenditure,
            AssetSales: actualsData[j].assetsales,
            OtherInvestingActivites: actualsData[j].otherinvestingactivities,
            CashFlowFromInvesting: actualsData[j].cfi,
            DebtIssuedRetired: actualsData[j].debtissued,
            CommonStockIssuedRetired: actualsData[j].commonstockissued,
            Dividendspaid: actualsData[j].dividendspaid,
            CashFlowFromFinancingActivites: actualsData[j].cff,
            NetChangeinCash: actualsData[j].netchangeincash,
          });
        }
      } catch (error) {}

      try {
        const projectedData: any = await this.apiService
          .getData(
            this.urlConfig.getCashProjectionsAPIGET() +
              this.selectedCompany.compName +
              '&scenario=' +
              this.selectedScenario
          )
          .toPromise();
        for (let j = 0; j < projectedData.length; j++) {
          this.financialObjForCF.set(projectedData[j].asof, {
            Netincome: projectedData[j].netincome,
            DandA: projectedData[j].daa,
            FundsFromOperations: projectedData[j].fundsfromoperations,
            Accountreceivables: projectedData[j].accountreceivablesdelta,
            Inventories: projectedData[j].inventoriesdelta,
            OtherCurrentassets: projectedData[j].othercurrentassets,
            Accountspayable: projectedData[j].accountspayable,
            AccuredLiabilites: projectedData[j].accruedliabilities,
            OtherCurrentliabilities: projectedData[j].othercurrentliabilities,
            CashFlowFromOperatingActivites: projectedData[j].cfo,
            Totalexpenditure: projectedData[j].totalexpenditure,
            AssetSales: projectedData[j].assetsales,
            OtherInvestingActivites: projectedData[j].otherinvestingactivities,
            CashFlowFromInvesting: projectedData[j].cfi,
            DebtIssuedRetired: projectedData[j].debtissued,
            CommonStockIssuedRetired: projectedData[j].commonstockissued,
            Dividendspaid: projectedData[j].dividendspaid,
            CashFlowFromFinancingActivites: projectedData[j].cff,
            NetChangeinCash: projectedData[j].netchangeincash,
          });
        }
        this.financialObjForCF.forEach((v, k) => {
          var pushData = {
            inMillions: k,
            NetIncome:
              '$ ' + formatNumber(Number(v.Netincome), 'en-US', '1.0-0'),
            '(+) D&A': '$ ' + formatNumber(Number(v.DandA), 'en-US', '1.0-0'),
            'Funds from Operations':
              '$ ' +
              formatNumber(Number(v.FundsFromOperations), 'en-US', '1.0-0'),
            '(+/–) Δ in Accounts Receivable':
              '$ ' +
              formatNumber(Number(v.Accountreceivables), 'en-US', '1.0-0'),
            '(+/–) Δ in Inventories':
              '$ ' + formatNumber(Number(v.Inventories), 'en-US', '1.0-0'),
            '(+/–) Δ in Accounts Payable':
              '$ ' + formatNumber(Number(v.Accountspayable), 'en-US', '1.0-0'),
            '(+/–) Δ in Accrued Liabilities':
              '$ ' +
              formatNumber(Number(v.AccuredLiabilites), 'en-US', '1.0-0'),
            '(+/–) Δ in Other Current Liabilities':
              '$ ' +
              formatNumber(Number(v.OtherCurrentliabilities), 'en-US', '1.0-0'),
            'Cash Flow from Operating Activities (CFO)':
              '$ ' +
              formatNumber(
                Number(v.CashFlowFromOperatingActivites),
                'en-US',
                '1.0-0'
              ),
            '(–) Total Capital Expenditures':
              '$ ' + formatNumber(Number(v.Totalexpenditure), 'en-US', '1.0-0'),
            '(+) Asset Sales':
              '$ ' + formatNumber(Number(v.AssetSales), 'en-US', '1.0-0'),
            '(+/–) Δ in Other Current Assets':
              '$ ' +
              formatNumber(Number(v.OtherCurrentassets), 'en-US', '1.0-0'),
            '(+/–) Other Investing Activities':
              '$ ' +
              formatNumber(Number(v.OtherInvestingActivites), 'en-US', '1.0-0'),
            'Cash Flow from Investing Activities (CFI)':
              '$ ' +
              formatNumber(Number(v.CashFlowFromInvesting), 'en-US', '1.0-0'),
            '(+/–) Debt Issued (Retired)':
              '$ ' +
              formatNumber(Number(v.DebtIssuedRetired), 'en-US', '1.0-0'),
            '(+/–) Common Stock Issued (Retired)':
              '$ ' +
              formatNumber(
                Number(v.CommonStockIssuedRetired),
                'en-US',
                '1.0-0'
              ),
            '(–) Dividends Paid':
              '$ ' + formatNumber(Number(v.Dividendspaid), 'en-US', '1.0-0'),
            'Cash Flow from Financing Activities (CFF)':
              '$ ' +
              formatNumber(
                Number(v.CashFlowFromFinancingActivites),
                'en-US',
                '1.0-0'
              ),
            'Net Change in Cash':
              '$ ' + formatNumber(Number(v.NetChangeinCash), 'en-US', '1.0-0'),
          };
          ELEMENT_CF.push(pushData);
        });

        ELEMENT_CF_PDF = ELEMENT_CF;
      } catch (error) {
        console.log("EROOR", error)
      }

      const contentCF = this.exportToPDFCF();

      content.push(contentCF);
    }

    return content;
  }

  exportToFinalPDf(content, cover) {
    let docDefinition = {
      // footer: function(currentPage, pageCount) { return currentPage.toString() + ' of ' + pageCount; },

      // working 
      // pageSize: {
      //   width: 970,
      //   height: 975,
      // },

      pageSize: {
        width: 1050,
        height: 920,
      },

      background: function(currentPage, pageSize) {
        // return `page ${currentPage} with size ${pageSize.width} x ${pageSize.height}`
        console.log(currentPage);
        console.log(pageSize)

        return currentPage == 1 ? {
          image: cover,
          // fit: [1200, 400],
          absolutePosition: { x: 0, y: 0 },
          // width: 980,
          width: 920, //* 0.7487922705314,
          height: 1050,
          pageOrientation: "portrait",
          margin: [0, 0, 0, 0],
          // pageBreak: 'after',
        } : "";
      },
      // pageSize: 'A5',
      pageOrientation: 'portrait',
      pageMargins: [25, 60, 25, 40],
      content: content,
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [5, 5, 5, 5],
        },
        subheader: {
          fontSize: 12,
          bold: true,
          margin: [5, 5, 5, 5],
        }
      },
    };

    let currentDate = moment().format("ll")

    currentDate = currentDate.replace(",", "").trim();

    console.log(currentDate);

    pdfMake.createPdf(docDefinition).download("RMI_Insights_Report_ "+ currentDate +".pdf");

    setTimeout(() => {
      this.dialog.closeAll();
    }, 1500);
  }

  exportToPDFIS() {
    //let doc = new jsPDF('l','pt');
    let data = [];
    let inMillionsYear = [];
    let totalRevenue = [];
    let revenueGrowthRate = [];
    let COGS = [];
    let grossProfit = [];
    let grossMargin = [];
    let SGA = [];
    let EBIT = [];
    let EBITMargin = [];
    let DA = [];
    let EBITDA = [];
    let EBITDAMargin = [];
    let NIE = [];
    let EBT = [];
    let EBTMargin = [];
    let taxes = [];
    let netIncome = [];
    let netIncomeMargin = [];
    ELEMENT_PL_PDF.forEach((obj) => {
      inMillionsYear.push(obj['inMillions']);
      totalRevenue.push(obj['Total Revenue']);
      revenueGrowthRate.push(obj['Revenue Y-O-Y Growth rate']);
      COGS.push(obj['(-) Cost of Goods Sold (COGS)']);
      grossProfit.push(obj['Gross Profit']);
      grossMargin.push(obj['Gross Margin']);
      SGA.push(obj['(-) Selling, General & Administrative Expense (SG&A)']);
      EBIT.push(obj['EBIT']);
      EBITMargin.push(obj['EBIT Margin']);
      DA.push(obj['(+) Depreciation & Amortization (D&A)']);
      EBITDA.push(obj['EBITDA']);
      EBITDAMargin.push(obj['EBITDA Margin']);
      NIE.push(obj['(-) Net Interest/Other Income Expense']);
      EBT.push(obj['EBT']);
      EBTMargin.push(obj['EBT Margin']);
      taxes.push(obj['(-) Taxes']);
      netIncome.push(obj['Net Income']);
      netIncomeMargin.push(obj['Net Income Margin']);
    });
    inMillionsYear.unshift('Years');
    totalRevenue.unshift('Total Revenue');
    revenueGrowthRate.unshift('Revenue Y-O-Y Growth rate');
    COGS.unshift('(-) Cost of Goods Sold (COGS)');
    grossProfit.unshift('Gross Profit');
    grossMargin.unshift('Gross Margin');
    SGA.unshift('(-) Selling, General & Administrative Expense (SG&A)');
    EBIT.unshift('EBIT');
    EBITMargin.unshift('EBIT Margin');
    DA.unshift('(+) Depreciation & Amortization (D&A)');
    EBITDA.unshift('EBITDA');
    EBITDAMargin.unshift('EBITDA Margin');
    NIE.unshift('(-) Net Interest/Other Income Expense');
    EBT.unshift('EBT');
    EBTMargin.unshift('EBT Margin');
    taxes.unshift('(-) Taxes');
    netIncome.unshift('Net Income');
    netIncomeMargin.unshift('Net Income Margin');

    inMillionsYear = inMillionsYear.map((year, index) => {
      if (index == 0) {
        return {
          text: '(in millions)',
          italics: true,
          fillColor: '#164A5B',
          color: '#fff',
          margin: [0, 10, 0, 10],
        };
      } else {
        return {
          text: index<(inMillionsYear.length-5)?year+"A":year+"E",
          bold: true,
          fillColor: '#164A5B',
          color: '#fff',
          margin: [0, 10, 0, 10],
          border: [10, 10, 10, 10],
          alignment: 'right',
        };
      }
    });

    const mainHeader = inMillionsYear.map((year, index) => {
      if(index == 0){
        return {
          text: "Historical & Projected Income Statement",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeader = inMillionsYear.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const images = inMillionsYear.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == inMillionsYear.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })

    data.push(
      images,
      mainHeader,
      subHeader,
      inMillionsYear,
      this.getMappedArrForIS(totalRevenue, true),
      this.getMappedArrForIS(revenueGrowthRate, false, true, true),
      this.getMappedArrForIS(COGS),
      this.getMappedArrForIS(grossProfit, true),
      this.getMappedArrForIS(grossMargin, false, true),
      this.getMappedArrForIS(SGA),
      this.getMappedArrForIS(EBIT, true),
      this.getMappedArrForIS(EBITMargin, false, true),
      this.getMappedArrForIS(DA),
      this.getMappedArrForIS(EBITDA, true),
      this.getMappedArrForIS(EBITDAMargin, false, true),
      this.getMappedArrForIS(NIE),
      this.getMappedArrForIS(EBT, true),
      this.getMappedArrForIS(EBTMargin, false, true),
      this.getMappedArrForIS(taxes),
      this.getMappedArrForIS(netIncome, true),
      this.getMappedArrForIS(netIncomeMargin, false, true)
    );
    console.log('data', data);

    const content = [
      
      // { image: this.imagermi, width: 130, height: 90 },
      // {
      //   text: "Historical & Projected Income Statement",
      //   style: 'header',
      // },
      // {
      //   text:
      //     this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
      //     style: 'subheader',
      //     // margin: [10, 20, 0, 20],

      // },
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',

        table: {
          headerRows: 1,
          heights: 20,
          //width:'auto',
          // widths: [250, 75, 75, 75, 75, 75, 75, 75, 75],
          widths: [235, 70, 70, 70, 70, 70, 70, 70, 70],

          body: data,
        },
        layout: this.getLayoutForTable(),

        pageBreak: "after"
      },
    ];

    return content;
  }

  exportToPDFBS() {
    // let doc = new jsPDF('l','pt');
    let data = [];
    let inMillionsYear = [];
    let cashEquivalents = [];
    let accountsReceivable = [];
    let inventories = [];
    let prepaidExpensesOtherCurrentAssets = [];
    let totalCurrentAssets = [];
    let ppe = [];
    let intangibleAssets = [];
    let goodwill = [];
    let otherAssets = [];
    let totalAssets = [];
    let currentPortionLongTermDebt = [];
    let accountsPayable = [];
    let accruedLiabilities = [];
    let otherCurrentLiabilities = [];
    let totalCurrentLiabilities = [];
    let longTermDebt = [];
    let otherLiabilities = [];
    let totalShareholdersEquity = [];
    let totalLiabilitiesShareholdersEquity = [];
   // let memocheck = [];
    ELEMENT_BS_PDF.forEach((obj) => {
      inMillionsYear.push(obj['inMillions']);
      cashEquivalents.push(obj['Cash Equivalents']);
      accountsReceivable.push(obj['Accounts Receivable']);
      inventories.push(obj['Inventories']);
      prepaidExpensesOtherCurrentAssets.push(
        obj['Prepaid Expenses & Other Current Assets']
      );
      totalCurrentAssets.push(obj['Total Current Assets']);
      ppe.push(obj['Property Plant & Equipment']);
      intangibleAssets.push(obj['Intangible Assets']);
      goodwill.push(obj['Goodwill']);
      otherAssets.push(obj['Other Assets']);
      totalAssets.push(obj['Total Assets']);
      currentPortionLongTermDebt.push(obj['Current Portion Long Term Debt']);
      accountsPayable.push(obj['Accounts Payable']);
      accruedLiabilities.push(obj['Accrued Liabilities']);
      otherCurrentLiabilities.push(obj['Other Current Liabilities']);
      totalCurrentLiabilities.push(obj['Total Current Liabilities']);
      longTermDebt.push(obj['Long Term Debt']);
      otherLiabilities.push(obj['Other Liabilities']);
      totalShareholdersEquity.push(obj['Total Shareholders Equity']);
      totalLiabilitiesShareholdersEquity.push(
        obj['Total Liabilities and Shareholders Equity']
      );
      //memocheck.push(obj['Memo Check']);
    });
    inMillionsYear.unshift('Years');
    cashEquivalents.unshift('Cash Equivalents');
    accountsReceivable.unshift('Accounts Receivable');
    inventories.unshift('Inventories');
    prepaidExpensesOtherCurrentAssets.unshift(
      'Prepaid Expenses & Other Current Assets'
    );
    totalCurrentAssets.unshift('Total Current Assets');
    ppe.unshift('Property Plant & Equipment');
    intangibleAssets.unshift('Intangible Assets');
    goodwill.unshift('Goodwill');
    otherAssets.unshift('Other Assets');
    totalAssets.unshift('Total Assets');
    currentPortionLongTermDebt.unshift('Current Portion Long Term Debt');
    accountsPayable.unshift('Accounts Payable');
    accruedLiabilities.unshift('Accrued Liabilities');
    otherCurrentLiabilities.unshift('Other Current Liabilities');
    totalCurrentLiabilities.unshift('Total Current Liabilities');
    longTermDebt.unshift('Long Term Debt');
    otherLiabilities.unshift('Other Liabilities');
    totalShareholdersEquity.unshift('Total Shareholders Equity');
    totalLiabilitiesShareholdersEquity.unshift(
      'Total Liabilities and Shareholders Equity'
    );
    //memocheck.unshift('memocheck');

    inMillionsYear = inMillionsYear.map((year, index) => {
      if (index == 0) {
        return {
          text: '(in millions)',
          italics: true,
          fillColor: '#164A5B',
          color: '#fff',
          margin: [0, 10, 0, 10],
        };
      } else {
        return {
          text: index<(inMillionsYear.length-5)?year+"A":year+"E",
          bold: true,
          fillColor: '#164A5B',
          color: '#fff',
          margin: [0, 10, 0, 10],
          border: [10, 10, 10, 10],
          alignment: 'right',
        };
      }
    });

    const mainHeader = inMillionsYear.map((year, index) => {
      if(index == 0){
        return {
          text: "Historical & Projected Balance Sheet",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeader = inMillionsYear.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const images = inMillionsYear.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == inMillionsYear.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })


    data.push(
      images,
      mainHeader,
      subHeader,
      inMillionsYear,
      this.getMappedArrForBS(cashEquivalents),
      this.getMappedArrForBS(accountsReceivable),
      this.getMappedArrForBS(inventories),
      this.getMappedArrForBS(prepaidExpensesOtherCurrentAssets),
      this.getMappedArrForBS(totalCurrentAssets, true),
      this.getMappedArrForBS(ppe),
      this.getMappedArrForBS(intangibleAssets),
      this.getMappedArrForBS(goodwill),
      this.getMappedArrForBS(otherAssets),
      this.getMappedArrForBS(totalAssets, true),
      this.getMappedArrForBS(currentPortionLongTermDebt),
      this.getMappedArrForBS(accountsPayable),
      this.getMappedArrForBS(accruedLiabilities),
      this.getMappedArrForBS(otherCurrentLiabilities),
      this.getMappedArrForBS(totalCurrentLiabilities, true),
      this.getMappedArrForBS(longTermDebt, otherLiabilities),
      this.getMappedArrForBS(totalShareholdersEquity),
      this.getMappedArrForBS(totalLiabilitiesShareholdersEquity, true),
      //this.getMappedArrForBS(memocheck, true)
    );

    const content = [
      // {image:imagermi,width:150,height:75},
      // { image: this.imagermi, width: 130, height: 90 },

      // {
      //   text: "Historical & Projected Balance Sheet",
      //   style: 'header',
      // },
      // {
      //   text:
      //     this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
      //   style: 'subheader',
      // },
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',

        table: {
          headerRows: 1,
          heights: 20,
          //width:'auto',
          // widths: [250, 85, 85, 85, 85, 85, 85, 85],
          widths: [230, 82, 82, 82, 82, 82, 82, 82],
          
          body: data,
        },
        layout: this.getLayoutForTable(),

         pageBreak: "after"

      },
    ];

    return content;
  }

  exportToPDFCF() {
    //let doc = new jsPDF('l','pt');
    let data = [];
    let inMillionsYear = [];
    let netIncome = [];
    let DA = [];
    let fundsfromOperations = [];
    let accountsReceviable = [];
    let inventories = [];
    let otherCurrentAssests = [];
    let accountPayable = [];
    let accruedLiablities = [];
    let otherCurrentLiabilites = [];
    let CFO = [];
    let totalCapitalExpenditures = [];
    let assestSales = [];
    let otherInvestingActivites = [];
    let CFI = [];
    let debtIssued = [];
    let commonStockIssued = [];
    let dividendsPaid = [];
    let CFF = [];
    let netChangeInCash = [];
    ELEMENT_CF_PDF.forEach((obj) => {
      inMillionsYear.push(obj['inMillions']);
      netIncome.push(obj['NetIncome']);
      DA.push(obj['(+) D&A']);
      fundsfromOperations.push(obj['Funds from Operations']);
      accountsReceviable.push(obj['(+/–) Δ in Accounts Receivable']);
      inventories.push(obj['(+/–) Δ in Inventories']);
      otherCurrentAssests.push(obj['(+/–) Δ in Other Current Assets']);
      accountPayable.push(obj['(+/–) Δ in Accounts Payable']);
      accruedLiablities.push(obj['(+/–) Δ in Accrued Liabilities']);
      otherCurrentLiabilites.push(obj['(+/–) Δ in Other Current Liabilities']);
      CFO.push(obj['Cash Flow from Operating Activities (CFO)']);
      totalCapitalExpenditures.push(obj['(–) Total Capital Expenditures']);
      assestSales.push(obj['(+) Asset Sales']);
      otherInvestingActivites.push(obj['(+/–) Other Investing Activities']);
      CFI.push(obj['Cash Flow from Investing Activities (CFI)']);
      debtIssued.push(obj['(+/–) Debt Issued (Retired)']);
      commonStockIssued.push(obj['(+/–) Common Stock Issued (Retired)']);
      dividendsPaid.push(obj['(–) Dividends Paid']);
      CFF.push(obj['Cash Flow from Financing Activities (CFF)']);
      netChangeInCash.push(obj['Net Change in Cash']);
    });
    inMillionsYear.unshift('Years');
    netIncome.unshift('NetIncome');
    DA.unshift('(+) D&A');
    fundsfromOperations.unshift('Funds from Operations');
    accountsReceviable.unshift('(+/–) Δ in Accounts Receivable');
    inventories.unshift('(+/–) Δ in Inventories');
    otherCurrentAssests.unshift('(+/–) Δ in Other Current Assets');
    accountPayable.unshift('(+/–) Δ in Accounts Payable');
    accruedLiablities.unshift('(+/–) Δ in Accrued Liabilities');
    otherCurrentLiabilites.unshift('(+/–) Δ in Other Current Liabilities');
    CFO.unshift('Cash Flow from Operating Activities (CFO)');
    totalCapitalExpenditures.unshift('(–) Total Capital Expenditures');
    assestSales.unshift('(+) Asset Sales');
    otherInvestingActivites.unshift('(+/–) Other Investing Activities');
    CFI.unshift('Cash Flow from Investing Activities (CFI)');
    debtIssued.unshift('(+/–) Debt Issued (Retired)');
    commonStockIssued.unshift('(+/–) Common Stock Issued (Retired)');
    dividendsPaid.unshift('(–) Dividends Paid');
    CFF.unshift('Cash Flow from Financing Activities (CFF)');
    netChangeInCash.unshift('Net Change in Cash');

    inMillionsYear = inMillionsYear.map((year, index) => {
      if (index == 0) {
        return {
          text: '(in millions)',
          italics: true,
          fillColor: '#164A5B',
          color: '#fff',
          margin: [0, 10, 0, 10],
        };
      } else {
        return {
          text: index<(inMillionsYear.length-5)?year+"A":year+"E",
          bold: true,
          fillColor: '#164A5B',
          color: '#fff',
          margin: [0, 10, 0, 10],
          border: [10, 10, 10, 10],
          alignment: 'right',
        };
      }
    });

    const mainHeader = inMillionsYear.map((year, index) => {
      if(index == 0){
        return {
          text: "Historical & Projected Cash Flow Statement",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeader = inMillionsYear.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const images = inMillionsYear.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == inMillionsYear.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })


    data.push(
      images,
      mainHeader,
      subHeader,
      inMillionsYear,
      this.getMappedArrForCF(netIncome),
      this.getMappedArrForCF(DA),
      this.getMappedArrForCF(fundsfromOperations, true),
      this.getMappedArrForCF(accountsReceviable),
      this.getMappedArrForCF(inventories),
      this.getMappedArrForCF(otherCurrentAssests),
      this.getMappedArrForCF(accountPayable),
      this.getMappedArrForCF(accruedLiablities),
      this.getMappedArrForCF(otherCurrentLiabilites),
      this.getMappedArrForCF(CFO, true),
      this.getMappedArrForCF(totalCapitalExpenditures),
      this.getMappedArrForCF(assestSales),
      this.getMappedArrForCF(otherInvestingActivites),
      this.getMappedArrForCF(CFI, true),
      this.getMappedArrForCF(debtIssued),
      this.getMappedArrForCF(commonStockIssued),
      this.getMappedArrForCF(dividendsPaid),
      this.getMappedArrForCF(CFF, true),
      this.getMappedArrForCF(netChangeInCash, true)
    );

    console.log(data);
    console.log(inMillionsYear);

    const content = [
      // { image: this.imagermi, width: 130, height: 90 },

      // {
      //   text: "Historical & Projected Cash Flow Statement",
      //   style: 'header',
      // },
      // {
      //   text:
      //     this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
      //   style: 'subheader',
      // },
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',

        table: {
          headerRows: 1,
          heights: 20,
          //width:'auto',
          // widths: [250, 85, 85, 85, 85, 85, 85, 85],
          widths: [230, 82, 82, 82, 82, 82, 82, 82],
          body: data,
        },
        layout: this.getLayoutForTable(),

         pageBreak: "after"

      },
    ];

    return content
  }

  exportToPDFKPIIS() {
    //let doc = new jsPDF('l','pt');
    // let data = [];

    let dataForActuals = [];
    let dataForProj = [];

    let headersAct = [];
    let headersProj = [];
    

    const actualsAndProjValues = this.ELEMENT_KPI_ACTUALS_IS.concat(
      this.ELEMENT_KPI_PROJECTIONS_IS
    );

    headersAct = ['No', '	Income Statement (P&L)', 'From', 'To', 'KPI'];
    headersProj = ['No', '	Income Statement (P&L)', 'From', 'To', 'KPI'];

    const mainHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text: "KPI Income Statement",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subSubHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text: 'Historical Key Metrics',
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })


    const mainHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text: "KPI Income Statement",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subSubHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text: 'Projected Key Metrics',
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })


    const images = headersAct.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == headersAct.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })

    headersAct = headersAct.map( (name, index) => {
      if(index == 0){
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    headersProj = headersProj.map( (name, index) => {
      if(index == 0){
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })


    const keys = Object.keys(this.ELEMENT_KPI_ACTUALS_IS[0]);

    let actualsData = []
    this.ELEMENT_KPI_ACTUALS_IS.forEach((obj) => {
      const values = []
      keys.forEach( key => {
        values.push(obj[key]);
      })
      actualsData.push(this.getMappedArrForKPIIS(values))
    });

    let projData = []
    this.ELEMENT_KPI_PROJECTIONS_IS.forEach((obj) => {
      const values = []
      keys.forEach( key => {
        values.push(obj[key]);
      })
      projData.push(this.getMappedArrForKPIIS(values))
    });

    const masterHeaderAct = [];
    const masterHeaderProj = [];

    masterHeaderAct.push(headersAct);
    masterHeaderProj.push(headersProj);

    dataForActuals = [images].concat([mainHeaderACT]).concat([subSubHeaderACT]).concat([subHeaderACT]).concat(masterHeaderAct) .concat(actualsData);
    dataForProj = [images].concat([mainHeaderPROJ]).concat([subSubHeaderPROJ]).concat([subHeaderPROJ]).concat(masterHeaderProj).concat(projData);

    console.log("dataForActuals", dataForActuals);
    console.log("dataForProj", dataForProj);

    const content = [
      // { image: this.imagermi, width: 130, height: 90 },

      // // { image: imagermi, width: 150, height: 75 },
      // // { image: imagermi, width: 150, height: 75 },
      // {
      //   text: "KPI Income Statement",
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - " + "Scenario " + this.selectedScenario,
      //   style: 'subheader',
      // },
      // {
      //   text: 'Historical Key Metrics',
      //   style: 'subheader',
      // },
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',
        // style: 'tableExample',
        table: {
          headerRows: 1,
          heights: 20,
          // width:'auto',
          widths: this.getWidthsForKPI(),
          body: dataForActuals
        },
        layout: this.getLayoutForTable(3),

        pageBreak: "after"

      },

      // { image: this.imagermi, width: 130, height: 90 },

      // // { image: imagermi, width: 150, height: 75 },
      // // { image: imagermi, width: 150, height: 75 },
      // {
      //   text: "KPI Income Statement",
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - " + "Scenario " + this.selectedScenario,
      //   style: 'subheader',
      // },
      // {
      //   text: 'Projected Key Metrics',
      //   style: 'subheader',
      // },
      {
        // style: 'tableExample',
        table: {
          headerRows: 1,
          heights: 20,
          // width:'auto',
          widths: this.getWidthsForKPI(),
          body: dataForProj,
        },
        layout: this.getLayoutForTable(3),

         pageBreak: "after"

      }
    ]

    return content;
  }

  exportToPDFKPIBS() {
    //let doc = new jsPDF('l','pt');
    // let data = [];

    let dataForActuals = [];
    let dataForProj = [];

    let headersAct = [];
    let headersProj = [];
    
    console.log('ACTUALS', this.ELEMENT_KPI_ACTUALS_BS);
    console.log('ACTUALS', this.ELEMENT_KPI_PROJECTIONS_BS);

    const actualsAndProjValues = this.ELEMENT_KPI_ACTUALS_BS.concat(
      this.ELEMENT_KPI_PROJECTIONS_BS
    );

    headersAct = ['No', '	Balance Sheet', 'From', 'To', 'KPI'];
    headersProj = ['No', '	Balance Sheet', 'From', 'To', 'KPI'];

    const mainHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text: "KPI Balance Sheet",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subSubHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text: 'Historical Key Metrics',
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })


    const mainHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text: "KPI Balance Sheet",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subSubHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text: 'Projected Key Metrics',
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })


    const images = headersAct.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == headersAct.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })


    headersAct = headersAct.map( (name, index) => {
      if(index == 0){
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    headersProj = headersProj.map( (name, index) => {
      if(index == 0){
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    const keys = Object.keys(this.ELEMENT_KPI_ACTUALS_BS[0]);

    let actualsData = []
    this.ELEMENT_KPI_ACTUALS_BS.forEach((obj) => {
      const values = []
      keys.forEach( key => {
        values.push(obj[key]);
      })
      actualsData.push(this.getMappedArrForKPIBS(values))
    });

    let projData = []
    this.ELEMENT_KPI_PROJECTIONS_BS.forEach((obj) => {
      const values = []
      keys.forEach( key => {
        values.push(obj[key]);
      })
      projData.push(this.getMappedArrForKPIBS(values))
    });

    const masterHeaderAct = [];
    const masterHeaderProj = [];

    masterHeaderAct.push(headersAct);
    masterHeaderProj.push(headersProj);

    dataForActuals = [images].concat([mainHeaderACT]).concat([subSubHeaderACT]).concat([subHeaderACT]).concat(masterHeaderAct) .concat(actualsData);
    dataForProj = [images].concat([mainHeaderPROJ]).concat([subSubHeaderPROJ]).concat([subHeaderPROJ]).concat(masterHeaderProj).concat(projData);


    console.log("dataForActuals", dataForActuals);
    console.log("dataForProj", dataForProj);

    const content = [
      // { image: imagermi, width: 150, height: 75 },
      // { image: imagermi, width: 150, height: 75 },
      // { image: this.imagermi, width: 130, height: 90 },

      // {
      //   text: "KPI Balance Sheet",
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - " + "Scenario " + this.selectedScenario,
      //   style: 'subheader',
      // },
      
      // {
      //   text: 'Historical Key Metrics',
      //   style: 'subheader',
      // },
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',
        // style: 'tableExample',
        table: {
          headerRows: 1,
          heights: 20,
          // width:'auto',
          widths: this.getWidthsForKPI(),
          body: dataForActuals
        },
        layout: this.getLayoutForTable(3),

        pageBreak: "after"

      },

      // { image: this.imagermi, width: 130, height: 90 },

      // {
      //   text: "KPI Balance Sheet",
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - " + "Scenario " + this.selectedScenario,
      //   style: 'subheader',
      // },

      // {
      //   text: 'Projected Key Metrics',
      //   style: 'subheader',
      // },
      {
        // style: 'tableExample',
        table: {
          headerRows: 1,
          heights: 20,
          // width:'auto',
          widths: this.getWidthsForKPI(),
          body: dataForProj,
        },
        layout: this.getLayoutForTable(3),
         pageBreak: "after"
      }
    ]

    return content;
  }

  exportToPDFKPICF() {
    //let doc = new jsPDF('l','pt');
    // let data = [];

    let dataForActuals = [];
    let dataForProj = [];

    let headersAct = [];
    let headersProj = [];
    
    console.log('ACTUALS', this.ELEMENT_KPI_ACTUALS_CF);
    console.log('ACTUALS', this.ELEMENT_KPI_PROJECTIONS_CF);

    const actualsAndProjValues = this.ELEMENT_KPI_ACTUALS_CF.concat(
      this.ELEMENT_KPI_PROJECTIONS_CF
    );

    headersAct = ['No', '	Cash Flow Statement', 'From', 'To', 'KPI'];
    headersProj = ['No', '	Cash Flow Statement ', 'From', 'To', 'KPI'];

    const mainHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text: "KPI Cash Flow Statement",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subSubHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text: 'Historical Key Metrics',
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeaderACT = headersAct.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })


    const mainHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text: "KPI Cash Flow Statement",
          style: 'header',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subSubHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text: 'Projected Key Metrics',
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })

    const subHeaderPROJ = headersProj.map((year, index) => {
      if(index == 0){
        return {
          text:
          this.selectedCompany.compName + " - " + "Scenario "  + this.selectedScenario,
          style: 'subheader',
          alignment: 'left',
          colSpan: 3
        }
      }
      else{
        return {}
      }
    })


    const images = headersAct.map((year, index) => {
      if(index == 0){
        return this.getRMILogo()
      }
      else if(index == headersAct.length - 2 && this.organizationLogo){
        return this.getOrganizationalLogo()
      }
      else{
        return {
          // text: index,
          // style: 'subheader',
          // alignment: 'left',
        }
      }
    })


    headersAct = headersAct.map( (name, index) => {
      if(index == 0){
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    headersProj = headersProj.map( (name, index) => {
      if(index == 0){
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left"}
      }
    })

    const keys = Object.keys(this.ELEMENT_KPI_ACTUALS_CF[0]);

    let actualsData = []
    this.ELEMENT_KPI_ACTUALS_CF.forEach((obj) => {
      const values = []
      keys.forEach( key => {
        values.push(obj[key]);
      })
      actualsData.push(this.getMappedArrForKPICF(values))
    });

    let projData = []
    this.ELEMENT_KPI_PROJECTIONS_CF.forEach((obj) => {
      const values = []
      keys.forEach( key => {
        values.push(obj[key]);
      })
      projData.push(this.getMappedArrForKPICF(values))
    });

    const masterHeaderAct = [];
    const masterHeaderProj = [];

    masterHeaderAct.push(headersAct);
    masterHeaderProj.push(headersProj);

    dataForActuals = [images].concat([mainHeaderACT]).concat([subSubHeaderACT]).concat([subHeaderACT]).concat(masterHeaderAct) .concat(actualsData);
    dataForProj = [images].concat([mainHeaderPROJ]).concat([subSubHeaderPROJ]).concat([subHeaderPROJ]).concat(masterHeaderProj).concat(projData);

    console.log("dataForActuals", dataForActuals);
    console.log("dataForProj", dataForProj);

    const content = [
      // { image: imagermi, width: 150, height: 75 },
      // { image: imagermi, width: 150, height: 75 },
      // { image: this.imagermi, width: 130, height: 90 },

      // {
      //   text: "KPI Cash Flow Statement",
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - " + "Scenario "+ this.selectedScenario,
      //   style: 'subheader',
      // },
      // {
      //   text: 'Historical Key Metrics',
      //   style: 'subheader',
      // },
      {
        //style: 'tableExample',
        // layout: 'lightHorizontalLines',
        // style: 'tableExample',
        table: {
          headerRows: 1,
          heights: 20,
          // width:'auto',
          widths: this.getWidthsForKPI(),
          body: dataForActuals
        },
        layout: this.getLayoutForTable(3),

        pageBreak: "after"

      },
      // { image: this.imagermi, width: 130, height: 90 },

      // {
      //   text: "KPI Cash Flow Statement",
      //   style: 'header',
      // },
      // {
      //   text: this.selectedCompany.compName + " - " + "Scenario "+ this.selectedScenario,
      //   style: 'subheader',
      // },

      // {
      //   text: 'Projected Key Metrics',
      //   style: 'subheader',
      // },
      {
        // style: 'tableExample',
        
        table: {
          headerRows: 1,
          heights: 20,
          // width:'auto',
          widths: this.getWidthsForKPI(),
          body: dataForProj,
        },
        layout: this.getLayoutForTable(3),

         pageBreak: "after"
      }
    ]

    return content;
  }

  exportPDFForScoreCard(scoreCardData, actuals, sumProduct){
    let headers : any = ["Name", "Actuals", "1.0", "2.0", "3.0", "4.0", "5.0", "Factor Score", "Factor Weight"]
    headers = headers.map( (name, index) => {
      if(index == 0){
        return {text: name, bold: true, fillColor: '#164A5B', color: "#164A5B", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "center"}
      }
      else{
        return {text: name, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "center"}
      }
    })

    const tableRows = [];

    tableRows.push(headers)

    let row = ["I) Historical Revenue CAGR (Last Three Years)", +actuals.revenuecagr.toFixed(1), "< 0.0%", '0.0% - 2.5%', "2.5% - 5.0%", "5.0% - 10.0%", '> 10.0%', +scoreCardData.ebitdacagr.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "%"))

    row = ["II) Historical Gross Margins (Avg. of last 3 years)", +actuals.avggrossmargin.toFixed(1), "0.0% - 10.0%", '10.0% - 20.0%', "20.0% - 30.0%", "30.0% - 40.0%", '> 40.0%', +scoreCardData.avggrossmargin.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "%"))

    row = ["III) Historical EBITDA Margins (Avg. of last 3 years)", +actuals.avgebitdamargin.toFixed(1), "< 5.0%", '5.0% - 10.0%', "10.0% - 15.0%", "15.0% - 20.0%", '> 20.0%', +scoreCardData.avgebitdamargin.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "%"))

    row = ["IV) Historical EBITDA CAGR (Last 3 years)	", +actuals.ebitdacagr.toFixed(1), "< 0.0%", '0.0% - 2.5%', "2.5% - 5.0%", "5.0% - 10.0%", '> 10.0%', +scoreCardData.ebitdacagr.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "%"))

    row = ["V) Total Debt-to-EBITDA (Last historical year)", +actuals.totaldebtebitda.toFixed(1), "< 5.0x", '4.0x - 5.0x', "3.0x - 4.0x", "2.0x - 3.0x", '< 2.0x', +scoreCardData.totaldebtebitda.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "x"))

    row = ["VI) Current Ratio (Last historical year)", +actuals.currentratio.toFixed(1), "< 0.5x", '0.5x - 1.0x', "1.0x - 1.5x", "1.5x - 2.0x", '> 2.0x', +scoreCardData.currentratio.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "x"))

    row = ["VI) Current Ratio (Last historical year)", +actuals.currentratio.toFixed(1), "< 0.5x", '0.5x - 1.0x', "1.0x - 1.5x", "1.5x - 2.0x", '> 2.0x', +scoreCardData.currentratio.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "x"))

    row = ["VII) Capex as % of Revenue (Avg. of last 2 years)", +actuals.capexpercent.toFixed(1), "> 20.0%", '15.0% - 20.0%', "10.0% - 15.0%", "5.0% - 10.0%", '< 5.0%', +scoreCardData.capexpercent.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "%"))

    row = ["VIII) Return on Assets (Last historical year)", +actuals.returnassets.toFixed(1), "< 2.0%", '2.0% - 4.0%', "4.0% - 6.0%", "6.0% - 8.0%", '> 8.0%', +scoreCardData.returnassets.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "%"))

    row = ["IX) Return on Equity (Last historical year)", +actuals.returnequity.toFixed(1), "< 5.0%", '5.0% - 10.0%', "10.0% - 15.0%", "15.0% - 20.0%", '> 20.0%', +scoreCardData.returnequity.toFixed(1), +scoreCardData.factorweight.toFixed(1)]
    tableRows.push(this.getMappedArrForScoreCard(row, "%"))


    row = ["X) Solvency Ratio (Avg. of last 2 years)", +actuals.solvencyratio.toFixed(1), "< 5.0%", '5.0% - 10.0%', "10.0% - 15.0%", "15.0% - 20.0%", '> 20.0%', +scoreCardData.solvencyratio.toFixed(1), +scoreCardData.factorweight.toFixed(1) ]
    tableRows.push(this.getMappedArrForScoreCard(row, "%"))

    row = ['RMI Insights Proprietary Overall Financial Health Score', "a", "b", "c", "d","d", "d", sumProduct.toFixed(1), (scoreCardData.factorweight * 10) + " %"]

    let footer = row.map( (name, index) => {
      if(index == 0){
        return {text: name, bold: true, fillColor: '#add8e6', color: "#000", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "left", colSpan: 3}
      }
      else if(index > 0 && index < 7){
        return {text: name, bold: true, fillColor: '#add8e6', color: "#add8e6", margin: [0, 10, 0, 10], border: [10, 10, 10, 10], alignment: "center"}
      }
      else{
        return {text: name, bold: true, fillColor: '#add8e6', color: "#000", margin: [10, 10, 0, 10], border: [10, 10, 10, 10], alignment: "center",}
      }
    })

    tableRows.push(footer)

    const content = [
      // { image: imagermi, width: 150, height: 75 },
      // { image: imagermi, width: 150, height: 75 },
      { image: this.imagermi, width: 130, height: 90 },

      {
        text: "Financial Health Scorecard",
        style: 'header',
      },
      {
        text: this.selectedCompany.compName,
        style: 'subheader',
      },
      {
        // style: 'tableExample',
        table: {
          headerRows: 1,
          heights: 20,
          // width:'auto',
          widths: [250, 49, 79, 79, 79, 79, 79, 49, 49],
          body: tableRows,
        },
        layout: {
          //set custom borders size and color
          hLineWidth: function (i, node) {
            return i === 0 || i === node.table.body.length ? 0.5 : 0.5;
          },
          vLineWidth: function (i, node) {
            return 0;
          },
          hLineColor: function (i, node) {
            return i === 0 || i === node.table.body.length ? 'black' : 'gray';
          },
          // vLineColor: function (i, node) {
          //   return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
          // }
        },

         pageBreak: "after"
      }
    ]

    return content;
  }

  getMappedArr(inputArr) {
    const arr = inputArr.map((value:any, index) => {
      if(index == 0){
        return  {
          text: value,
          margin: [0, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(index == inputArr.length - 1 || index == inputArr.length - 2){
        
        if(value < 0){
          value = value * -1;
          value = '(' +  value.toFixed(1) + "%" + ")"
        }
        else{
          value = value.toFixed(1) + "%"
        }

        return  {
          text:  value,
          margin: [10, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else{

        if(value < 0){
          value = value * -1;
          value = '(' +  value.toFixed(1) + "%" + ")"
        }
        else{
          value = value.toFixed(1) + "%"
        }


        return  {
          text: value,
          margin: [0, 10, 0, 10],
          alignment: 'left',
          bold: false,
        };
      }
    });

    return arr;
  }



getMappedArrS(inputArr,rowIndex) {
    const arr = inputArr.map((value:any, index) => {
      if(index == 0){
        return  {
          text: value,
          margin: [0, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(index == inputArr.length - 1 || index == inputArr.length - 2){
        
        if(value < 0){
          value = value * -1;
          value = rowIndex >= 4 ? '(' +  value.toFixed(1) + "x" + ")" : '(' +  value.toFixed(1) + "%" + ")"
        }
        else{
          value = rowIndex >= 4 ?  value.toFixed(1) + "x" :  value.toFixed(1) + "%"
        }

        return  {
          text:  value,
          margin: [10, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else{

        if(value < 0){
          value = value * -1;
          value = rowIndex >= 4 ? '(' +  value.toFixed(1) + "x" + ")" : '(' +  value.toFixed(1) + "%" + ")"
        }
        else{
           value = rowIndex >= 4 ?  value.toFixed(1) + "x" :  value.toFixed(1) + "%"
        }


        return  {
          text: value,
          margin: [0, 10, 0, 10],
          alignment: 'left',
          bold: false,
        };
      }
    });

    return arr;
  }






  getMappedArrForScoreCard(row, suffix){
    let score = 0;
    const arr = row.map( (r, i) => {
      if(i == 0){
        return  {
          text: r,
          margin: [0, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(i == 1){
        return  {
          text: r + suffix,
          margin: [0, 10, 0, 10],          
          alignment: 'center',
        };
      }
      else if(i >=2 && i<=6){
        score++;
        return  {
          text: r,
          margin: [0, 10, 0, 10],          
          alignment: 'center',
          bold: this.isInSegment(score, row[7]),
          fillColor: this.isInSegment(score, row[7]) ? "#add8e6" : "#fff"
        };
      }
      else if(i == 8){
        return  {
          text: r + "%",
          margin: [0, 10, 0, 10],          
          alignment: 'center',
        };
      }
      else{
        return  {
          text: r ,
          margin: [0, 10, 0, 10],          
          alignment: 'center',
        };
      }
    })

    return arr;
  }

  isInSegment(lowValue: Number, actualValue: Number) {
    return actualValue == lowValue ? true : false;
  } 

  getMappedArrForKPICF(inputArr) {
    const arr = inputArr.map((value:any, index) => {
      if(index == 1){
        return  {
          text: value,
          margin: [0, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(index == 0){
        return  {
          text: value,
          margin: [10, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(index == inputArr.length - 1){
        return  {
          text: (value+"").indexOf(".") >= 0? value+"%" : value+".0%",
          margin: [0, 10, 0, 10],
          alignment: 'left',
          color: value > 0 ? '#006400' : '#FF0000',
          bold: true,
        };
      }
      else{
        return  {
          text: value,
          margin: [0, 10, 0, 10],
          alignment: 'left',
          bold: false,
        };
      }
    });

    return arr;
  }

  getMappedArrForKPIBS(inputArr) {
    const arr = inputArr.map((value:any, index) => {
      if(index == 1){
        return  {
          text: value,
          margin: [0, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(index == 0){
        return  {
          text: value,
          margin: [10, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(index == inputArr.length - 1){
        return  {
          text: (value+"").indexOf(".") >= 0? value+"%" : value+".0%",
          margin: [0, 10, 0, 10],
          alignment: 'left',
          color: value > 0 ? '#006400' : '#FF0000',
          bold: true,
        };
      }
      else{
        return  {
          text: value,
          margin: [0, 10, 0, 10],
          alignment: 'left',
          bold: false,
        };
      }
    });

    return arr;
  }

  getMappedArrForKPIIS(inputArr, isfundsfromOperations?) {
    const arr = inputArr.map((value:any, index) => {
      if(index == 1){
        return  {
          text: value,
          margin: [0, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(index == 0){
        return  {
          text: value,
          margin: [10, 10, 0, 10],          
          alignment: 'left',
          bold: true,
        };
      }
      else if(index == inputArr.length - 1){
        return  {
          text: (value+"").indexOf(".") >= 0? value+"%" : value+".0%",
          margin: [0, 10, 0, 10],
          alignment: 'left',
          color: value > 0 ? '#006400' : '#FF0000',
          bold: true,
        };
      }
      else{
        return  {
          text: value,
          margin: [0, 10, 0, 10],
          alignment: 'left',
          bold: false,
        };
      }
      
    });

    return arr;
  }

  getMappedArrForCF(inputArr, isfundsfromOperations?) {
    const arr = inputArr.map((year, index) => {
      if (index == 0) {
        if (isfundsfromOperations) {
          return {
            text: year,
            margin: [0, 10, 0, 10],
            alignment: 'left',
            bold: true,
          };
        } else {
          return { text: year, margin: [0, 10, 0, 10] };
        }
      } else {
        if (isfundsfromOperations) {
          return {
            text:
              year.indexOf('-') >= 0
                ? '(' + year.replace('-', '') + ')'
                : year,
            margin: [0, 10, 0, 10],
            alignment: 'right',
            bold: true,
          };
        } else {
          return {
            text:
              year.indexOf('-') >= 0
                ? '(' + year.replace('-', '') + ')'
                : year,
            margin: [0, 10, 0, 10],
            alignment: 'right',
          };
        }
      }
    });

    return arr;
  }

  getMappedArrForBS(inputArr, isfundsfromOperations?) {
    const arr = inputArr.map((year, index) => {
      if (index == 0) {
        if (isfundsfromOperations) {
          return {
            text: year,
            margin: [0, 10, 0, 10],
            alignment: 'left',
            bold: true,
          };
        } else {
          return { text: year, margin: [0, 10, 0, 10] };
        }
      } else {
        if (isfundsfromOperations) {
          return {
            text:
              year.indexOf('-') >= 0
                ? '(' + year.replace('-', '') + ')'
                : year,
            margin: [0, 10, 0, 10],
            alignment: 'right',
            bold: true,
          };
        } else {
          return {
            text:
              year.indexOf('-') >= 0
                ? '(' + year.replace('-', '') + ')'
                : year,
            margin: [0, 10, 0, 10],
            alignment: 'right',
          };
        }
      }
    });

    return arr;
  }

  getMappedArrForIS(inputArr, isfundsfromOperations?, isItalic?, makeFirstValueNull?) {
    const arr = inputArr.map((year, index) => {
      if (index == 0) {
        if (isfundsfromOperations) {
          return {
            text: year,
            margin: [0, 10, 0, 10],
            alignment: 'left',
            bold: true,
          };
        } else {
          return { text: year, margin: [0, 10, 0, 10], italics: isItalic ? true : false };
        }
      } 
      else if(index == 1 && makeFirstValueNull){
        return {
          text: "a",
          margin: [0, 10, 0, 10],
          color: "#fff",
          alignment: 'left',
          bold: false,
        };
      }
      else {
       if (isfundsfromOperations) {
          return {
            text:
              year && year.indexOf('-') >= 0
                ? '(' + year.replace('-', '') + ')'
                : year,
            margin: [0, 10, 0, 10],
            alignment: 'right',
            bold: true,
          };
        } 
        else {
          return {
            text:
              year && year.indexOf('-') >= 0
                ? '(' + year.replace('-', '') + ')'
                : year,
            margin: [0, 10, 0, 10],
            alignment: 'right',
            italics: isItalic ? true : false 
          };
        }
      }
    });

    return arr;
  }


  getWidthsForRatios(){
    return [180, 59, 59, 59, 59, 59, 67, 60, 59, 59, 59]
  }

  getWidthsForKPI(){
    return [100, 447, 100, 100, 85]
  }

  getLayoutForTable(index?){
    return {
      //set custom borders size and color
      hLineWidth: function (i, node) {
        return (i === 0 || i == 1 || i == 2 || i == index) || i === node.table.body.length ? 0 : 0.5;
      },
      vLineWidth: function (i, node) {
        return 0;
      },
      hLineColor: function (i, node) {
        return (i === 0 || i == 1 || i == 2 || i == index) || i === node.table.body.length ? 'white' : 'gray';
      },
      // vLineColor: function (i, node) {
      //   return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
      // }
    }
  }

  getOrganizationalLogo(){
    return {
      image: this.organizationLogo,  width: 135, height: 65,
      colSpan: 2,
      alignment: "right"
    }
  }

  getRMILogo(){
    return {
      image: this.imagermi,  width: 135, height: 65,
    }
  }
}
