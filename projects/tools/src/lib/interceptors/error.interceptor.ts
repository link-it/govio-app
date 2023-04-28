import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

import { Tools } from '../tools.service';
import { PageloaderService } from '../pageloader.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private translate: TranslateService,
    private pageloaderService: PageloaderService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      if ([401].indexOf(err.status) !== -1) {
        Tools.OnError(err, this.translate.instant('APP.MESSAGE.ERROR.Unauthorized'));
        window.parent.postMessage({
          from: 'GovIO',
          action: 'logout',
          message: 'APP.MESSAGE.ERROR.Unauthorized'
        },'*');
        // setTimeout(() => {
        //   this.router.navigate(['/auth/login']);
        // }, 500);
      }

      if ([403].indexOf(err.status) !== -1) {
        Tools.OnError(err, this.translate.instant('APP.MESSAGE.ERROR.Unauthorized'));
      }

      if ([400, 422].indexOf(err.status) !== -1) {
        // console.log('logout', err.status, err);
      }

      this.pageloaderService.hideLoader();

      const error = { message: err.message || err.statusText, error: err.error };
      return throwError(error);
    }));
  }
}
