import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { UrlConfigService } from 'src/app/shared/url-config.service';
import { RMIAPIsService } from '../../shared/rmiapis.service';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ExcelService } from 'src/app/shared/excel.service';
import { cloneDeep } from 'lodash';
import { AuthService } from 'src/app/auth.service';
import { MatDialog } from '@angular/material';
import { LoadingPopupComponent } from '../loading-popup/loading-popup.component';
import { ReportBuilderService } from 'src/app/shared/report-builder.service';

@Component({
  selector: 'app-company-details',
  templateUrl: './company-details.component.html',
  styleUrls: ['./company-details.component.scss']
})
export class CompanyDetailsComponent implements OnInit, AfterViewInit {
	
  @ViewChild('downloadLink', { static: true }) downloadLink: ElementRef;

 @ViewChild('uploadFile', { static: false }) uploadFile: ElementRef;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  userid: any;
  nickname: any;
  email: any;
  geography: any[] = ['APAC', 'EMEA', 'LATAM', 'NA'];
  companysize: any[] = ['1-10', '11-100', '101-1000', '1001-10000', '10000+'];
industry:any[]= ['Communication Services', 'Consumer Discretionary', 'Consumer Staples', 'Energy', 'Financials', 'Healthcare', 'Industrials', 'Information Technology', 'Materials', 'Pharmaceuticals', 'Real Estate', 'Utilities'];
  capatialization: any[] = ['USD 1M+', 'USD 10M+', 'USD 100M+'];
  revenue: any[] = [
    'Above USD 1M',
    'Above USD 10M',
    'Above USD 50M',
    'Above USD 100M',
  ];

  file: File;
  firstname: any;
  lastname: any;
  title: any;
  industryInput: any;
  zipcode: any;
  address: any;
  city: any;
  country: any;
  capitalisation: any;
  state: any;
  geographyInput: any;
  company: any;
  revenueInput: any;
  companysizeInput: any;
  contact: any;
  capatializationInput: any;
  inprogress: boolean = false;
  logo: any;
  form = new FormGroup({
    userid: new FormControl({ value: '', disabled: true }, [
      Validators.required,
    ]),
    email: new FormControl({ value: '', disabled: true }, [
      Validators.required,
    ]),
    firstname: new FormControl(null),
    lastname: new FormControl(null),
    contactnumber: new FormControl(null),
    company: new FormControl(null, [Validators.required]),
    title: new FormControl(null, [Validators.required]),
    address: new FormControl(null, [Validators.required]),
    country: new FormControl(null, [Validators.required]),
    zipcode: new FormControl(null, [Validators.required]),
    state: new FormControl(null, [Validators.required]),
    city: new FormControl(null, [Validators.required]),
    industry: new FormControl(null, [Validators.required]),
    geography: new FormControl(null, [Validators.required]),
    companysize: new FormControl(null, [Validators.required]),
    capatialization: new FormControl(null, [Validators.required]),
    revenue: new FormControl(null, [Validators.required]),
    // logo: new FormControl(null, [Validators.required]),
  });

  @ViewChild('imgLink', { static: true }) imgLink: ElementRef;
  imageLoaded = false;

  loggedInUserId

  currentUser

