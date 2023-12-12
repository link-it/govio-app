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

import { YesnoDialogBsComponent } from 'projects/components/src/lib/dialogs/yesno-dialog-bs/yesno-dialog-bs.component';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

import { File } from './file';

declare const saveAs: any;

import { PieChartComponent, SingleSeries, MultiSeries, Series, LegendPosition } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-file-details',
  templateUrl: 'file-details.component.html',
  styleUrls: ['file-details.component.scss']
})
export class FileDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'FileDetailsComponent';
  readonly model: string = 'files';

  @Input() id: number | null = null;
  @Input() file: any = null;
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

  _isDetails = true;

  _editable: boolean = false;
  _deleteable: boolean = false;
  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _file: File = new File({});

  _stats: SingleSeries = [];

  exportLimit: number = 100;

  chartOptions: any = null;
  view: any = null; // [700, 400];

  colorSets: any;
  colorScheme: any = null;

  customColorScheme: any = null;

  fileProviders: any = null;

  _spin: boolean = true;
  desktop: boolean = false;
  _exportSpin: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';

  _modalConfirmRef!: BsModalRef;

  _filePlaceHolder: string = './assets/images/logo-placeholder.png';
  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
  _serviceLogoPlaceholder: string = './assets/images/service-placeholder.png';

  _selectedFile: any = null;

  _organization: any = null;
  _service: any = null;
  _template: any = null;
  _serviceInstance: any = null;

  minLengthTerm = 1;

  organizations$!: Observable<any[]>;
  organizationsInput$ = new Subject<string>();
  organizationsLoading: boolean = false;

  services$!: Observable<any[]>;
  servicesInput$ = new Subject<string>();
  servicesLoading: boolean = false;

  serviceInstances$!: Observable<any[]>;
  serviceInstancesInput$ = new Subject<string>();
  serviceInstancesLoading: boolean = false;
  serviceInstancesSelected$!: any;

  _data: any[] = [];

  _modalInfoRef!: BsModalRef;

  _currentTemlplateId: number = 0;

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
            this.exportLimit = config.exportLimit;
            this.chartOptions = config.chartOptions;
            this.colorScheme = config.chartOptions.colorScheme;
            this.customColorScheme = config.chartOptions.customColorScheme;
            this._loadAll();
          }
        );
      } else {
        this._isNew = true;
        this._isEdit = true;

        this._initBreadcrumb();
        // this._loadAnagrafiche();

        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.config = config;
            this.chartOptions = config.chartOptions;
            this.colorScheme = config.chartOptions.colorScheme;
            this.customColorScheme = config.chartOptions.customColorScheme;
            if (this._isEdit) {
              this._initForm({ ...this._file });
              setTimeout(() => {
                this._initOrganizationsSelect([]);
                this._initServicesSelect([]);
                // this._initServiceInstancesSelect([]);
              }, 500);
            } else {
              this._loadAll();
            }
          }
        );
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
    if (changes.file) {
      const file = changes.file.currentValue;
      this.file = file.source;
      this.id = this.file.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadFile();
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
          case 'file':
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

  _onFileLoaded(event: any, field: string) {
    this._selectedFile = event.target.files[0];
  }

  __onSave(body: any) {
    this._error = false;
    const formData = new FormData();
    formData.append('file', this._selectedFile, this._selectedFile.name);
    const url: string = `files?service_instance=${body.service_instance}`;
    this.apiService.upload(url, formData)
      .subscribe({
        next: (response: any) => {
          this.id = response.id;
          this.file = response; // new File({ ...response });
          this._file = response; // new File({ ...response });
          this._isNew = false;
          this._initBreadcrumb();
          this._isEdit = false;
          this._isNew = false;
          this.save.emit({ id: this.id, file: response, update: false });
          this.router.navigate([this.model, this.id], { replaceUrl: true });
        },
        error: (error: any) => {
          this._error = true;
          this._errorMsg = Tools.GetErrorMsg(error);
        }
      });
  }

  __onUpdate(id: number, body: any) {
    // this._error = false;
    // const _bodyPatch: any[] = jsonpatch.compare(this.file, body);
    // if (_bodyPatch) {
    //   this.apiService.updateElement(this.model, id, _bodyPatch).subscribe(
    //     (response: any) => {
    //       this._isEdit = !this._closeEdit;
    //       this.file = new File({ ...response });
    //       this._file = new File({ ...response });
    //       this.id = this.file.id;
    //       this.save.emit({ id: this.id, payment: response, update: true });
    //     },
    //     (error: any) => {
    //       this._error = true;
    //       this._errorMsg = Tools.GetErrorMsg(error);
    //     }
    //   );
    // } else {
    //   console.log('No difference');
    // }
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(this.file.id, form);
      }
    }
  }

  _deleteFile() {
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
          this.apiService.deleteElement(this.model, this.file.id).subscribe(
            (response) => {
              this.save.emit({ id: this.id, file: response, update: false });
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

  _downloadAction(event: any) {
    this._downloadContent(event.item);
  }

  _downloadContent(item: any) {
    if (this.id) {
      Tools.WaitForResponse(true, false, false);
      this.apiService.download(this.model, this.id, 'content').subscribe({
        next: (response: any) => {
          Tools.WaitForResponse(false);
          let name: string = this.file.filename ?? 'file_' + this.id + '.txt';
          saveAs(response, name);
        },
        error: (error: any) => {
          Tools.WaitForResponse(false);
          Tools.OnError(error);
        }
      });
    }
  }

  _loadFile() {
    if (this.id) {
      this._spin = true;
      this.file = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.file = response; // new File({ ...response });
          this._file = response; // new File({ ...response });

          this._spin = false;
          this._loadServiceInstance(this.file.service_instance_id);
          this._loadFileStats();
        },
        error: (error: any) => {
          this._spin = false;
          Tools.OnError(error);
        }
      });
    }
  }

  _loadFileStats() {
    if (this.id) {
      this._spin = true;
      this._stats = [];
      this.apiService.getDetails(this.model, this.id, 'stats').subscribe({
        next: (response: any) => {
          // this._stats = response.map((v: any) => ({name: this.translate.instant(`APP.STATUS.${v.status}`), value: v.count}));
          this._stats = response.map((v: any) => ({name: this.translate.instant(`APP.STATUS.${v.status}`), name_: v.status, value: v.count}));

          this._spin = false;
        },
        error: (error: any) => {
          this._spin = false;
          Tools.OnError(error);
        }
      });
    }
  }

  customColors = (value: string) => {
    return this.customColorScheme[value] || '#c0e2f7';
  }

  customLabel = (value: any) => {
    return this.translate.instant(`APP.STATUS.${value}`);
  }

  customLegend = (value: any) => {
    return this.translate.instant(`APP.STATUS.${value}`);
  }

  _loadServiceInstance(id: number) {
    if (this.file && this.file._embedded && this.file._embedded['service-instance']) {
      this._serviceInstance = this.file._embedded['service-instance'];
      this._organization = this._serviceInstance._embedded.organization;
      this._service = this._serviceInstance._embedded.service;
      this._template = this._serviceInstance._embedded.template;

      this.file.organization = this._organization;
      this.file.service = this._service;
      this.file.template = this._template;
    } else {
      this._spin = true;
      this._serviceInstance = null;
      let aux: any = { params: this._queryToHttpParams({ embed: ['organization','service','template'] }) };
      this.apiService.getDetails('service-instances', id, '', aux).subscribe({
        next: (response: any) => {
          this._serviceInstance = response;
          this._organization = this._serviceInstance._embedded.organization;
          this._service = this._serviceInstance._embedded.service;
          this._template = this._serviceInstance._embedded.template;
  
          this.file.organization = this._organization;
          this.file.service = this._service;
          this.file.template = this._template;
  
          this._spin = false;
        },
        error: (error: any) => {
          this._spin = false;
          Tools.OnError(error);
        }
      });
    }
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
    const _title = this.id ? `#${this.id}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: '', url: '', type: 'title', icon: 'topic' },
      { label: 'APP.TITLE.Files', url: '/files', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _editFile() {
    this._initForm({ ...this._file });
    this._isEdit = true;
    this._error = false;
  }

  _onClose() {
    this.close.emit({ id: this.id, file: this._file });
  }

  _onSave() {
    this.save.emit({ id: this.id, file: this._file });
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    if (this._isNew) {
      if (this._useRoute) {
        this.router.navigate([this.model]);
      } else {
        this.close.emit({ id: this.id, file: null });
      }
    } else {
      this._file = new File({ ...this.file });
    }
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
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
    if (item._links && item._links['logo-miniature']) {
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

  onChangeService(event: any) {
    this.serviceInstancesSelected$ = event;
  }

  _deepFlattenToObject(obj: any, prefix: string = '') {
    return Object.keys(obj).reduce((acc: any, k: any) => {
      const pre = prefix.length ? prefix + '_' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        Object.assign(acc, this._deepFlattenToObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  }
  
  _hasMessages() {
    return (this.file.acquired_messages + this.file.error_messages) > 0;
  }

  onExport() {
    let _data: any[] = [];
    this._exportSpin = true;
    let aux: any = { params: this._queryToHttpParams({ limit: this.exportLimit }) };
    this.apiService.getDetails(this.model, this.id, 'file-messages', aux)
      .pipe(
        switchMap(response => {
          _data = _data.concat(response.items);
          if(response._links && response._links.next) {
            return this._getData(response._links.next.href, {}, _data);
          } else {
            return of(_data);
          }
        })
      ).subscribe({
        next: (response: any) => {
          const _arrObjFlatten = response.map((item: any) => this._deepFlattenToObject(item));
          this._data = _arrObjFlatten;
          if (this._data.length) {
            Tools.DownloadCSVFile(this._data, 'FileMessages');
          } else {
            Tools.OnError(null, this.translate.instant('APP.MESSAGE.ERROR.NoMessages'));
          }
          this._exportSpin = false;
        },
        error: (error: any) => {
          this._exportSpin = false;
          Tools.OnError(error);
        }
      });
  }

  _getData(url: string, aux: any, fullData:any[]): Observable<any> {
    fullData = fullData || [];
    return this.apiService.getList(this.model, aux, url)
      .pipe(
        switchMap((data:any)=>{
          fullData = fullData.concat(data.items);
          return !(data._links?.next)? of(fullData):
            this._getData(data._links.next.href, aux, fullData)
        })
      );
  }

  onChangeValue() {
    if (this._hasControlValue('organization_id') && this._hasControlValue('service_id')) {
      this._formGroup.controls['service_instance'].enable();
      this._initServiceInstancesSelect([]);
    } else {
      this._formGroup.controls['service_instance'].disable();
    }
    this._formGroup.controls['service_instance'].setValue(null);
    this.serviceInstancesSelected$ = null;
    this._formGroup.updateValueAndValidity();
  }

  openTemplateInfo() {
    this._currentTemlplateId = this._isEdit ? this.serviceInstancesSelected$.template_id : this._template.id
    this._modalInfoRef = this.modalService.show(this.templateInfo, {
      ignoreBackdropClick: false,
      class: 'modal-lg'
    });
  }

  closeModal(){
    this._modalInfoRef.hide();
  }
}
