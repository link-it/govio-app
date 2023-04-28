import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldAppearance } from '@angular/material/form-field';

import { MatDatepickerInputEvent } from '@angular/material/datepicker';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';
import { SearchBarFormComponent } from 'projects/components/src/lib/ui/search-bar-form/search-bar-form.component';

import { FileMessageComponent } from '../file-message/file-message.component';

import moment from 'moment';

@Component({
  selector: 'app-file-messages',
  templateUrl: 'file-messages.component.html',
  styleUrls: ['file-messages.component.scss']
})
export class FileMessagesComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'FileMessagesComponent';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;

  id: number = 0;

  Tools = Tools;

  config: any;
  fileConfig: any;

  filemessages: any[] = [];
  page: any = {};
  _links: any = {};

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = false;
  desktop: boolean = false;

  _useRoute : boolean = false;
  _useDialog : boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [];

  breadcrumbs: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService
  ) {
    this.config = this.configService.getConfiguration();

    this._initSearchForm();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      setTimeout(() => {
        Tools.WaitForResponse(false);
      }, this.config.AppConfig.DELAY || 0);
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this._initBreadcrumb();
        Tools.WaitForResponse(true, false, false);
        this.configService.getConfig('files').subscribe(
          (config: any) => {
            this.fileConfig = config;
            this._translateConfig();
            Tools.WaitForResponse(false);
            this._loadFileMessages();
          }
        );
      }
    });
  }

  ngOnDestroy() {
    // this.eventsManagerService.off(EventType.NAVBAR_ACTION);
  }

  ngAfterContentChecked(): void {
    this._spin = this.tools.getSpinner() && !this.tools.isSpinnerGlobal();
    this.desktop = (window.innerWidth >= 992);
  }

  _translateConfig() {
    if (this.fileConfig && this.fileConfig.options) {
      Object.keys(this.fileConfig.options).forEach((key: string) => {
        if (this.fileConfig.options[key].label) {
          this.fileConfig.options[key].label = this.translate.instant(this.fileConfig.options[key].label);
        }
        if (this.fileConfig.options[key].values) {
          Object.keys(this.fileConfig.options[key].values).forEach((key2: string) => {
            this.fileConfig.options[key].values[key2].label = this.translate.instant(this.fileConfig.options[key].values[key2].label);
          });
        }
      });
    }
  }

  _initBreadcrumb() {
    this.breadcrumbs = [
      { label: 'APP.TITLE.Reconciliations', url: '', type: 'title', icon: 'account_balance' },
      { label: 'APP.TITLE.Files', url: '/files', type: 'link' },
      { label: `#${this.id}`, url: `/files/${this.id}`, type: 'link' },
      { label: 'APP.TITLE.FileMessages', url: ``, type: 'link' }
    ];
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
      "organization.taxCode": new UntypedFormControl(''),
      creationDateFrom: new UntypedFormControl(''),
      creationDateTo: new UntypedFormControl(''),
      fileName: new UntypedFormControl(''),
      status: new UntypedFormControl(''),
      type: new UntypedFormControl(''),
    });
  }

  _loadFileMessages(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (this.id) {
      Tools.WaitForResponse(true, false, false);
      if (!url) { this.filemessages = []; }
      this.apiService.getList(`files/${this.id}/messages`).subscribe({
        next: (response: any) => {
          this.page = response.page;
          this._links = response._links;
          if (response._embedded && response._embedded.messages) {
            const _list: any = response._embedded.messages.map((transaction: any) => {
              const metadataText = Tools.simpleItemFormatter(this.fileConfig.messages.simpleItem.metadata.text, transaction, this.fileConfig.options || null);
              const metadataLabel = Tools.simpleItemFormatter(this.fileConfig.messages.simpleItem.metadata.label, transaction, this.fileConfig.options || null);
              const element = {
                id: transaction.id,
                primaryText: Tools.simpleItemFormatter(this.fileConfig.messages.simpleItem.primaryText, transaction, this.fileConfig.options || null),
                secondaryText: Tools.simpleItemFormatter(this.fileConfig.messages.simpleItem.secondaryText, transaction, this.fileConfig.options || null),
                metadata: `${metadataText}<span class="me-2">&nbsp;</span>${metadataLabel}`,
                secondaryMetadata: Tools.simpleItemFormatter(this.fileConfig.messages.simpleItem.secondaryMetadata, transaction, this.fileConfig.options || null),
                editMode: false,
                source: { ...transaction }
              };
              return element;
            });
            this.filemessages = (url) ? [...this.filemessages, ..._list] : [..._list];
          }
          Tools.WaitForResponse(false);
        },
        error: (error: any) => {
          this._setErrorMessages(true);
          Tools.WaitForResponse(false);
          // Tools.OnError(error);
        }
      });
    }
  }
  __loadMoreData() {
    if (this.page.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadFileMessages(null, this.page.next);
    }
  }

  _onEdit(event: any, param: any) {
    if (this._useDialog) {
      const dialogRef = this.dialog.open(FileMessageComponent, {
        height: '85vh',
        width: '95vw',
        maxHeight: '85vh',
        maxWidth: this.desktop ? '920px' : '95vw',
        panelClass: ['panel-dialog-custom-no-padding'],
        data: {
          transaction: param,
          config: this.fileConfig
        },
      });

      dialogRef.afterClosed().subscribe(result => {
        // console.log('The dialog was closed', result);
      });
    } else {
      this._editCurrent = param;
      this._isEdit = true;
    }
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
    this._loadFileMessages(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadFileMessages(this._filterData);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
  }

  _onDateChange(event: MatDatepickerInputEvent<any>, control: AbstractControl, type: string): void {
    let _dateTime: string = '';
    switch (type) {
      case 'creationDateFrom':
        _dateTime = moment(event.value.valueOf()).format('YYYY-MM-DDTHH:mm:ss');
        break;
      case 'creationDateTo':
        _dateTime = moment(event.value.valueOf()).add(23, 'hours').add(59, 'minutes').add(59, 'seconds').format('YYYY-MM-DDTHH:mm:ss');
        break;
    }
    control.setValue(_dateTime);
  }

  _onSort(event: any) {
    console.log(event);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _onCloseEdit(event: any) {
    this._isEdit = false;
  }
}
