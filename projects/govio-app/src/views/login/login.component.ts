import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Tools } from 'projects/tools/src/public-api';

@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss']
})
export class LoginComponent implements OnInit {

  model: any = { username: '', password: '' };
  loading = false;
  returnUrl: string = '/';
  error = null;
  errorCode = '';

  signup_disabled = true;

  config: any;

  version = '0.0.1';

  _formGroup: UntypedFormGroup = new UntypedFormGroup({});

  _title: string = '';
  _logo: string = '';
  _header: string = '';

  _version: string = 'v2';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private authenticationService: AuthenticationService,
    private configService: ConfigService
  ) {
    this.config = this.configService.getConfiguration();
  }

  ngOnInit() {
    // reset login status
    if (this.authenticationService.isLogged()) {
      this.authenticationService.logout().subscribe(response => {
        // console.log('logout', response);
      });
    }

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this._title = this.config.AppConfig.Layout.Login.title;
    this._logo = './assets/images/' + this.config.AppConfig.Layout.Login.logo;
    this._header = './assets/images/' + this.config.AppConfig.Layout.Login.header;

    this._initForm();

    // Clear MultiSnackbar
    Tools.MultiSnackbarDestroyAll();
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm() {
    this._formGroup = new UntypedFormGroup({
      username: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
      password: new UntypedFormControl('', [Validators.required, Validators.minLength(4)])
    });
  }

  login(value: any) {
    this.loading = true;
    this.authenticationService.login(value.username, value.password)
      .subscribe(
        (response: any) => {
          if (!this.returnUrl || this.returnUrl === '/') {
            this.returnUrl = '/dashboard';
          }

          this.authenticationService.setCurrentSession(response);
          this.authenticationService.reloadSession();

          this.router.navigate([this.returnUrl]);
          this.loading = false;
        },
        (error: any) => {
          this.error = error;
          this.errorCode = error.error.status;
          // console.log('login error', this.errorCode, error);
          this.loading = false;
        }
      );

    // Mockup
    // const response = {
    //   principal: '<MOCKER>',
    //   roles: ['govio_adm']
    // };
    // this.authenticationService.setCurrentSession(response);
    // this.authenticationService.reloadSession();
    // this.router.navigate(['/']);
  }

  _closeAlert() {
    this.error = null;
    this.errorCode = '';
  }
}
