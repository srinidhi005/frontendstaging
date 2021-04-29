import { Component, OnInit, ViewChild, ChangeDetectorRef,ElementRef} from '@angular/core';
import { UrlConfigService } from 'src/app/shared/url-config.service';
import { RMIAPIsService } from 'src/app/shared/rmiapis.service';
import { ExcelService } from 'src/app/shared/excel.service';
import {UserDetailModelService} from 'src/app/shared/user-detail-model.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import autoTable from 'jspdf-autotable';
import * as Excel from "exceljs/dist/exceljs.min.js"
import {formatNumber} from '@angular/common';
import { AuthService } from 'src/app/auth.service';

export interface PLElement {
  inMillions:number;
			"NetIncome" :string;
			"(+) D&A" : string;
            "Funds from Operations" : string;
            "(+/–) Δ in Accounts Receivable" : string;
            "(+/–) Δ in Inventories" : string;
            "(+/–) Δ in Accounts Payable" : string;
            "(+/–) Δ in Accrued Liabilities" : string;
            "(+/–) Δ in Other Current Liabilities":string;
            "Cash Flow from Operating Activities (CFO)" : string;
            "(–) Total Capital Expenditures" : string;
            "(+) Asset Sales":string;
            "(+/–) Other Investing Activities" :string;
            "Cash Flow from Investing Activities (CFI)" : string;
            "(+/–) Debt Issued (Retired)": string;
            "(+/–) Common Stock Issued (Retired)" : string;
            "(–) Dividends Paid" : string;
            "Cash Flow from Financing Activities (CFF)" : string;
			"Net Change in Cash" : string;
}

let ELEMENT_PL_PDF: PLElement[] = [];

@Component({
  selector: 'app-cashmetrics',
  templateUrl: './cashmetrics.component.html',
  styleUrls: ['./cashmetrics.component.scss']
})
export class CashmetricsComponent implements OnInit {
	@ViewChild('imagecanvas', { static: false }) imagecanvas: ElementRef;
  scenarioArray=[];
  scenario=this.UserDetailModelService.getSelectedScenario();
  companyName=this.UserDetailModelService.getSelectedCompany();
  financialObj = new Map();
  progressBar:boolean;
years = [];
financials =[];
  inputColumns = ['inMillions',  'Net Income',
  'Depreciation & Amortization',
  'Funds from Operations',
	'Accounts Receivable',
  'Inventories',
  'Other Current Assets',
  'Accounts Payable',
  'Accrued Liabilities',
  'Other Current Liabilities',
  'Cash Flow from Operating Activities',
  'Total Capital Expenditures',
  ' Asset Sales',
  'Other Investing Activities',
  'Cash Flow from Investing Activities',
  'Debt Issued',
  'Common Stock Issued',
  'Dividends Paid',
  'Cash Flow from Financing Activities',
  'Net Change in Cash'];
  displayedColumns: string[]=[];
  displayData: any[];
  companySelected = localStorage.getItem('companySelected');
  scenarioNumber = localStorage.getItem('scenarioNumber');
  selectedCompanyName = localStorage.getItem('selectedCompanyName');
  scenarioName = 'Scenario 0';

  metricsLoaded = false;

  constructor(
  private urlConfig:UrlConfigService,
    private apiService:RMIAPIsService,
    public authService: AuthService,
    private UserDetailModelService:UserDetailModelService,
	private excelService: ExcelService
	) { }

