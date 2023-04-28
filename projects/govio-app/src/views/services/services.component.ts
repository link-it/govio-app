import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { MatFormFieldAppearance } from '@angular/material/form-field';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';
import { SearchBarFormComponent } from 'projects/components/src/lib/ui/search-bar-form/search-bar-form.component';

import * as moment from 'moment';
import * as jsonpatch from 'fast-json-patch';

@Component({
  selector: 'app-services',
  templateUrl: 'services.component.html',
  styleUrls: ['services.component.scss']
})
export class ServicesComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'ServicesComponent';
  readonly model: string = 'service-instances';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  config: any;
  servicesConfig: any;

  services: any[] = [];
  page: any = {};
  _links: any = {};

  _isEdit: boolean = false;

  _hasFilter: boolean = true;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  _materialAppearance: MatFormFieldAppearance = 'fill';

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';

  _error: boolean = false;

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'legal_name';
  sortDirection: string = 'asc';
  sortFields: any[] = [
    { field: 'legal_name', label: 'APP.LABEL.Organization', icon: '' }
  ];

  searchFields: any[] = [];

  _useRoute: boolean = true;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.ServiceInstances', url: '', type: 'link'}
  ];

  _unimplemented: boolean = false;

  groupName: string = '';
  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
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
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.servicesConfig = config;
        this._loadServices();
      }
    );
  }

  ngOnDestroy() {
    // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
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
      q: new UntypedFormControl(''),
    });
  }

  _loadServices(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    let aux: any;
    if (!url) {
      this.services = [];
      const sort: any = { sort: this.sortField, sort_direction: this.sortDirection}
      query = { ...query, embed: ['service','organization','template'], ...sort };
      aux = { params: this._queryToHttpParams(query) };
    }

    this._spin = true;
    this.apiService.getList(this.model, aux, url).subscribe({
      next: (response: any) => {
        this.page = response.page;
        this._links = response._links;

        if (response.items) {
          const _list: any = response.items.map((service: any) => {
            const _service: any = this.__prepareServiceData(service);
            const element = {
              id: _service.id,
              groupName: _service.organization.legal_name,
              group: _service.organization,
              showGroup: (_service.organization.legal_name !== this.groupName) || (this.groupName === ''),
              source: { ..._service }
            };
            if (this.groupName !== _service.organization.legal_name) {
              this.groupName = _service.organization.legal_name;
            }
            return element;
          });
          this.services = (url) ? [...this.services, ..._list] : [..._list];
          this._preventMultiCall = false;
        }
        this._spin = false;
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

  __prepareServiceData(service: any) {
    const _service: any = {
      id: service.id,
      service_id: service.service_id,
      organization_id: service.organization_id,
      template_id: service.template_id,
      apiKey: service.apiKey,
      enabled: service.enabled,

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
        description: service._embedded.service.description
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

    return _service;
  }

  _queryToHttpParams(query: any) : HttpParams {
    let httpParams = new HttpParams();

    Object.keys(query).forEach(key => {
      if (query[key]) {
        let _dateTime = '';
        switch (key)
        {
          case 'data_inizio':
          case 'data_fine':
            _dateTime = moment(query[key]).format('YYYY-MM-DD');
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
      this._loadServices(null, this._links.next.href);
    }
  }

  _onEdit(event: any, param: any) {
    if (this._useRoute) {
      this.router.navigate([this.model, param.id]);
    } else {
      this._isEdit = true;
    }
  }

  _onNew() {
    if (this._useRoute) {
      this.router.navigate([this.model, 'new']);
    } else {
      this._isEdit = true;
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
    this.groupName = '';
    this._filterData = values;
    this._loadServices(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServices(this._filterData);
  }

  _onSort(event: any) {
    this.groupName = '';
    this.sortField = event.sortField;
    this.sortDirection = event.sortBy;
    this._loadServices(this._filterData);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _orgLogoBackground = (item: any): string => {
    let logoUrl = this._organizationLogoPlaceholder;
    if (item && item._links && item._links['logo-miniature']) {
      logoUrl = item._links['logo-miniature'].href;
    }
    return `url(${logoUrl})`;
  };

  trackByFn(index: number, item: any): number {
    return item.id;
  }
}
