import { AfterContentChecked, AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { MatFormFieldAppearance } from '@angular/material/form-field';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { PageloaderService } from 'projects/tools/src/lib/pageloader.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';

import { SearchBarFormComponent } from 'projects/components/src/lib/ui/search-bar-form/search-bar-form.component';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

import moment from 'moment';

@Component({
  selector: 'app-messages',
  templateUrl: 'messages.component.html',
  styleUrls: ['messages.component.scss']
})
export class MessagesComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'MessagesComponent';
  readonly model: string = 'messages';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  Tools = Tools;

  config: any;
  messagesConfig: any;

  messages: any[] = [];
  page: any = {};
  _links: any = {};

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any = {};

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute : boolean = true;

  _materialAppearance: MatFormFieldAppearance = 'fill';

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'id';
  sortDirection: string = 'desc';
  sortFields: any[] = [
    { field: 'id', label: 'APP.LABEL.Id', icon: '' },
    { field: 'scheduled_expedition_date', label: 'APP.LABEL.ScheduledExpeditionDate', icon: '' }
  ];

  searchFields: any[] = [
    { field: 'scheduled_expedition_date_from', label: 'APP.LABEL.ScheduledExpeditionDate', type: 'date', condition: 'gt', format: 'DD/MM/YYYY' },
    { field: 'scheduled_expedition_date_to', label: 'APP.LABEL.ScheduledExpeditionDate', type: 'date', condition: 'lt', format: 'DD/MM/YYYY' },
    { field: 'tax_code', label: 'APP.LABEL.TaxCode', type: 'string', condition: 'like' },
    { field: 'organization_q', label: 'APP.LABEL.Organization', type: 'string', condition: 'like' },
    { field: 'service_q', label: 'APP.LABEL.ServiceName', type: 'text', condition: 'like' },
    { field: 'organization_id', label: 'APP.LABEL.Organization', type: 'text', condition: 'equal' },
    { field: 'organization', label: 'APP.LABEL.Organization', type: 'object', condition: 'equal',
      data: { value: 'id', label: 'legal_name' }
    },
    { field: 'service_id', label: 'APP.LABEL.ServiceName', type: 'text', condition: 'equal' },
    { field: 'service', label: 'APP.LABEL.ServiceName', type: 'object', condition: 'equal',
      data: { value: 'id', label: 'service_name' }
    },
    { field: 'status', label: 'APP.LABEL.Status', type: 'enum', condition: 'equal',
      enumValues: { 
        'SCHEDULED': 'APP.STATUS.SCHEDULED',
        'PROCESSED': 'APP.STATUS.PROCESSED',
        'THROTTLED': 'APP.STATUS.THROTTLED',
        'RECIPIENT_ALLOWED': 'APP.STATUS.RECIPIENT_ALLOWED',
        'SENT': 'APP.STATUS.SENT',
        'CREATED': 'APP.STATUS.CREATED',
        'PROFILE_NOT_EXISTS': 'APP.STATUS.PROFILE_NOT_EXISTS',
        'SENDER_NOT_ALLOWED': 'APP.STATUS.SENDER_NOT_ALLOWED',
        'FORBIDDEN': 'APP.STATUS.FORBIDDEN',
        'REJECTED': 'APP.STATUS.REJECTED',
        'PROCESSING': 'APP.STATUS.PROCESSING',
        'DENIED': 'APP.STATUS.DENIED',
        'BAD_REQUEST': 'APP.STATUS.BAD_REQUEST'
      }
    }
  ];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Messages', url: '', type: 'title', iconBs: 'send' }
  ];

  statusList: any = [
    { label: 'APP.STATUS.SCHEDULED', value: 'SCHEDULED', order: 1 },
    { label: 'APP.STATUS.PROCESSED', value: 'PROCESSED', order: 2 },
    { label: 'APP.STATUS.THROTTLED', value: 'THROTTLED', order: 3 },
    { label: 'APP.STATUS.RECIPIENT_ALLOWED', value: 'RECIPIENT_ALLOWED', order: 4 },
    { label: 'APP.STATUS.SENT', value: 'SENT', order: 5 },
    { label: 'APP.STATUS.CREATED', value: 'CREATED', order: 5 },
    { label: 'APP.STATUS.PROFILE_NOT_EXISTS', value: 'PROFILE_NOT_EXISTS', order: 7 },
    { label: 'APP.STATUS.SENDER_NOT_ALLOWED', value: 'SENDER_NOT_ALLOWED', order: 8 },
    { label: 'APP.STATUS.FORBIDDEN', value: 'FORBIDDEN', order: 9 },
    { label: 'APP.STATUS.REJECTED', value: 'REJECTED', order: 10 },
    { label: 'APP.STATUS.PROCESSING', value: 'PROCESSING', order: 11 },
    { label: 'APP.STATUS.DENIED', value: 'DENIED', order: 12 },
    { label: 'APP.STATUS.BAD_REQUEST', value: 'BAD_REQUEST', order: 13 }
  ];

  _organization: any = null;
  _service: any = null;

  minLengthTerm = 1;

  organizations$!: Observable<any[]>;
  organizationsInput$ = new Subject<string>();
  organizationsLoading: boolean = false;

  services$!: Observable<any[]>;
  servicesInput$ = new Subject<string>();
  servicesLoading: boolean = false;

  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
  _serviceLogoPlaceholder: string = './assets/images/service-placeholder.png';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    private pageloaderService: PageloaderService,
    public apiService: OpenAPIService
  ) {
    this.config = this.configService.getConfiguration();
    this._materialAppearance = this.config.materialAppearance;

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.configService.getConfig('messages').subscribe(
      (config: any) => {
        this.messagesConfig = config;
        this._initOrganizationsSelect([]);
        this._initServicesSelect([]);
      }
    );
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
      // this.searchBarForm.setNotCloseForm(true)
      setTimeout(() => {
        this._loadMessages();
      }, 100);
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.NoResults';
      this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
    }
  }

  _initSearchForm() {
    this._formGroup = new UntypedFormGroup({
      scheduled_expedition_date_from: new UntypedFormControl(''),
      scheduled_expedition_date_to: new UntypedFormControl(''),
      'tax_code': new UntypedFormControl(''),
      'organization_q': new UntypedFormControl(''),
      'service_q': new UntypedFormControl(''),
      status: new UntypedFormControl(''),
      organization_id: new UntypedFormControl(null),
      organization: new UntypedFormControl(null),
      service_id: new UntypedFormControl(null),
      service: new UntypedFormControl(null)
    });
  }

  _loadMessages(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    let aux: any;
    if (!url) {
      this.messages = [];
      const sort: any = { sort: this.sortField, sort_direction: this.sortDirection}
      query = { ...query, embed: ['sender,service_instance'], ...sort };
      aux = { params: this._queryToHttpParams(query) };
    }

    this._spin = true;
    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {
        this.page = response.page;
        this._links = response._links;

        if (response.items) {
          const _list: any = response.items.map((message: any) => {
            const _message: any = this.__prepareMessageData(message);
            const element = {
              id: _message.id,
              source: { ..._message }
            };
            return element;
          });
          this.messages = (url) ? [...this.messages, ..._list] : [..._list];
          this._preventMultiCall = false;
          this._spin = false;
        }
        Tools.ScrollTo(0);
      },
      error: (error: any) => {
        this._setErrorMessages(true);
        this._preventMultiCall = false;
        this._spin = false;
        // Tools.OnError(error);
      }
    });
  }

  __prepareMessageData(message: any) {
    const _serviceInstance = message._embedded['service-instance'];
    const _message: any = {
      id: message.id,
      subject: message.subject,
      markdown: message.markdown,
      taxcode: message.taxcode,
      status: message.status,
      sender_id: message.sender_id,
      service_instance_id: message.service_instance_id,
      creation_date: message.creation_date,
      due_date: message.due_date,
      last_update_status: message.last_update_status,
      scheduled_expedition_date: message.scheduled_expedition_date,

      sender: message._embedded.sender,

      service_instance:  {
        id: _serviceInstance.id,
        organization_id: _serviceInstance.organization_id,
        service_id: _serviceInstance.service_id,
        template_id: _serviceInstance.template_id,
        apiKey: _serviceInstance.apiKey,
        enabled: _serviceInstance.enabled
      },

      organization: {
        id: _serviceInstance._embedded.organization.id,
        legal_name: _serviceInstance._embedded.organization.legal_name,
        tax_code: _serviceInstance._embedded.organization.tax_code,
        logo: _serviceInstance._embedded.organization._links?.logo?.href || null,
        logo_small: _serviceInstance._embedded.organization._links['logo-miniature']?.href || null
      },

      service: {
        id: _serviceInstance._embedded.service.id,
        service_name: _serviceInstance._embedded.service.service_name,
        description: _serviceInstance._embedded.service.description
      },

      template: {
        id: _serviceInstance._embedded.template.id,
        subject: _serviceInstance._embedded.template.subject,
        description: _serviceInstance._embedded.template.description,
        message_body: _serviceInstance._embedded.template.message_body,
        has_payment: _serviceInstance._embedded.template.has_payment,
        has_due_date: _serviceInstance._embedded.template.has_due_date
      }
    };

    return _message;
  }

  _queryToHttpParams(query: any) : HttpParams {
    let httpParams = new HttpParams();

    Object.keys(query).forEach(key => {
      if (query[key]) {
        let _dateTime = '';
        switch (key)
        {
          case 'scheduled_expedition_date_from':
            _dateTime = moment(query[key]).utc().format();
            httpParams = httpParams.set(key, _dateTime);
            break;
          case 'scheduled_expedition_date_to':
            _dateTime = moment(query[key]).utc().add(23, 'h').add(59, 'm').add(59, 's').format();
            httpParams = httpParams.set(key, _dateTime);
            break;
          default:
            httpParams = httpParams.set(key, query[key]);
        }
      }
    });
    
    return httpParams; 
  }

  __loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadMessages(null, this._links.next.href);
    }
  }

  _onEdit(event: any, param: any) {
    if (this._useRoute) {
      if (this.searchBarForm) {
        this.searchBarForm._pinLastSearch();
      }
      this.router.navigate(['messages', param.id]);
    } else {
      this._isEdit = true;
      this._editCurrent = param;
    }
  }

  _onCloseEdit() {
    this._isEdit = false;
  }

  _dummyAction(event: any, param: any) {
    console.log(event, param);
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    if (this._filterData.organization) {
      this._filterData.organization_id = this._filterData.organization.id;
      delete this._filterData.organization;
    }
    if (this._filterData.service) {
      this._filterData.service_id = this._filterData.service.id;
      delete this._filterData.service;
    }
    this._loadMessages(this._filterData);
  }

  _resetForm() {
    this._filterData = {};
    this._loadMessages(this._filterData);
  }

  _onSort(event: any) {
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadMessages(this._filterData);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  trackByFn(index: number, item: any): number {
    return item.id;
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

  trackBySelectFn(item: any) {
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

  onSelectedSearchDropdwon($event: Event){
    this.searchBarForm.setNotCloseForm(true)
    $event.stopPropagation();
  }

  onChangeSearchDropdwon(event: any){
    setTimeout(() => {      
      this.searchBarForm.setNotCloseForm(false)
    }, 200);
  }
}