  ngOnInit() {
    if(this.authService.authServiceLoaded){
      const ELEMENT_PL=[] as any;
      this.progressBar=true;
      
    this.apiService.getData(this.urlConfig.getCashActualsAPI()+this.companySelected).subscribe((res:any)=>{
      for (let j=0; j<res.length; j++) {
        
      this.financialObj.set(res[j].asof,{
        "Netincome":res[j].netincome,
        "DandA" : res[j].daa,
        "FundsFromOperations":res[j].fundsfromoperations,
        "Accountreceivables" : res[j].accountreceivablesdelta, 
        "Inventories":res[j].inventoriesdelta,
        "OtherCurrentassets":res[j].othercurrentassets,
        "Accountspayable" : res[j].accountspayable, 
		
		"AccuredLiabilites" : res[j].accruedliabilities, 
        "OtherCurrentliabilities":res[j].othercurrentliabilities,
		"CashFlowFromOperatingActivites":res[j].cfo,
        "Totalexpenditure":res[j].totalexpenditure,
        "AssetSales" : res[j].assetsales, 
		"OtherInvestingActivites" : res[j].otherinvestingactivities, 
        "CashFlowFromInvesting":res[j].cfi,
        "DebtIssuedRetired" : res[j].debtissued,
        "CommonStockIssuedRetired":res[j].commonstockissued,
        "Dividendspaid":res[j].dividendspaid,
		"CashFlowFromFinancingActivites":res[j].cff,
        "NetChangeinCash" : res[j].netchangeincash
          });
        }
    this.apiService.getData(this.urlConfig.getCashScenarioAPI()+this.companySelected).subscribe((res:any)=>{
      this.scenarioArray=res.scenarios;
      this.UserDetailModelService.setScenarioNumber(this.scenarioArray);
      let scenarioNumber=0;
      if(res.scenarios.includes(this.scenario)){
        scenarioNumber=this.scenario;
      }
      this.apiService.getData(this.urlConfig.getCashProjectionsAPIGET()+this.companySelected+"&scenario="+scenarioNumber).subscribe((res:any)=>{
for (let j=0; j<res.length; j++) {
         
        
       this.financialObj.set(res[j].asof,{
       "Netincome":res[j].netincome,
        "DandA" : res[j].daa,
        "FundsFromOperations":res[j].fundsfromoperations,
        "Accountreceivables" : res[j].accountreceivablesdelta, 
        "Inventories":res[j].inventoriesdelta,
        "OtherCurrentassets":res[j].othercurrentassets,
        "Accountspayable" : res[j].accountspayable, 
		"AccuredLiabilites" : res[j].accruedliabilities, 
        "OtherCurrentliabilities":res[j].othercurrentliabilities,
		"CashFlowFromOperatingActivites":res[j].cfo,
        "Totalexpenditure":res[j].totalexpenditure,
        "AssetSales" : res[j].assetsales, 
		"OtherInvestingActivites" : res[j].otherinvestingactivities, 
        "CashFlowFromInvesting":res[j].cfi,
        "DebtIssuedRetired" : res[j].debtissued,
        "CommonStockIssuedRetired":res[j].commonstockissued,
        "Dividendspaid":res[j].dividendspaid,
		"CashFlowFromFinancingActivites":res[j].cff,
        "NetChangeinCash" : res[j].netchangeincash
          });
        }
        this.financialObj.forEach((v,k) => {
        var pushData={
            inMillions : k,	
            "NetIncome" : "$ "+formatNumber(Number(v.Netincome), 'en-US', '1.0-0'),
            "(+) D&A" : "$ "+formatNumber(Number(v.DandA), 'en-US', '1.0-0'),
            "Funds from Operations" : "$ "+formatNumber(Number(v.FundsFromOperations), 'en-US', '1.0-0'),
            "(+/–) Δ in Accounts Receivable" : "$ "+formatNumber(Number(v.Accountreceivables), 'en-US', '1.0-0'),
            "(+/–) Δ in Inventories" : "$ "+formatNumber(Number(v.Inventories), 'en-US', '1.0-0'),
            "(+/–) Δ in Accounts Payable" : "$ "+formatNumber(Number(v.Accountspayable), 'en-US', '1.0-0'),
            "(+/–) Δ in Accrued Liabilities" : "$ "+formatNumber(Number(v.AccuredLiabilites), 'en-US', '1.0-0'),
            "(+/–) Δ in Other Current Liabilities":"$ "+formatNumber(Number(v.OtherCurrentliabilities), 'en-US', '1.0-0'),
            "Cash Flow from Operating Activities (CFO)" : "$ "+formatNumber(Number(v.CashFlowFromOperatingActivites), 'en-US', '1.0-0'),
            "(–) Total Capital Expenditures" : "$ "+formatNumber(Number(v.Totalexpenditure), 'en-US', '1.0-0'),
            "(+) Asset Sales":"$ "+formatNumber(Number(v.AssetSales), 'en-US', '1.0-0'),
            "(+/–) Δ in Other Current Assets":"$ "+formatNumber(Number(v.OtherCurrentassets), 'en-US', '1.0-0'),
            "(+/–) Other Investing Activities" : "$ "+formatNumber(Number(v.OtherInvestingActivites), 'en-US', '1.0-0'),
            "Cash Flow from Investing Activities (CFI)" : "$ "+formatNumber(Number(v.CashFlowFromInvesting), 'en-US', '1.0-0'),
            "(+/–) Debt Issued (Retired)":"$ "+formatNumber(Number(v.DebtIssuedRetired), 'en-US', '1.0-0'),
            "(+/–) Common Stock Issued (Retired)" : "$ "+formatNumber(Number(v.CommonStockIssuedRetired), 'en-US', '1.0-0'),
            "(–) Dividends Paid" : "$ "+formatNumber(Number(v.Dividendspaid), 'en-US', '1.0-0'),
            "Cash Flow from Financing Activities (CFF)" : "$ "+formatNumber(Number(v.CashFlowFromFinancingActivites), 'en-US', '1.0-0'),
			"Net Change in Cash" : "$ "+formatNumber(Number(v.NetChangeinCash), 'en-US', '1.0-0'),
          };
          ELEMENT_PL.push(pushData);
      });
      ELEMENT_PL_PDF=ELEMENT_PL;
      this.displayedColumns = ['0'].concat(ELEMENT_PL.map(x => x.inMillions.toString()));
      this.displayData = this.inputColumns.map(x => formatInputRow(x));
      this.progressBar=false;
        const obj = {};
        this.financialObj.forEach((value, key) => {
          obj[key] = value
        })
        this.years = Object.keys(obj);
        this.financials = Object.values(obj);
        this.metricsLoaded = true;

        }, error => {
          this.metricsLoaded = true;
        });//end of projections
      }, error => {
        this.metricsLoaded = true;
      });//end of Save Scenarios
    }, error => {
      this.metricsLoaded = true;
    });//end of actuals
   function formatInputRow(row) {
      const output = {};
      output[0] = row;
      for (let i = 0; i < ELEMENT_PL.length; ++i) {
        output[ELEMENT_PL[i].inMillions] = ELEMENT_PL[i][row];
      }
      return output;
    }
    }else {
      const intervalID = setInterval(() => {
        if (this.authService.authServiceLoaded) {
          this.ngOnInit();
          clearInterval(intervalID);
        }
      }, 100);
    }
  }
 
