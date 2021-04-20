import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class UrlConfigService {
  private statementAPI = `${environment.APIHost}statements?employer=`;
  private deleteStatementAPI = `${environment.APIHost}deletestatement?companyname=`;
  private downloadStatementAPI = `${environment.APIHost}download_file?companyname=`;
  private uploadStatementAPI = `${environment.APIHost}upload_file`;
  private isActualsAPI = `${environment.APIHost}actuals?company=`;
  private scenarioAPI = `${environment.APIHost}scenarios?company=`;
  private cashscenarioAPI = `${environment.APIHost}cashflow-scenarios?company=`;
  private isProjectionsAPIGET = `${environment.APIHost}projections?company=`;
  private bsActualsAPI = `${environment.APIHost}balance-actuals?company=`;
  private bsProjectionsAPIGET = `${environment.APIHost}balance-projections?company=`;
  private isKPIActuals = `${environment.APIHost}kpi-pnl-actuals?company=`;
  private isKPIProjections = `${environment.APIHost}kpi-pnl-projections?company=`;
  private bsKPIActuals = `${environment.APIHost}kpi-bs-actuals?company=`;
  private cashActualsAPI = `${environment.APIHost}cashflow-actuals?company=`;
  private cashProjectionsAPI = `${environment.APIHost}cashflow-projections?company=`;
  private bsKPIProjections = `${environment.APIHost}kpi-bs-projections?company=`;
  private userDetailAPI = `${environment.APIHost}updateprofile`;
  private userProfileDetailAPI = `${environment.APIHost}userprofiledetails?userid=`;
  private getTopCompanies = `${environment.APIHost}dashboard`;
  private cashKPIProjections = `${environment.APIHost}kpi-cfs-projections?company=`;
  private cashKPIActuals = `${environment.APIHost}kpi-cfs-actuals?company=`;
   private UserByAdmin = `${environment.APIHost}getUsersByAdmin?admin=`;
    private UserByAdminPOST = `${environment.APIHost}updateusers?admin=`;
	private DCFAPI = `${environment.APIHost}dcf-valuation?company=`;
	private getcompany = `${environment.APIHost}dcf-companies?company=`;
	private deleteuser=`${environment.APIHost}deleteusers?inviteduser=`;
 private DCFAPIPOST = `${environment.APIHost}dcf-valuation?company=`;
   private dcfscenarioAPI = `${environment.APIHost}dcf-scenarios?company=`;
 private benchmarkingActualsAPI = `${environment.APIHost}benchmarking-actuals?company=`;
   private benchmarkingProjectionsAPI = `${environment.APIHost}benchmarking-projections?company=`;
private creditScoreCardAPI = `${environment.APIHost}financial-scorecard?company=`;
private getLogoAPI = `${environment.APIHost}image?email=`;
private sendLogoAPI = `${environment.APIHost}upload_image`;




  constructor(private http: HttpClient) {}
	getdcfCompaniesAPI()
	{
	return this.getcompany;
	}

  GetLogoAPI(){
    return this.getLogoAPI;
  }

  PostLogoAPI(){
    return this.sendLogoAPI;
  }

	
	getdeleteAPI()
	{
	return this.deleteuser;
	}
	getUserAdminAPI() {
    return this.UserByAdmin;
  }
  PostUserAdminAPI() {
    return this.UserByAdminPOST;
  }
  getStatementAPI() {
    return this.statementAPI;
  }
   getdcfPOST () {
    return this.DCFAPIPOST;
  }
   getdcfscenarioAPI () {
    return this.dcfscenarioAPI;
  }
  getDCFAPI() {
    return this.DCFAPI;
  }
getCreditScoreCardAPI(){
   return this.creditScoreCardAPI;
 }
  getDeleteStatementAPI() {
    return this.deleteStatementAPI;
  }
  getDownloadStatementAPI() {
    return this.downloadStatementAPI;
  }
  getuploadStatementAPI() {
    return this.uploadStatementAPI;
  }

getBenchmarkingActualsAPI(){
    return this.benchmarkingActualsAPI;
  }
  getBenchmarkingProjectionsAPI(){
    return this.benchmarkingProjectionsAPI;
  }
  getIsActualsAPI() {
    return this.isActualsAPI;
  }
  getIsProjectionsAPIGET() {
    return this.isProjectionsAPIGET;
  }
  getIsProjectionsAPIPOST() {
    return this.isProjectionsAPIGET;
  }
  getScenarioAPI() {
    return this.scenarioAPI;
  }
  getBsActualsAPI() {
    return this.bsActualsAPI;
  }
  getBsProjectionsAPIGET() {
    return this.bsProjectionsAPIGET;
  }
  getBsProjectionsAPIPOST() {
    return this.bsProjectionsAPIGET;
  }
   getKPICashProjections() {
    return this.cashKPIProjections;
  }
  getKPICashActuals() {
    return this.cashKPIActuals;
  }
  getIsKPIActuals() {
    return this.isKPIActuals;
  }
  getIsKPIProjections() {
    return this.isKPIProjections;
  }
  getBsKPIActuals() {
    return this.bsKPIActuals;
  }
  getBsKPIProjections() {
    return this.bsKPIProjections;
  }
  getuserDetailAPI() {
    return this.userDetailAPI;
  }
  getCashActualsAPI() {
    return this.cashActualsAPI;
  }
  getCashProjectionsAPIGET() {
    return this.cashProjectionsAPI;
  }
  getCashProjectionsAPIPOST() {
    return this.cashProjectionsAPI;
  }
  getCashScenarioAPI() {
    return this.cashscenarioAPI;
  }
  getuserProfileDetail() {
    return this.userProfileDetailAPI;
  }
  getTopCompaniesAPI() {
    return this.getTopCompanies;
  }
}
