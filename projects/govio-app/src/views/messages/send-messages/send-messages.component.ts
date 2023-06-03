import { AfterContentChecked, Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { v4 as uuidv4 } from 'uuid';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';

import { SendMessage } from './send-message';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import moment from 'moment';

@Component({
  selector: 'app-send-messages',
  templateUrl: 'send-messages.component.html',
  styleUrls: ['send-messages.component.scss']
})
export class SendMessagesComponent implements OnInit, AfterContentChecked {
  static readonly Name = 'SendMessagesComponent';
  readonly model: string = 'messages';

  @ViewChild('templateInfo') templateInfo!: any;

  config: any = null;
  templateConfig: any;

  appConfig: any;

  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _message: SendMessage = new SendMessage({});

  _error: boolean = false;
  _errorMsg: string = '';

  _sender: any = null;
  _serviceInstance: any = null;
  _organization: any = null;
  _service: any = null;
  _template: any = null;

  _spin: boolean = false;
  desktop: boolean = false;

  breadcrumbs: any[] = [];

  minLengthTerm = 1;

  organizations$!: Observable<any[]>;
  organizationsInput$ = new Subject<string>();
  organizationsLoading: boolean = false;
  organizationSelected$!: any;

  services$!: Observable<any[]>;
  servicesInput$ = new Subject<string>();
  servicesLoading: boolean = false;
  serviceSelected$!: any;

  serviceInstances$!: Observable<any[]>;
  serviceInstancesInput$ = new Subject<string>();
  serviceInstancesLoading: boolean = false;
  serviceInstancesSelected$!: any;

  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
  _serviceLogoPlaceholder: string = './assets/images/service-placeholder.png';

  _singleColumn: boolean = false;
  
  _modalInfoRef!: BsModalRef;
  
  _currentTemlplateId: number = 0;
  _loadingTemplatePlacehoder: boolean = false;
  _templatePlaceholders: any[] = [];

  _sending: boolean = false;
  _sendLoading: boolean = false;
  _errorSending: boolean = false;
  _errorsSendingMsg: any[] = [];
  _sendingReport: any[] = [];
  
  _dataSending: any = null;
  _recipients: any[] = [];
  _recipientsCount: number = 0;
  _recipientsValidCount: number = 0;
  _recipientsInvalidCount: number = 0;
  _progressCount: number = 0;
  _sendedMessagesCount: number = 0;
  _errorMessagesCount: number = 0;
  
  _markAsteriskUpdated: boolean = true;

  _debugSending: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
    private tools: Tools,
    private eventsManagerService: EventsManagerService,
    private apiService: OpenAPIService
  ) {
    this.appConfig = this.configService.getConfiguration();
  }

  ngOnInit() {
    this._initBreadcrumb();
    this._spin = true;
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.config = config;
        this._singleColumn = config.editSingleColumn || false;
        
        this._initForm({ ...this._message });
        setTimeout(() => {
          this._initOrganizationsSelect([]);
          this._initServicesSelect([]);
          // this._initServiceInstancesSelect([]);
        }, 500);
        this._spin = false;
      }
    );

    this.configService.getConfig('templates').subscribe(
      (config: any) => {
        this.templateConfig = config;
      }
    );
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _queryToHttpParams(query: any) : HttpParams {
    let httpParams = new HttpParams();

    Object.keys(query).forEach(key => {
      if (query[key]) {
        switch (key)
        {
          default:
            httpParams = httpParams.set(key, query[key]);
        }
      }
    });
    
    return httpParams; 
  }

  _initBreadcrumb() {
    const _title = this.translate.instant('APP.TITLE.SendMessages');
    this.breadcrumbs = [
      { label: '', url: '', type: 'title', iconBs: 'send' },
      { label: 'APP.TITLE.Messages', url: '/messages', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _hasControlError(name: string) {
    return (this.f[name].errors && this.f[name].touched);
  }

  _hasControlValue(name: string) {
    return (this.f[name] && this.f[name].value);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm(data: any = null) {
    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'organization_id':
          case 'service_id':
          case 'taxcode':
          case 'scheduled_expedition_date':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [Validators.required]);
            break;
          case 'service_instance':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl({ value: value, disabled: true }, [Validators.required]);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });
      this._formGroup = new UntypedFormGroup(_group);
    }
  }

  _onSend(body: any) {
    this._error = false;
    this._prepareData(body);
    this._sendMessages(1);
  }

  _prepareData(body: any) {
    this._recipients = [];
    this._sendingReport = [];
    this._sendedMessagesCount = 0;
    this._errorMessagesCount = 0;
    this._recipientsInvalidCount = 0;

    const _scheduled_expedition_date = moment(body.scheduled_expedition_date.valueOf()).utc().format();
    const _due_date = moment(body.due_date.valueOf()).utc().format();

    const _body: any = {
      taxcode: '',
      payment: null,
      email: null,
      scheduled_expedition_date: _scheduled_expedition_date,
      due_date: _due_date,
      placeholders: []
    };

    if (this.serviceInstancesSelected$.template.has_payment) {
      _body.payment = {
        amount: body.amount,
        notice_number: body.notice_number,
        invalid_after_due_date: this.serviceInstancesSelected$.template.has_due_date,
        payee_taxcode: this.organizationSelected$.tax_code
      };
    }

    this._templatePlaceholders.forEach((item: any) => {
      _body.placeholders.push({
          name: item.name,
          value: this._formGroup.controls[item.name].value
        });
    });

    this._recipients = body.taxcode.split(',').map((item: string) => {
      const data: any = { ..._body };
      data.taxcode = item;
      const _valid = this.validaCodiceFiscale(item);
      return {
        taxcode: item,
        service_instance: this.serviceInstancesSelected$.id,
        idempotency_key: uuidv4(),
        data: data,
        valid: _valid,
        sended: false,
        response: null,
        error: _valid ? null : 'Codice Fiscale errato'
      };
    });

    this._dataSending = _body;

    this._recipientsCount = this._recipients.length;
    this._recipientsValidCount = this._recipients.reduce((acc, cur) => cur.valid ? ++acc : acc, 0);

    this._sending = true;
  }

  _onCancelSend() {
    this.router.navigate([this.model]);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _orgLogoBackground = (item: any): string => {
    let logoUrl = this._organizationLogoPlaceholder;
    if (item && item._links && item._links['logo-miniature']) {
      logoUrl = item._links['logo-miniature'].href;
    } else {
      if (item && item.logo_small) {
        logoUrl = item.logo_small;
      }
    }
    return `url(${logoUrl})`;
  };

  _serviceLogoBackground = (item: any): string => {
    let logoUrl = this._serviceLogoPlaceholder;
    if (item && item._links && item._links['logo-miniature']) {
      logoUrl = item._links['logo-miniature'].href;
    } else {
      if (item && item.logo_small) {
        logoUrl = item.logo_small;
      }
    }
    return `url(${logoUrl})`;
  };

  trackByFn(item: any) {
    return item.id;
  }

  _initOrganizationsSelect(defaultValue: any[] = []) {
    this.organizations$ = concat(
      of(defaultValue),
      this.organizationsInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.organizationsLoading = true),
        switchMap((term: any) => {
          return this.getData('organizations', term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.organizationsLoading = false)
          )
        })
      )
    );
  }

  _initServicesSelect(defaultValue: any[] = []) {
    this.services$ = concat(
      of(defaultValue),
      this.servicesInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.servicesLoading = true),
        switchMap((term: any) => {
          return this.getData('services', term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.servicesLoading = false)
          )
        })
      )
    );
  }

  _initServiceInstancesSelect(defaultValue: any[] = []) {
    this.serviceInstances$ = concat(
      of(defaultValue),
      this.serviceInstancesInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.serviceInstancesLoading = true),
        switchMap((term: any) => {
          return this.getData_('service-instances', term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.serviceInstancesLoading = false)
          )
        })
      )
    );
  }

  getData_(model: string, term: string | null = null): Observable<any> {
    const _organization_id: number = this._formGroup.controls['organization_id'].value;
    const _service_id: number = this._formGroup.controls['service_id'].value;

    const _options: any = { params: { q: term, limit: 100, embed: ['service','organization','template'] } };
    if (_organization_id) {
      _options.params.organization_id = _organization_id;
    }  
    if (_service_id) {
      _options.params.service_id = _service_id;
    }  

    return this.apiService.getList(model, _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.items.map((item: any) => {
            item.organization = item._embedded.organization;
            item.organization_name = item._embedded.organization.legal_name;
            item.service = item._embedded.service;
            item.service_name = item._embedded.service.service_name;
            item.template = item._embedded.template;
            item.template_name = item._embedded.template.name;
            item.template_description = item._embedded.template.description;
            item.label = `${item.template_name}`;
            // item.disabled = true;
            return item;
          });
          return _items;
        }
      })
      );
  }

  getData(model: string, term: any = null): Observable<any> {
    let _options: any = { params: { limit: 100 } };
    if (term) {
      if (typeof term === 'string' ) {
        _options.params =  { ..._options.params, q: term };
      }
      if (typeof term === 'object' ) {
        _options.params =  { ..._options.params, ...term };
      }
    }

    return this.apiService.getList(model, _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.items.map((item: any) => {
            // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
            return item;
          });
          return _items;
        }
      })
      );
  }

  onChangeValue() {
    if (this._hasControlValue('organization_id') && this._hasControlValue('service_id')) {
      this._formGroup.controls['service_instance'].enable();
    } else {
      this._formGroup.controls['service_instance'].disable();
    }
    this._initServiceInstancesSelect([]);
    this._formGroup.controls['service_instance'].setValue(null);
    this._formGroup.controls['service_instance'].updateValueAndValidity();
    this.serviceInstancesSelected$ = null;
    this._formGroup.updateValueAndValidity();
    this._removeControls();
  }

  onChangeOrganization(event: any) {
    this.organizationSelected$ = event;
    this.onChangeValue();
  }
  
  onChangeService(event: any) {
    this.serviceInstances$ = event;
    this.onChangeValue();
  }

  onChangeServiceInstance(event: any) {
    this._removeControls();

    this._markAsteriskUpdated = false;
    this.serviceInstancesSelected$ = event;

    if (this.serviceInstancesSelected$) {
      this._loadingTemplatePlacehoder = true;
      this.apiService.getList(`templates/${this.serviceInstancesSelected$.template_id}/placeholders?embed=placeholder`).subscribe({
        next: (response: any) => {
          this._templatePlaceholders = response.items.map((item: any) => {
            return {
              id: item._embedded.placeholder.id,
              position: item.position,
              name: item._embedded.placeholder.name,
              description: item._embedded.placeholder.description,
              example: item._embedded.placeholder.example,
              type: item._embedded.placeholder.type,
              mandatory: item.mandatory,
              pattern: item._embedded.placeholder.pattern
            };
          });
  
          if (this.serviceInstancesSelected$.template.has_due_date) {
            this._formGroup.controls['due_date'].setValidators(Validators.required);
          } else {
            this._formGroup.controls['due_date'].removeValidators([]);
          }
          this._formGroup.controls['due_date'].updateValueAndValidity();
          if (this.serviceInstancesSelected$.template.has_payment) {
            this._formGroup.controls['notice_number'].setValidators(Validators.required);
            this._formGroup.controls['amount'].setValidators(Validators.required);
          } else {
            this._formGroup.controls['notice_number'].removeValidators([]);
            this._formGroup.controls['amount'].removeValidators([]);
          }
          this._formGroup.controls['amount'].updateValueAndValidity();
  
          this._templatePlaceholders.forEach((item: any) => {
            let dCtrl = new FormControl(item.name);
            this._formGroup.addControl(item.name, dCtrl);
            dCtrl.setValue('');
            const _validators = [];
            if (item.mandatory) { _validators.push(Validators.required); }
            if (item.pattern) { _validators.push(Validators.pattern(item.pattern)); }
            dCtrl.setValidators(_validators);
            dCtrl.updateValueAndValidity();
          });
          this._formGroup.updateValueAndValidity();
          this._loadingTemplatePlacehoder = false;
          this._markAsteriskUpdated = true;
        },
        error: (error: any) => {
          this._errorMsg = Tools.GetErrorMsg(error);
          this._loadingTemplatePlacehoder = false;
          this._markAsteriskUpdated = true;
        }
      });
    } else {
      this._formGroup.controls['due_date'].removeValidators([]);
      this._formGroup.controls['notice_number'].removeValidators([]);
      this._formGroup.controls['amount'].removeValidators([]);
      this._formGroup.controls['due_date'].updateValueAndValidity();
      this._formGroup.controls['notice_number'].updateValueAndValidity();
      this._formGroup.controls['due_date'].updateValueAndValidity();
    }
  }

  _removeControls() {
    this._templatePlaceholders.forEach((item: any) => {
      this._formGroup.removeControl(item.nome);
    });
    this._formGroup.updateValueAndValidity();
    this._templatePlaceholders = [];
  }

  openTemplateInfo() {
    this._currentTemlplateId = this.serviceInstancesSelected$.template_id
    this._modalInfoRef = this.modalService.show(this.templateInfo, {
      ignoreBackdropClick: false,
      class: 'modal-lg'
    });
  }

  closeModal(){
    this._modalInfoRef.hide();
  }

  _exportReport(){
    const _reportArr = this._sendingReport.map((item: any) => {
      return {
        taxcode: item.taxcode,
        service_instance: item.service_instance,
        idempotency_key: item.idempotency_key,
        valid: item.valid,
        sended: item.sended,
        message_id: item.sended ? item.response.id : null,
        subject: item.sended ? item.response.subject : null,
        messaggio: item.sended ? item.response.markdown : null,
        error: item.error,
      };
    });
    Tools.DownloadCSVFile(_reportArr, 'ReportSpedizioneMessaggi');
  }

  _sendMessage(data: any) {
    const _body = { ...data.data };

    this._sendLoading = true;
    const _url = `${this.model}?service_instance=${data.service_instance}&idempotency_key=${data.idempotency_key}`;
    this.apiService.saveElement(_url, _body).subscribe(
      (response: any) => {
        this._sendLoading = false;

        if (this._recipientsCount === 1) {
          this.router.navigate(['messages', response.id]);
        } else {
          data.sended = true;
          data.error = null;
          data.response = response;
          this._sendingReport.push(data);
          this._sendMessages(this._progressCount + 1);
        }
      },
      (error: any) => {
        this._errorSending = true;
        this._errorsSendingMsg.push({ body: _body, message: Tools.GetErrorMsg(error) });
        this._sendLoading = false;

        data.sended = false;
        data.error = Tools.GetErrorMsg(error);
        this._sendingReport.push(data);
        this._sendMessages(this._progressCount + 1);
      }
    );
  }

  _sendMessages(count: number) {
    const _recipient = this._recipients[count - 1];
    if (_recipient) {
      this._progressCount = count;
      if (_recipient.valid) {
        // Send message
        if (this._debugSending) {
          _recipient.sended = true;
          _recipient.error = null;
          this._sendingReport.push(_recipient);
          setTimeout(() => {
            this._sendMessages(this._progressCount + 1);
          }, 1000);
        } else {
          this._sendMessage(_recipient);
        }
      } else {
        this._sendingReport.push(_recipient);
        setTimeout(() => {
          this._sendMessages(this._progressCount + 1);
        }, this._debugSending ? 1000 : 0);
      }
    } else {
      this._sendedMessagesCount = this._recipients.reduce((acc, cur) => cur.sended ? ++acc : acc, 0);
      this._errorMessagesCount = this._recipients.reduce((acc, cur) => (!cur.sended && cur.error && cur.valid) ? ++acc : acc, 0);
      this._recipientsInvalidCount = this._recipientsCount - this._recipientsValidCount;
    }
  }

  // Utilities

  validaCodiceFiscale(cf: string) {
    var validi, i, s, set1, set2, setpari, setdisp;
    if (cf == '') return '';
    cf = cf.toUpperCase();
    if (cf.length != 16)
      return false;
    validi = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (i = 0; i < 16; i++) {
      if (validi.indexOf(cf.charAt(i)) == -1)
        return false;
    }
    set1 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    set2 = "ABCDEFGHIJABCDEFGHIJKLMNOPQRSTUVWXYZ";
    setpari = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    setdisp = "BAKPLCQDREVOSFTGUHMINJWZYX";
    s = 0;
    for (i = 1; i <= 13; i += 2)
      s += setpari.indexOf(set2.charAt(set1.indexOf(cf.charAt(i))));
    for (i = 0; i <= 14; i += 2)
      s += setdisp.indexOf(set2.charAt(set1.indexOf(cf.charAt(i))));
    if (s % 26 != cf.charCodeAt(15) - 'A'.charCodeAt(0))
      return false;
    return true;
  }
}
