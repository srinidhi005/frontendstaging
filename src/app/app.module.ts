import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatOptionModule,
  MatSelectModule,
  MatRadioModule,
} from '@angular/material';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthLoginComponent } from './auth-login/auth-login.component';
import { DefaultModule } from './layouts/default/default.module';
import { AddCompanyComponent } from './modules/add-company/add-company.component';
import { FileUploadComponent } from './modules/file-upload/file-upload.component';
import { LoginComponent } from './modules/login/login.component';
//import { ProfileComponent } from './modules/profile/profile.component';
import { RMIAPIsService } from './shared/rmiapis.service';
import { UrlConfigService } from './shared/url-config.service';
import { UserManagementComponent } from './modules/user-management/user-management.component';
import {NgxPaginationModule} from 'ngx-pagination';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
//import { SubscriptionComponent } from './modules/subscription/subscription.component';
//import { MessagePopupComponent } from './modules/message-popup/message-popup.component';
declare var Chargebee: any;

@NgModule({
  declarations: [
    AppComponent,
    AddCompanyComponent,
    FileUploadComponent,
    LoginComponent,
    AuthLoginComponent,
   // ProfileComponent,
    UserManagementComponent,
  // SubscriptionComponent,
  // MessagePopupComponent,
   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DefaultModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    NgxPaginationModule,
    MatIconModule,
    MatCardModule,
    MatRadioModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatGridListModule,
    MatExpansionModule,
    NgbModule,
  ],
  providers: [UrlConfigService, RMIAPIsService],
  bootstrap: [AppComponent],
})
export class AppModule {
constructor() {
     const el = document.createElement('script')
    el.onload = () => {
      var chargebeeInstance = Chargebee.init({
        site: "rmiinsights-test"
      });
      let cbInstance = Chargebee.getInstance()
     
    }
    el.setAttribute('src', 'https://js.chargebee.com/v2/chargebee.js')
    document.body.appendChild(el)
  }
}
