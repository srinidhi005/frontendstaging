import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpResponse,
  HttpHeaders,
} from "@angular/common/http";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";
import { pipe } from "rxjs";
import { filter, map } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class RMIAPIsService {
  data: Object[];
  GETheaders: any;
  POSTheaders: any;
  uploadHeaders: any;
  constructor(private http: HttpClient) {
    this.GETheaders = new HttpHeaders({
      "Content-Type": "application/json",
      "Content-Encoding": "none",
      authorization: "Basic cm1pX3VzZXI6cm1pMzIxIUAj",
      "cache-control": "no-cache",
      "postman-token": "648dcbfa-30ef-3359-f29a-31b2038f29ac",
    });
    this.uploadHeaders = new HttpHeaders({
      authorization: "Basic cm1pX3VzZXI6cm1pMzIxIUAj",
    });
    this.POSTheaders = new HttpHeaders({
      authorization: "Basic cm1pX3VzZXI6cm1pMzIxIUAj",
      "Content-Type": "application/json",
    });
  }

  getData(url: string) {
    if (!url.startsWith("http")) {
      url = `${environment.APIHost}${url}`;
    }
    return this.http.get(url, { headers: this.GETheaders }).pipe(
      catchError((err) => {
        console.log("Handling error getData", err);
        return throwError(err);
      })
    );
  }

  getLogo(url){
    return this.http.get(url, { headers: this.uploadHeaders, responseType: 'blob' }).pipe(
      catchError((err) => {
        console.log("Handling error getData", err);
        return throwError(err);
      })
    );
  }

  saveLogo(url, input: File, email){
    const formData = new FormData();
    formData.append('file', input);
    formData.append('email', email);

    // const headers = this.POSTheaders;
    // headers.append('Content-Type', 'multipart/form-data');    
    return this.http.post(url, formData, { headers: this.uploadHeaders }).pipe(
      catchError((err) => {
        console.log("Handling error getData", err);
        return throwError(err);
      })
    );
  }
  
  uploadData(url: string, input: Object) {
    return this.http.post(url, input, { headers: this.uploadHeaders }).pipe(
      catchError((err) => {
        console.log("Handling error getData", err);
        return throwError(err);
      })
    );
  }
  uploadUserData(url: string, input: Object) {
    return this.http.post(url, input, { headers: this.uploadHeaders }).pipe(
      catchError((err) => {
        console.log("Handling error getData", err);
        return throwError(err);
      })
    );
  }
  postData(url: string, input: Object) {
    return this.http.post(url, input, { headers: this.POSTheaders }).pipe(
      catchError((err) => {
        console.log("Handling error getData", err);
        return throwError(err);
      })
    );
  }
}
export function toResponseBody<T>() {
  return pipe(
    filter((event: HttpEvent<T>) => event.type === HttpEventType.Response),
    map((res: HttpResponse<T>) => res.body)
  );
}
const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

export const abbreviateNumber = (number: number): string => {
  // what tier? (determines SI symbol)
  const tier = (Math.log10(number) / 3) | 0;

  // if zero, we don't need a suffix
  if (!tier) {
    return number.toString();
  }

  // get suffix and determine scale
  const suffix = SI_SYMBOL[tier];
  const scale = Math.pow(10, tier * 3);

  // scale the number
  const scaled = number / scale;

  // format number and add suffix
  return scaled.toFixed(1) + suffix;
};
