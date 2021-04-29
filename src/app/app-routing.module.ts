import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthModule } from '@auth0/auth0-angular';
import { DefaultComponent } from './layouts/default/default.component';
import { StatementComponent } from './modules/statement/statement.component';
import { AddCompanyComponent } from './modules/add-company/add-company.component';
import { VisualsISComponent } from './modules/visuals-is/visuals-is.component';
import { PLMetricsComponent } from './modules/plmetrics/plmetrics.component';
import { VisualsBsComponent } from './modules/visuals-bs/visuals-bs.component';
import { BsmetricsComponent } from './modules/bsmetrics/bsmetrics.component';
import { KpiIsComponent } from './modules/kpi-is/kpi-is.component';
import { KpiBsComponent } from './modules/kpi-bs/kpi-bs.component';
import { AuthLoginComponent } from './auth-login/auth-login.component';
import { AppComponent } from './app.component';
import { AuthGuard } from './auth.guard';
import { ProfileComponent } from './modules/profile/profile.component';
import { UserDetailsComponent } from './modules/user-details/user-details.component';
import { CompanyDashboardComponent } from './modules/company-dashboard/company-dashboard.component';
import { CashmetricsComponent } from './modules/cashmetrics/cashmetrics.component';
import { VisualsCfComponent } from 'src/app/modules/visuals-cf/visuals-cf.component';
import { RatiosComponent } from './modules/ratios/ratios.component';
import { KpiCashflowComponent } from './modules/kpi-cashflow/kpi-cashflow.component';
import { UserManagementComponent } from './modules/user-management/user-management.component';
//import { ChargeBeeComponent } from './modules/charge-bee/charge-bee.component';
import { DcfComponent } from 'src/app/modules/dcf/dcf.component';
import { CompanyDetailsComponent } from 'src/app/modules/company-details/company-details.component';
import { CreditScorecardComponent } from 'src/app/modules/credit-scorecard/credit-scorecard.component';
import { ComparatorComponent } from 'src/app/modules/comparator/comparator.component';
import { SubscriptionComponent } from './modules/subscription/subscription.component';
import { ReportBuilderComponent } from 'src/app/modules/report-builder/report-builder.component';
const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: AuthLoginComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '',
    component: DefaultComponent,
    children: [
      {
        path: 'statement',
        component: StatementComponent,
        canActivate: [AuthGuard],
      },
	  {
		  path:'company',
		  component:CompanyDetailsComponent,
		  canActivate: [AuthGuard],
	  },
      {
        path: 'addcompany',
        component: AddCompanyComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'visualsIS',
        component: VisualsISComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'visualsBS',
        component: VisualsBsComponent,
        canActivate: [AuthGuard],
      },
       {
	  path:'comparator',
	  component:ComparatorComponent,
	  canActivate: [AuthGuard],
	  },

	{
        path: 'subscribe',
        component: SubscriptionComponent,
        canActivate: [AuthGuard],
      },
	  {
	  path: 'Users',
	  component:UserManagementComponent,
	  },
      {
        path: 'visualsCF',
        component: VisualsCfComponent,
       canActivate: [AuthGuard],
      },
      {
        path: 'cashmetrics',
        component: CashmetricsComponent,
       canActivate: [AuthGuard],
      },
      {
        path: 'IncomeStatementMetrics',
        component: PLMetricsComponent,
       canActivate: [AuthGuard],
      },
      {
        path: 'BalanceSheetMetrics',
        component: BsmetricsComponent,
       canActivate: [AuthGuard],
      },
      {
        path: 'KPIIncomeStatement',
        component: KpiIsComponent,
       canActivate: [AuthGuard],
      },
		  	   {
        path: 'report',
        component: ReportBuilderComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'KPIBalanceSheet',
        component: KpiBsComponent,
       canActivate: [AuthGuard],
      },
      {
        path: 'profile',
        component: ProfileComponent,
       canActivate: [AuthGuard],
      },
	  
	  
      {
        path: 'user',
        component: UserDetailsComponent,
       canActivate: [AuthGuard],
      },
	{
        path: 'scorecard',
        component: CreditScorecardComponent,
        canActivate: [AuthGuard],
      },
	  {
        path: 'dcf',
        component: DcfComponent,
      canActivate: [AuthGuard],
      },
      {
        path: ':companyName/dashboard/:scenario',
        component: CompanyDashboardComponent,
       canActivate: [AuthGuard],
      },
	  {
        path: 'KPICashflow',
        component: KpiCashflowComponent,
       canActivate: [AuthGuard],
      },
      {
        path: 'ratios',
        component: RatiosComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