  constructor(
    private RMIAPIsService: RMIAPIsService,
    private UrlConfigService: UrlConfigService,
    private _snackBar: MatSnackBar,
    private router :Router,
    private reportService : ReportBuilderService,
    private dialog: MatDialog,
    public authService : AuthService,
    private excelService : ExcelService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {

    if(this.authService.authServiceLoaded){
      this.nickname = localStorage.getItem('nickname');
      this.email = localStorage.getItem('email');
      this.loggedInUserId = localStorage.getItem('loggedInUserId');

      this.authService.getUserById(this.loggedInUserId).subscribe(
        (res) => {
          console.log('USER', res);
          this.currentUser = res.body;
          if (this.currentUser && this.currentUser.user_metadata && this.currentUser.user_metadata.organizationLogo) {
            this.excelService.organizationLogo = this.currentUser.user_metadata.organizationLogo;
          }

          this.imageLoaded = true;

        },
        (error) => {
          console.log(error);
          this.imageLoaded = true;
        }
      );

      this.nickname = localStorage.getItem('nickname');
      this.email = localStorage.getItem('email');
      this.userid = this.nickname;
      this.RMIAPIsService.getData(
        this.UrlConfigService.getuserProfileDetail() +
          this.nickname +
          '&email=' +
          this.email
      ).subscribe((res: any) => {
        console.log(res);
        this.firstname = res[0]?res[0].firstname:'';
        this.lastname = res[0]?res[0].lastname:'';
        this.title = res[0]?res[0].title:'';
        this.industryInput = res[0]?res[0].industry:'';
        this.zipcode = res[0]?res[0].zipcode:'';
        this.address = res[0]?res[0].address:'';
        this.city = res[0]?res[0].city:'';
        this.country = res[0]?res[0].country:'';
        this.capatializationInput = res[0]?res[0].capitalisation:'';
        this.state = res[0]?res[0].state:'';
        this.geographyInput = res[0]?res[0].geography:'';
        this.company = res[0]?res[0].companyname:'';
        this.revenueInput = res[0]?res[0].revenue:'';
        this.companysizeInput = res[0]?res[0].companysize:'';
        this.contact = res[0]?res[0].contact:'';
        // this.excelService.organizationLogo = res[0]?res[0].logo:'';
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

  ngAfterViewInit(){
    // this.RMIAPIsService.getLogo(this.UrlConfigService.GetLogoAPI()+"hgjdkd@rmiinsights.com").subscribe( (res : File) => {
    //   console.log("Succesfully fetched the logo", res)
    //   if(res.type != "text/html"){
    //       // this.file = cloneDeep(res);
    //       // console.log("FIle", this.file)        
    //       // if(this.excelService.organizationLogo){
    //       //   window.URL.revokeObjectURL(this.excelService.organizationLogo);
    //       //   this.excelService.organizationLogo = undefined;
    //       // }

    //       window.webkitURL.revokeObjectURL(this.excelService.organizationLogo);

    //       const _this = this;
    //       let base64data;
    //       const reader = new FileReader();
    //       reader.readAsDataURL(res); 
    //       reader.onloadend = function() {
    //         base64data = reader.result;    
            
    //         // this.excelService.organizationLogo = window.webkitURL.createObjectURL(res)
    //         // _this.excelService.organizationLogo = _this.sanitizer.bypassSecurityTrustUrl(base64data)
    //         // console.log("LOGO AFTER UPLOAD", _this.excelService.organizationLogo) 

            
    //         // _this.downloadLink.nativeElement.href = _this.excelService.organizationLogo;
    //         // _this.downloadLink.nativeElement.target = "_blank";
    //         // _this.downloadLink.nativeElement.download = "ImageFromDB.png"
    //         // _this.downloadLink.nativeElement.click();

    //         // window.webkitURL.revokeObjectURL(this.excelService.organizationLogo);
    //       }

    //       setTimeout(() => {
    //         // // this.excelService.organizationLogo = window.webkitURL.createObjectURL(res)
    //         // this.excelService.organizationLogo = this.sanitizer.bypassSecurityTrustUrl(base64data)
    //         // console.log("LOGO AFTER UPLOAD", this.excelService.organizationLogo) 

            
    //         // this.downloadLink.nativeElement.href = this.excelService.organizationLogo;
    //         // this.downloadLink.nativeElement.target = "_blank";
    //         // this.downloadLink.nativeElement.download = "ImageFromDB.png"
    //         // this.downloadLink.nativeElement.click();

    //         // // window.webkitURL.revokeObjectURL(this.excelService.organizationLogo);
    //       });
    //   }
    // }, error => {
    //   console.log("Failed to fetch the logo", error)
    // })
  }

  pickFile(event){
    this.reportService.message = ""
    this.dialog.open(LoadingPopupComponent, { disableClose: true });

    const target: DataTransfer = <DataTransfer>(event.target);
    console.log(target,"--------", typeof(event.target))

    var list:FileList = event.target.files
    this.file = list.item(0);

    // i.e limit upto 5MB = 5242880 B

    if(this.file && this.file.size > 3142758){
      this.excelService.showMessage("File size of the company logo cannot exceed 2 MB", "Cancel", "350px", "150px");
      return;
    }

    console.log(this.file)

    const _this = this;

    let base64data;
    const reader = new FileReader();
    reader.readAsDataURL(this.file); 
    reader.onloadend = function() {
      base64data = reader.result;  
      console.log("Got Base64 Data", base64data)

      let body = {};
      if (_this.currentUser && _this.currentUser.user_metadata) {
        body = {
          user_metadata: _this.currentUser.user_metadata,
        };

        body['user_metadata']['organizationLogo'] = base64data;
      }
      else{
        body = {
          user_metadata : {
            organizationLogo : base64data
          }
        }
      }

      _this.authService.updateUsers(body, _this.loggedInUserId).subscribe(
        (res) => {
          console.log('Upadted user Succes', res);

          _this.excelService.organizationLogo = base64data;

          _this.dialog.closeAll()

        },
        (error) => {
          console.log('Failed To Updated Users', error);
          _this.dialog.closeAll()
        }
      );
      
      // _this.excelService.organizationLogo = _this.sanitizer.bypassSecurityTrustUrl(base64data)
      // console.log("LOGO AFTER UPLOAD", _this.excelService.organizationLogo) 

      // _this.downloadLink.nativeElement.href = _this.excelService.organizationLogo;
      // _this.downloadLink.nativeElement.target = "_blank";
      // _this.downloadLink.nativeElement.download = "uploadedImage.png"
      // _this.downloadLink.nativeElement.click();
    }

  }

  clickOnFileInput(fileInput){
    fileInput.click();
  }

  hasError(field: string, error: string) {
    const control = this.form.get(field);
    return control.dirty && control.hasError(error);
  }

  submit() {
    const nickname = localStorage.getItem('nickname');
    if (!this.form.valid) {
      markAllAsDirty(this.form);
      return;
    }
    var postForm = new FormData();
    postForm.append('userid', nickname);
    postForm.append('email', this.email);
    postForm.append('firstname', this.firstname);
    postForm.append('lastname', this.lastname);
    postForm.append('contactnumber', this.contact);
    postForm.append('company', this.form.value.company);
    postForm.append('title', this.form.value.title);
    postForm.append('address', this.form.value.address);
    postForm.append('country', this.form.value.country);
    postForm.append('zipcode', this.form.value.zipcode);
    postForm.append('state', this.form.value.state);
    postForm.append('city', this.form.value.city);
    postForm.append('industry', this.form.value.industry);
    postForm.append('geography', this.form.value.geography);
    postForm.append('companysize', this.form.value.companysize);
    postForm.append('capatialization', this.form.value.capatialization);
    postForm.append('revenue', this.form.value.revenue);
    // postForm.append('logo', this.form.value.logo);
    console.log(JSON.stringify(postForm));

    postForm.forEach((value, key) => {
      console.log(key + ' ' + value);
    });

    this.inprogress = true;
    this.RMIAPIsService.uploadUserData(
      this.UrlConfigService.getuserDetailAPI(),
      postForm
    ).subscribe((res: any) => {
      this.inprogress = false;
    });
  }

  goToProfile(){
    this.router.navigate(['/profile'])
  }
}

export function markAllAsDirty(form: FormGroup) {
  for (const control of Object.keys(form.controls)) {
    form.controls[control].markAsDirty();
  }
}
export function resetForm(form: FormGroup) {
  form.reset({
    file: '',
  });
  form.get('file').markAsUntouched();
}
