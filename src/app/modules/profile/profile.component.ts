import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ExcelService } from 'src/app/shared/excel.service';
import { AuthService } from '../../auth.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, AfterViewInit {
  nickname: any;
  email: any;
  picture: any;
  loggedInUserId;

  imageLoaded = false;

  currentUser;

  profileLoaded = false;

  @ViewChild('imgLink', { static: true }) imgLink: ElementRef;
  constructor(public authService: AuthService,
    private router : Router, 
    public excelService : ExcelService) {}

  ngOnInit(): void {
    // this.authService.userProfileSubject$.subscribe((res: any) => {
    //   console.log('res for profile', res);
    //   localStorage.setItem('nickname', res.nickname);
    //   localStorage.setItem('email', res.email);
    //   localStorage.setItem('picture', res.picture);
    // });
    
    if(this.authService.authServiceLoaded){
      this.nickname = localStorage.getItem('nickname');
      this.email = localStorage.getItem('email');
      this.loggedInUserId = localStorage.getItem('loggedInUserId');

      this.authService.getUserById(this.loggedInUserId).subscribe(
        (res) => {
          console.log('USER', res);
          this.currentUser = res.body;
          if (this.currentUser && this.currentUser.user_metadata) {
            if (
              this.currentUser.user_metadata &&
              this.currentUser.user_metadata.picture
            ) {
              this.picture = this.currentUser.user_metadata.picture;
              this.authService.userPicture = this.picture;
              this.imageLoaded = true;
              this.profileLoaded = true;
            } else {
              this.picture = localStorage.getItem('picture');
              this.authService.userPicture = this.picture;
              this.imageLoaded = true;
              this.profileLoaded = true;

            }
          } else {
            this.picture = localStorage.getItem('picture');
            this.authService.userPicture = this.picture;
            this.imageLoaded = true;
            this.profileLoaded = true;

          }
        },
        (error) => {
          console.log(error);
          this.picture = localStorage.getItem('picture');
          this.authService.userPicture = this.picture;
          this.imageLoaded = true;
          this.profileLoaded = true;
        }
      );
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

  ngAfterViewInit() {
    // this.imgLink.nativeElement.src = this.authService.userPicture;
    // this.imgLink.nativeElement.style.height = '180px';
    // this.imgLink.nativeElement.style.width = '180px';
  }

  clickOnFileInput(fileInput) {
    fileInput.click();
  }

  checkForAccessibility(){
    if(this.authService.currentUserRoles?.indexOf('Admin') >= 0 || this.authService.currentUserRoles?.indexOf('SuperAdmin') >= 0){
      this.router.navigate(['/Users']);
    }
    else{
      const message = "You need to be an Admin or Super Admin to access User Details";
      this.excelService.showMessage(message, "Cancel", '450px', '140px')
    }
  }

  selectFile(event) {
    if (!event.target.files[0] || event.target.files[0].length == 0) {
      // this.msg = 'You must select an image';
      return;
    }

    let mimeType = event.target.files[0].type;

    if (mimeType.match(/image\/*/) == null) {
      // this.msg = "Only images are supported";
      return;
    }

    let reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);

    reader.onload = (_event) => {
      this.picture = reader.result;
      this.authService.userPicture = this.picture;
      let body = {};
      if (this.currentUser && this.currentUser.user_metadata) {
        body = {
          user_metadata: this.currentUser.user_metadata,
        };

        body['user_metadata']['picture'] = this.authService.userPicture;
      } else {
        body = {
          user_metadata: {
            picture: this.authService.userPicture,
          },
        };
      }

      this.authService.updateUsers(body, this.loggedInUserId).subscribe(
        (res) => {
          console.log('Upadted user Succes', res);
        },
        (error) => {
          console.log('Failed To Updated Users', error);
        }
      );
      console.log(this.picture);
      let image = new Image();
      image.src = this.authService.userPicture;

      // const _this = this;
      // image.onload = function () {
      //   //Determine the Height and Width.
      //   console.log(this);

      //   _this.imgLink.nativeElement.src = _this.authService.userPicture;
      //   _this.imgLink.nativeElement.style.height = '180px';
      //   _this.imgLink.nativeElement.style.width = '180px';
      // };
    };
  }
}