  loadScenario(index:number){
		this.scenarioName = "Scenario "+index; 
      this.scenario = index;
      this.ngOnInit();
  
  }

  exportToXLSX(){
    console.log("Finanials", this.financials)

    this.years.forEach( year => {
      year = " " + year
    })

    const keys = ["in millions"].concat(this.years)
    const data = []

    data.push(this.prepareJsonForExport(keys, 'Netincome', "NetIncome"))
    data.push(this.prepareJsonForExport(keys, 'DandA', "(+) D&A" ))
    data.push(this.prepareJsonForExport(keys, 'FundsFromOperations', "Funds from Operations"))
    data.push(this.prepareJsonForExport(keys, 'Accountreceivables', "(+/–) Δ in Accounts Receivable"))
    data.push(this.prepareJsonForExport(keys, 'Inventories', "(+/–) Δ in Inventories"))
    data.push(this.prepareJsonForExport(keys, 'Accountspayable', "(+/–) Δ in Accounts Payable"))
    data.push(this.prepareJsonForExport(keys, 'AccuredLiabilites', "(+/–) Δ in Accrued Liabilities"))
    data.push(this.prepareJsonForExport(keys, 'OtherCurrentliabilities', "(+/–) Δ in Other Current Liabilities"))
    data.push(this.prepareJsonForExport(keys, 'CashFlowFromOperatingActivites', "Cash Flow from Operating Activities (CFO)"))
    data.push(this.prepareJsonForExport(keys, 'Totalexpenditure', "(–) Total Capital Expenditures"))
    data.push(this.prepareJsonForExport(keys, 'AssetSales', "(+) Asset Sales"))
    data.push(this.prepareJsonForExport(keys, 'OtherCurrentassets', "(+/–) Δ in Other Current Assets")) // check this.
    data.push(this.prepareJsonForExport(keys, 'OtherInvestingActivites', "(+/–) Other Investing Activities"))
    data.push(this.prepareJsonForExport(keys, 'CashFlowFromInvesting', "Cash Flow from Investing Activities (CFI)"))
    data.push(this.prepareJsonForExport(keys, 'DebtIssuedRetired', "(+/–) Debt Issued (Retired)"))
    data.push(this.prepareJsonForExport(keys, 'CommonStockIssuedRetired', "(+/–) Common Stock Issued (Retired)"))
    data.push(this.prepareJsonForExport(keys, 'Dividendspaid', "(–) Dividends Paid"))
    data.push(this.prepareJsonForExport(keys, 'CashFlowFromFinancingActivites', "Cash Flow from Financing Activities (CFF)"))
	data.push(this.prepareJsonForExport(keys, 'NetChangeinCash', "Net Change in Cash"))

    console.log(data);

    this.excelService.exportAsExcelFileCashflow(data, "Cash Flow Statement", keys,this.selectedCompanyName,this.scenarioName)

  }

