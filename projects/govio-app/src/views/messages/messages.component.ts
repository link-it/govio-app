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
  _filterData: any[] = [];

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
    { field: 'service_q', label: 'APP.LABEL.ServiceName', type: 'text', condition: 'like' }
  ];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Messages', url: '', type: 'title', iconBs: 'send' }
  ];

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
      }
    );
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    if (!(this.searchBarForm && this.searchBarForm._isPinned())) {
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
    this._loadMessages(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
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
}
