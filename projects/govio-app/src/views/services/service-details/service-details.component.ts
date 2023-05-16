import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';
import { FieldClass } from 'projects/link-lab/src/lib/it/link/classes/definitions';

import { YesnoDialogBsComponent } from 'projects/components/src/lib/dialogs/yesno-dialog-bs/yesno-dialog-bs.component';

import { ServiceInstance } from './service-instance';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap } from 'rxjs/operators';

import * as jsonpatch from 'fast-json-patch';

@Component({
  selector: 'app-service-details',
  templateUrl: 'service-details.component.html',
  styleUrls: ['service-details.component.scss']
})
export class ServiceDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServiceDetailsComponent';
  readonly model: string = 'service-instances';

  @Input() id: number | null = null;
  @Input() service: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('templateInfo') templateInfo!: any;

  appConfig: any;
  templateConfig: any;

  hasTab: boolean = true;
  tabs: any[] = [
    { label: 'Details', icon: 'details', link: 'details', enabled: true }
  ];
  _currentTab: string = 'details';

  _informazioni: FieldClass[] = [];

  _isDetails = true;

  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _service: ServiceInstance = new ServiceInstance({});

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';

  _modalConfirmRef!: BsModalRef;

  minLengthTerm = 1;

  rService: any = null;
  _servicesData: any[] = [];
  services$!: Observable<any[]>;
  servicesInput$ = new Subject<string>();
  servicesLoading: boolean = false;
  
  organization: any = null;
  _organizationsData: any[] = [];
  organizations$!: Observable<any[]>;
  organizationsInput$ = new Subject<string>();
  organizationsLoading: boolean = false;
  
  template: any = null;
  _templatesData: any[] = [];
  templates$!: Observable<any[]>;
  templatesInput$ = new Subject<string>();
  templatesLoading: boolean = false;
  _currentTemlplateId: number = 0;

  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
  _serviceLogoPlaceholder: string = './assets/images/service-placeholder.png';

  _singleColumn: boolean = false;

  _modalInfoRef!: BsModalRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
    public tools: Tools,
    public eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService
  ) {
    this.appConfig = this.configService.getConfiguration();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.id = params['id'];
        this._initBreadcrumb();
        this._isDetails = true;
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.config = config;
            this._singleColumn = config.editSingleColumn || false;
            this._translateConfig();
            this._loadAll();
          }
        );
      } else {
        this._isNew = true;
        this._isEdit = true;

        this._initBreadcrumb();
        // this._loadAnagrafiche();

        if (this._isEdit) {
          this._initForm({ ...this._service });
          setTimeout(() => {
            this._initOrganizationsSelect([]);
            this._initServicesSelect([]);
            this._initTemplatesSelect([]);
          }, 500);
        } else {
          this._loadAll();
        }
      }
    });

    this.configService.getConfig('templates').subscribe(
      (config: any) => {
        this.templateConfig = config;
      }
    );
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this._loadAll();
    }
    if (changes.service) {
      const service = changes.service.currentValue;
      this.service = service.source;
      this.id = this.service.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadService();
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
          case 'service_id':
          case 'organization_id':
          case 'template_id':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl({value: value, disabled: !this._isNew}, [Validators.required]);
            break;
          case 'io_service_id':
          case 'apiKey':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [Validators.required]);
            break;
          case 'enabled':
            value = data[key] ? data[key] : false;
            _group[key] = new UntypedFormControl(value, []);
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

  __onSave(body: any) {
    this._error = false;
    delete body.id;
    this.apiService.saveElement(this.model, body).subscribe(
      (response: any) => {
        this.service = new ServiceInstance({ ...response });
        this._service = new ServiceInstance({ ...response });
        this.id = this.service.id;
        this._initBreadcrumb();
        this._onCancelEdit();
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._spin = false;
      }
    );
  }

  __removeEmpty(obj: any) {
    const $this = this;
    return Object.keys(obj)
      .filter(function (k) {
        return ( obj[k] != null && typeof obj[k] !== "object");
      })
      .reduce(function (acc: any, k: string) {
        acc[k] = typeof obj[k] === "object" ? $this.__removeEmpty(obj[k]) : obj[k];
        return acc;
      }, {});
  }

  __onUpdate(id: number, body: any) {
    this._error = false;
    const _rawBody: any = this._formGroup.getRawValue();
    const _service = this.__removeEmpty(this.service);
    const _body = this.__removeEmpty(_rawBody);
    const _bodyPatch: any[] = jsonpatch.compare(_service, _body);
    if (_bodyPatch) {
      this.apiService.updateElement(this.model, id, _bodyPatch).subscribe(
        (response: any) => {
          this._isEdit = !this._closeEdit;
          this.service = new ServiceInstance({ ...response });
          this._service = new ServiceInstance({ ...response });
          this.id = this.service.id;
          this.save.emit({ id: this.id, payment: response, update: true });
        },
        (error: any) => {
          this._error = true;
          this._errorMsg = Tools.GetErrorMsg(error);
        }
      );
    } else {
      console.log('No difference');
    }
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(this.service.id, form);
      }
    }
  }

  _deleteService() {
    const initialState = {
      title: this.translate.instant('APP.TITLE.Attention'),
      messages: [
        this.translate.instant('APP.MESSAGE.AreYouSure')
      ],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.BUTTON.Confirm'),
      confirmColor: 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          this.apiService.deleteElement(this.model, this.service.id).subscribe(
            (response) => {
              this.save.emit({ id: this.id, service: response, update: false });
            },
            (error) => {
              this._error = true;
              this._errorMsg = Tools.GetErrorMsg(error);
            }
          );
        }
      }
    );
  }
  
  _loadService() {
    if (this.id) {
      this._spin = true;
      this.service = null;
      let aux: any = { params: this._queryToHttpParams({ embed: ['service','organization','template'] }) };
      this.apiService.getDetails(this.model, this.id, '', aux).subscribe({
        next: (response: any) => {
          this.service = this.__prepareServiceData(response); // new ServiceInstance({ ...response });
          this._service = new ServiceInstance({ ...response });
          // this.loadCurrentData();
          this._spin = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  __prepareServiceData(service: any) {
    const _service: any = {
      id: service.id,
      service_id: service.service_id,
      organization_id: service.organization_id,
      template_id: service.template_id,
      apiKey: service.apiKey,
      enabled: service.enabled,
      io_service_id: service.io_service_id,

      organization: {
        id: service._embedded.organization.id,
        legal_name: service._embedded.organization.legal_name,
        tax_code: service._embedded.organization.tax_code,
        logo: service._embedded.organization._links?.logo?.href || null,
        logo_small: service._embedded.organization._links['logo-miniature']?.href || null
      },

      service: {
        id: service._embedded.service.id,
        service_name: service._embedded.service.service_name,
        description: service._embedded.service.description,
        logo: service._embedded.service._links?.logo?.href || null,
        logo_small: service._embedded.service._links['logo-miniature']?.href || null
      },

      template: {
        id: service._embedded.template.id,
        name: service._embedded.template.name,
        description: service._embedded.template.description,
        subject: service._embedded.template.subject,
        message_body: service._embedded.template.message_body,
        has_payment: service._embedded.template.has_payment,
        has_due_date: service._embedded.template.has_due_date
      }
    };

    this.rService = _service.service;
    this._initServicesSelect([this.rService]);

    this.organization = _service.organization;
    this._initOrganizationsSelect([this.organization]);

    this.template = _service.template;
    this._initTemplatesSelect([this.template]);

    return _service;
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

  _translateConfig() {
    if (this.config && this.config.options) {
      Object.keys(this.config.options).forEach((key: string) => {
        if (this.config.options[key].label) {
          this.config.options[key].label = this.translate.instant(this.config.options[key].label);
        }
        if (this.config.options[key].values) {
          Object.keys(this.config.options[key].values).forEach((key2: string) => {
            this.config.options[key].values[key2].label = this.translate.instant(this.config.options[key].values[key2].label);
          });
        }
      });
    }
  }

  _initBreadcrumb() {
    const _title = this.id ? `#${this.id}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.ServiceInstances', url: '/service-instances', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _editService() {
    this._initForm({ ...this._service });
    this._isEdit = true;
    this._error = false;
  }

  _onClose() {
    this.close.emit({ id: this.id, service: this._service });
  }

  _onSave() {
    this.save.emit({ id: this.id, service: this._service });
  }

  _onCancelEdit() {
    this._isEdit = false;
    if (this._isNew) {
      if (this._useRoute) {
        this.router.navigate([this.model]);
      } else {
        this.close.emit({ id: this.id, service: null });
      }
    } else {
      this._service = new ServiceInstance({ ...this.service });
    }
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
  }

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

  _initTemplatesSelect(defaultValue: any[] = []) {
    this.templates$ = concat(
      of(defaultValue),
      this.templatesInput$.pipe(
        // filter(res => {
        //   return res !== null && res.length >= this.minLengthTerm
        // }),
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.templatesLoading = true),
        switchMap((term: any) => {
          return this.getData('templates', term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.templatesLoading = false)
          )
        })
      )
    );
  }

  getData(model: string, term: any = null): Observable<any> {
    let _options: any = { params: { limit: 100 } };
    if (term) {
      if (typeof term === 'string' ) {
        _options.params =  { ..._options.params, q: term };
      }
      if (typeof term === 'object' ) {
        console.log('term', term);
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

  loadCurrentData() {
    this.rService = null;
    this.apiService.getDetails('services', this.service.service_id).subscribe({
      next: (response: any) => {
        this.rService = response;
        this._initServicesSelect([this.rService]);
      },
      error: (error: any) => {
        Tools.OnError(error);
      }
    });

    this.organization = null;
    this.apiService.getDetails('organizations', this.service.organization_id).subscribe({
      next: (response: any) => {
        this.organization = response;
        this._initOrganizationsSelect([this.organization]);
      },
      error: (error: any) => {
        Tools.OnError(error);
      }
    });

    this.template = null;
    this.apiService.getDetails('templates', this.service.template_id).subscribe({
      next: (response: any) => {
        this.template = response;
        this._initTemplatesSelect([this.template]);
      },
      error: (error: any) => {
        Tools.OnError(error);
      }
    });
  }

  _orgLogo = (item: any): string => {
    let logoUrl = this._organizationLogoPlaceholder;
    if (item._links && item._links['logo-miniature']) {
      logoUrl = item._links['logo-miniature'].href;
    }
    return logoUrl;
  };

  _orgLogoBackground = (item: any): string => {
    let logoUrl = this._organizationLogoPlaceholder;
    if (item && item._links && item._links['logo-miniature']) {
      logoUrl = item._links['logo-miniature'].href;
    }
    return `url(${logoUrl})`;
  };

  _serviceLogoBackground = (item: any): string => {
    let logoUrl = this._serviceLogoPlaceholder;
    if (item && item._links && item._links['logo-miniature']) {
      logoUrl = item._links['logo-miniature'].href;
    }
    return `url(${logoUrl})`;
  };

  openTemplateInfo() {
    this._currentTemlplateId = this._isEdit ? this._formGroup.controls['template_id'].value : this.service.template_id
    this._modalInfoRef = this.modalService.show(this.templateInfo, {
      ignoreBackdropClick: false,
      class: 'modal-lg'
    });
  }

  closeModal(){
    this._modalInfoRef.hide();
  }
}