  prepareJsonForExport(keys, parameter, label,isPercent?){
    const jsonObject = {};

    

    keys.forEach((key, index) => {
      if(index == 0){
        jsonObject[key] = label
      }
      else{
		  if(isPercent){
			   jsonObject[key] = +(this.financials[index - 1][parameter]/100)
		   }
		   else{
        jsonObject[key] = +this.financials[index - 1][parameter]
      }
	  }
    })

    return jsonObject
    
  }
  exportToPDF(){
    //let doc = new jsPDF('l','pt'); 
    let data = [];
    let inMillionsYear=[];
    let netIncome=[];
    let DA=[];
    let fundsfromOperations=[];
    let accountsReceviable=[];
    let inventories=[];
    let otherCurrentAssests=[];
    let accountPayable=[];
    let accruedLiablities=[];
    let otherCurrentLiabilites=[];
    let CFO=[];
    let totalCapitalExpenditures=[];
    let assestSales=[];
    let otherInvestingActivites=[];
    let CFI=[];
    let debtIssued=[];
    let commonStockIssued=[];
    let dividendsPaid=[];
    let CFF=[];
    let netChangeInCash=[];
    ELEMENT_PL_PDF.forEach(obj => {
      inMillionsYear.push(obj["inMillions"]);
      netIncome.push(obj["NetIncome"]);
      DA.push(obj["(+) D&A"]);
      fundsfromOperations.push(obj["Funds from Operations"]);
      accountsReceviable.push(obj["(+/–) Δ in Accounts Receivable"]);
      inventories.push(obj["(+/–) Δ in Inventories"]);
      otherCurrentAssests.push(obj["(+/–) Δ in Other Current Assets"]);
      accountPayable.push(obj["(+/–) Δ in Accounts Payable"]);
      accruedLiablities.push(obj["(+/–) Δ in Accrued Liabilities"]);
      otherCurrentLiabilites.push(obj["(+/–) Δ in Other Current Liabilities"]);
      CFO.push(obj["Cash Flow from Operating Activities (CFO)"]);
      totalCapitalExpenditures.push(obj["(–) Total Capital Expenditures"]);
      assestSales.push(obj["(+) Asset Sales"]);
      otherInvestingActivites.push(obj["(+/–) Other Investing Activities"]);
      CFI.push(obj["Cash Flow from Investing Activities (CFI)"]);
      debtIssued.push(obj["(+/–) Debt Issued (Retired)"]);
      commonStockIssued.push(obj["(+/–) Common Stock Issued (Retired)"]);
      dividendsPaid.push(obj["(–) Dividends Paid"]);
    CFF.push(obj["Cash Flow from Financing Activities (CFF)"]);
    netChangeInCash.push(obj["Net Change in Cash"]);
    });
    inMillionsYear.unshift("Years");
      netIncome.unshift("NetIncome");
      DA.unshift("(+) D&A");
      fundsfromOperations.unshift("Funds from Operations");
      accountsReceviable.unshift("(+/–) Δ in Accounts Receivable");
      inventories.unshift("(+/–) Δ in Inventories");
      otherCurrentAssests.unshift("(+/–) Δ in Other Current Assets");
      accountPayable.unshift("(+/–) Δ in Accounts Payable");
      accruedLiablities.unshift("(+/–) Δ in Accrued Liabilities");
      otherCurrentLiabilites.unshift("(+/–) Δ in Other Current Liabilities");
      CFO.unshift("Cash Flow from Operating Activities (CFO)");
      totalCapitalExpenditures.unshift("(–) Total Capital Expenditures");
      assestSales.unshift("(+) Asset Sales");
      otherInvestingActivites.unshift("(+/–) Other Investing Activities");
      CFI.unshift("Cash Flow from Investing Activities (CFI)");
      debtIssued.unshift("(+/–) Debt Issued (Retired)");
      commonStockIssued.unshift("(+/–) Common Stock Issued (Retired)");
      dividendsPaid.unshift("(–) Dividends Paid");
    CFF.unshift("Cash Flow from Financing Activities (CFF)");
    netChangeInCash.unshift("Net Change in Cash");

    inMillionsYear = inMillionsYear.map( (year, index) => {
      if(index == 0){
        return { text: "(in millions)", italics: true, fillColor: '#164A5B', color: "#fff",margin: [0, 10 , 0, 10],}
      }
      else{
        return {text: year, bold: true, fillColor: '#164A5B', color: "#fff", margin: [0, 10, 0, 10], border: [10, 10, 10, 10],alignment: 'right'}
      }
    })

    // netIncome = netIncome.map( (year, index) => {
    //   if(index == 0){
    //     return { text: year , margin: [0, 10, 0, 10]}
    //   }
    //   else{
    //     return {text: year, margin: [0, 10, 0, 10]}
    //   }
    // })
    
    // data = data.map((param, index) => {
    //   if(index > 0){
    //     const mappedArr = param.map( p => {
    //       return {text: p, margin: [0, 10, 0, 10]}
    //     })
    //     return mappedArr;
    //   }
    // })
  
    data.push(
        inMillionsYear, 
        this.getMappedArr(netIncome),
        this.getMappedArr(DA),
        this.getMappedArr(fundsfromOperations,true),
        this.getMappedArr(accountsReceviable),
        this.getMappedArr(inventories),
        this.getMappedArr(otherCurrentAssests),
        this.getMappedArr(accountPayable),
        this.getMappedArr(accruedLiablities),
        this.getMappedArr(otherCurrentLiabilites),
        this.getMappedArr(CFO,true),
        this.getMappedArr(totalCapitalExpenditures),
        this.getMappedArr(assestSales),
        this.getMappedArr(otherInvestingActivites),
        this.getMappedArr(CFI,true),
        this.getMappedArr(debtIssued),
        this.getMappedArr(commonStockIssued),
        this.getMappedArr(dividendsPaid),
        this.getMappedArr(CFF,true),
        this.getMappedArr(netChangeInCash,true)  
      );

    console.log(data);
    console.log(inMillionsYear)
    
    // autoTable(doc,{
    //     head: [inMillionsYear],
    //     body: data,     
    //     headStyles:{fillColor: [22, 74, 91], textColor:[245, 245, 245]},
    //     columnStyles: {0: {fillColor: [22, 74, 91], textColor:[245, 245, 245] }},
    //     styles: {overflow: 'linebreak',fontSize: 12},
    //   });
    //   doc.save(this.companySelected +'.pdf');


var canvas = document.createElement('canvas');
        canvas.width = this.imagecanvas.nativeElement.width; 
        canvas.height = this.imagecanvas.nativeElement.height; 
        canvas.getContext('2d').drawImage(this.imagecanvas.nativeElement,0,0);
  const imagermi = canvas.toDataURL('image/png')
      let docDefinition = {
		    pageSize: {
    width: 870,
    height: 'auto'
  },
	
   pageMargins: [ 40, 40, 40, 40 ],
        
  
			
 
		content: [
		{image:imagermi,width:150,height:75},
			{
				  text:this.companySelected+' - ' +' Historical & Projected Cash Flow Statement '+'-'+this.scenarioName,
				  style:'header',
			},
          {
			  
            //style: 'tableExample',
            // layout: 'lightHorizontalLines',            
            
			table: {
              headerRows: 1,
              heights: 20,
			  //width:'auto',
              widths: [240, 70, 70, 70,70,70,60,60],
              body: data
            },
            layout: {
              //set custom borders size and color
              hLineWidth: function (i, node) {
                return (i === 0 || i === node.table.body.length) ? 0.5 : 0.5;
              },
              vLineWidth: function (i, node) {
                return 0;
              },
              hLineColor: function (i, node) {
                return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
              },
              // vLineColor: function (i, node) {
              //   return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
              // }
            }
          },
        ],
        styles: {
          header:{
			  fontSize:18,bold:true,margin:[10,10,10,10]
		  },
        },
      }
      // pdfMake.tableLayouts = {
      //   exampleLayout : {
      //     paddingLeft: function (i) {
      //       return 20;
      //     },
      //   }
      // }
    
      pdfMake.createPdf(docDefinition).download();

    }

    getMappedArr(inputArr,isfundsfromOperations?){
      const arr = inputArr.map( (year, index) => {
        if(index == 0){
			if(isfundsfromOperations){
          return {text: year, margin: [0, 10, 0, 10],alignment: 'left',bold:true}
        }else{
          return { text: year , margin: [0, 10, 0, 10]}
		}
        }
        else {
			if(isfundsfromOperations){
          return {text: year.indexOf("-") >= 0 ? "(" + year.replace("-", "") +")" : year, margin: [0, 10, 0, 10],alignment: 'right',bold:true}
        }
		else{
			return {text: year.indexOf("-") >= 0 ? "(" + year.replace("-", "") +")" : year, margin: [0, 10, 0, 10],alignment: 'right'}
		}
		}
      })

      return arr;
    }
}
