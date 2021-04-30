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
  selector: 'app-kpi-bs',
  templateUrl: './kpi-bs.component.html',
  styleUrls: ['./kpi-bs.component.scss'],
})
export class KpiBsComponent implements OnInit {
@ViewChild('imagecanvas', { static: false }) imagecanvas: ElementRef;
  scenario = this.UserDetailModelService.getSelectedScenario();
  companyName = this.UserDetailModelService.getSelectedCompany();
  scenarioArray = [];
  progressBar: boolean;
  dataValuesActuals: any;
  dataValuesProjections: any;
  loadedScenario = 'Scenario 0';
  dataColumns: string[] = [
    'Avg. Days Sales Outstanding (DSO)',
    'Avg. Inventory Days',
    'Avg. Other Current Assets as % of Revenue',
    'Avg. Days Payable Outstanding (DPO)',
    'Avg. Accrued Liabilities as % of COGS',
    'Avg. Other Current Liabilties as % of COGS',
  ];
  percentageValues = [
    this.dataColumns[2],
    this.dataColumns[4],
    this.dataColumns[5],
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

  constructor(
    private urlConfig: UrlConfigService,
    private apiService: RMIAPIsService,
    public authService: AuthService,
    private UserDetailModelService: UserDetailModelService
  ) {}

  ngOnInit() {
    if(this.authService.authServiceLoaded){
      this.progressBar = true;
    this.apiService
      .getData(this.urlConfig.getBsKPIActuals() + this.companySelected)
      .subscribe((res: any) => {
        this.ELEMENT_KPI_PROJECTIONS = [];
        this.ELEMENT_KPI_ACTUALS = [];
        this.dataSourceActuals = new MatTableDataSource<PeriodicElement>(
          this.ELEMENT_KPI_ACTUALS
        );
        this.dataSourceProjections = new MatTableDataSource<PeriodicElement>(
          this.ELEMENT_KPI_PROJECTIONS
        );

        this.dataValuesActuals = [
          res[0].dso,
          res[0].inventorydays,
          res[0].othercurrentassetspercent,
          res[0].dpo,
          res[0].accruedliabilitiespercent,
          res[0].othercurrentliabilitiespercent,
        ];

        for (let index = 0; index <= this.dataColumns.length - 1; index++) {
          const pushData = {
            position: index + 1,
            name: this.dataColumns[index],
            fromyear: res[0].fromyear,
            toyear: res[0].toyear,
            KPIValue: this.dataValuesActuals[index],
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
            this.urlConfig.getBsKPIProjections() +
              this.companySelected +
              '&scenario=' +
              scenarioNumber
          )
          .subscribe((res: any) => {
            this.progressBar = true;
            this.dataValuesProjections = [
              res[0].dso,
              res[0].inventorydays,
              res[0].othercurrentassetspercent,
              res[0].dpo,
              res[0].accruedliabilitiespercent,
              res[0].othercurrentliabilitiespercent,
            ];
            for (let index = 0; index <= this.dataColumns.length - 1; index++) {
              let pushData = {
                position: index + 1,
                name: this.dataColumns[index],
                fromyear: res[0].fromyear,
                toyear: res[0].toyear,
                KPIValue: this.dataValuesProjections[index],
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

    headersAct = ['No', '	Balance Sheet', 'From', 'To', 'KPI'];
    headersProj = ['No', '	Balance Sheet', 'From', 'To', 'KPI'];

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
          text: this.companySelected + " - " +" KPI Balance Sheet " + " - " + this.loadedScenario,
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
