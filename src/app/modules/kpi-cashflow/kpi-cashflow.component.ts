import { Component, OnInit, ViewChild, ChangeDetectorRef,ElementRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material';
import { UrlConfigService } from 'src/app/shared/url-config.service';
import { RMIAPIsService } from 'src/app/shared/rmiapis.service';
import { UserDetailModelService } from 'src/app/shared/user-detail-model.service';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { cloneDeep } from 'lodash';
import { AuthService } from 'src/app/auth.service';
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export interface PeriodicElement {
  position: number;
  name: string;
  fromyear: number;
  toyear: number;
  KPIValue: any;
}


@Component({
  selector: 'app-kpi-cashflow',
  templateUrl: './kpi-cashflow.component.html',
  styleUrls: ['./kpi-cashflow.component.scss']
})
export class KpiCashflowComponent implements OnInit {
@ViewChild('imagecanvas', { static: false }) imagecanvas: ElementRef;
	scenario = this.UserDetailModelService.getSelectedScenario();
  companyName = this.UserDetailModelService.getSelectedCompany();
  loadedScenario = 'Scenario 0';
  scenarioArray = [];
  progressBar: boolean;
  dataValuesActuals: any;
  dataValuesProjections: any;
  dataColumnsActuals: string[] = [
    'Avg. Capex as % of Revenue',
    'Avg. Asset Sales as % of Revenue',
    'Avg. Other Investing Activites as % of Revenue',
    'Avg. Dividends Paid as % of Net Income',
    'Avg. FFO as % of Revenue',
  ];
  dataColumnsProjections: string[] = [
    'Avg. Capex as % of Revenue',
    'Avg. Asset Sales as % of Revenue',
    'Avg. Other Investing Activites as % of Revenue',
    'Avg. Dividends Paid as % of Net Income',
    'Avg. FFO as % of Revenue',
	'Avg. CFO as % of Revenue',
	'Avg. CFO as % of EBITDA',
    
  ];
  displayedColumns: string[] = [
    'position',
    'name',
    'fromyear',
    'toyear',
    'KPIValue',
  ];
  ELEMENT_KPI_ACTUALS: PeriodicElement[] = [];
  ELEMENT_KPI_PROJECTIONS: PeriodicElement[] = [];
  dataSourceActuals = new MatTableDataSource<PeriodicElement>(
    this.ELEMENT_KPI_ACTUALS
  );
  dataSourceProjections = new MatTableDataSource<PeriodicElement>(
    this.ELEMENT_KPI_PROJECTIONS
  );
  companySelected = localStorage.getItem('companySelected');

  kpiLoaded = false;


  constructor( private urlConfig: UrlConfigService,
    private apiService: RMIAPIsService,
    public authService: AuthService,
    // tslint:disable-next-line:no-shadowed-variable
    private UserDetailModelService: UserDetailModelService) { }

  
  ngOnInit() {
    if(this.authService.authServiceLoaded){
      this.progressBar = true;
      this.apiService
        .getData(this.urlConfig.getKPICashActuals() + this.companySelected)
        .subscribe((res: any) => {
          this.ELEMENT_KPI_ACTUALS = [];
          this.ELEMENT_KPI_PROJECTIONS = [];
          this.dataSourceActuals = new MatTableDataSource<PeriodicElement>(
            this.ELEMENT_KPI_ACTUALS
          );
          this.dataSourceProjections = new MatTableDataSource<PeriodicElement>(
            this.ELEMENT_KPI_PROJECTIONS
          );
          this.dataValuesActuals = [
            res[0].capexpercentrevenue,
            res[0].assetsalespercentrevenue,
            res[0].investingpercentrevenue,
            res[0].dividendspaidpercentincome,
            res[0].ffopercentrevenue,
          ];
          for (
            let index = 0;
            index <= this.dataColumnsActuals.length - 1;
            index++
          ) {
            const pushData = {
              position: index + 1,
              name: this.dataColumnsActuals[index],
              fromyear: res[0].fromyear,
              toyear: res[0].toyear,
              KPIValue: this.dataValuesActuals[index].toFixed(1),
            };
            this.ELEMENT_KPI_ACTUALS.push(pushData);
            this.dataSourceActuals._updateChangeSubscription();
          }
          this.progressBar = false;
        }, error => {
          this.kpiLoaded = true;
        });
      this.apiService
        .getData(this.urlConfig.getScenarioAPI() + this.companySelected)
        .subscribe((res: any) => {
          this.progressBar = true;
          this.scenarioArray = res.scenarios;
          this.UserDetailModelService.setScenarioNumber(this.scenarioArray);
          let scenarioNumber = 0;
          if (res.scenarios.includes(this.scenario)) {
            scenarioNumber = this.scenario;
          }
          this.apiService
            .getData(
              this.urlConfig.getKPICashProjections() +
                this.companySelected +
                '&scenario=' +
                scenarioNumber
            )
            // tslint:disable-next-line:no-shadowed-variable
            .subscribe((res: any) => {
              this.progressBar = true;
              this.dataValuesProjections = [
                res[0].capexpercentrevenue,
                res[0].assetsalespercentrevenue,
                res[0].investingpercentrevenue,
                res[0].dividendspaidpercentincome,
                res[0].ffopercentrevenue,
          res[0].cfopercentrevenue,
          res[0].cfopercentebitda
              ];
              for (
                let index = 0;
                index <= this.dataColumnsProjections.length - 1;
                index++
              ) {
                const pushData = {
                  position: index + 1,
                  name: this.dataColumnsProjections[index],
                  fromyear: res[0].fromyear,
                  toyear: res[0].toyear,
                  KPIValue: this.dataValuesProjections[index].toFixed(1),
                };
                this.ELEMENT_KPI_PROJECTIONS.push(pushData);
                this.dataSourceProjections._updateChangeSubscription();
                this.kpiLoaded = true;
  
              }
              this.progressBar = false;
            }, error => {
              this.kpiLoaded = true;
            });
        }, error => {
          this.kpiLoaded = true;
        });
    }
    else{
      const intervalID = setInterval(() => {
        if (this.authService.authServiceLoaded) {
          this.ngOnInit();
          clearInterval(intervalID);
        }
      }, 100);
    }
  }
  loadScenario(index: number) {
    this.scenario = index;

    this.loadedScenario = 'Scenario ' + index;

    this.ngOnInit();
  }

  exportToPDF() {
    //let doc = new jsPDF('l','pt');
    // let data = [];

    let dataForActuals = [];
    let dataForProj = [];

    let headersAct = [];
    let headersProj = [];
    
    console.log('ACTUALS', this.ELEMENT_KPI_ACTUALS);
    console.log('ACTUALS', this.ELEMENT_KPI_PROJECTIONS);

    const actualsAndProjValues = this.ELEMENT_KPI_ACTUALS.concat(
      this.ELEMENT_KPI_PROJECTIONS
    );

    headersAct = ['No', '	Cash Flow Statement', 'From', 'To', 'KPI'];
    headersProj = ['No', '	Cash Flow Statement ', 'From', 'To', 'KPI'];

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

    const keys = Object.keys(this.ELEMENT_KPI_ACTUALS[0]);

    let actualsData = []
    this.ELEMENT_KPI_ACTUALS.forEach((obj) => {
      const values = []
      keys.forEach( key => {
        values.push(obj[key]);
      })
      actualsData.push(this.getMappedArr(values))
    });

    let projData = []
    this.ELEMENT_KPI_PROJECTIONS.forEach((obj) => {
      const values = []
      keys.forEach( key => {
        values.push(obj[key]);
      })
      projData.push(this.getMappedArr(values))
    });

    const masterHeaderAct = [];
    const masterHeaderProj = [];

    masterHeaderAct.push(headersAct);
    masterHeaderProj.push(headersProj);

    dataForActuals = masterHeaderAct.concat(actualsData);
    dataForProj = masterHeaderProj.concat(projData);

    console.log("dataForActuals", dataForActuals);
    console.log("dataForProj", dataForProj);

    var canvas = document.createElement('canvas');
    canvas.width = this.imagecanvas.nativeElement.width;
    canvas.height = this.imagecanvas.nativeElement.height;
    canvas.getContext('2d').drawImage(this.imagecanvas.nativeElement, 0, 0);
    const imagermi = canvas.toDataURL('image/png');

    let docDefinition = {
      pageSize: {
        width: 900,
        height: "auto",
      },

      pageMargins: [40, 40, 40, 40],

      content: [
         { image: imagermi, width: 150, height: 75 },
		// { image: imagermi, width: 150, height: 75 },
		 {
          text: this.companySelected + " - " +" KPI CashFlow Statement " + " - " + this.loadedScenario,
          style: 'header',
        },

        {
          text: 'Historical Key Metrics',
          style: 'subheader',
        },
        {
          //style: 'tableExample',
          // layout: 'lightHorizontalLines',
          // style: 'tableExample',
          table: {
            headerRows: 1,
            heights: 20,
            // width:'auto',
            widths: [100, 420, 100, 100, 70],
            body: dataForActuals
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
        },

        {
          text: 'Projected Key Metrics',
          style: 'subheader',
        },
        {
          // style: 'tableExample',
          table: {
            headerRows: 1,
            heights: 20,
            // width:'auto',
            widths: [100, 420, 100, 100, 70],
            body: dataForProj,
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
        }
      ],
      styles: {
        header: {
          fontSize: 16,
          bold: true,
          margin: [10, 30, 10, 10],
        },
        subheader : {
          fontSize: 18,
          bold: true,
          margin: [10, 30, 10, 10],
        }
      },
    };
    

    pdfMake.createPdf(docDefinition).download();
  }

  getMappedArr(inputArr) {
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
}
