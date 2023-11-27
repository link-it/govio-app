import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';

import { Message } from './message';

@Component({
  selector: 'app-message-details',
  templateUrl: 'message-details.component.html',
  styleUrls: ['message-details.component.scss']
})
export class MessageDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'MessageDetailsComponent';
  readonly model: string = 'messages';

  @Input() id: number | null = null;
  @Input() message: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  _title: string = '';

  appConfig: any;

  _isDetails = true;

  _message: Message = new Message({});

  _sender: any = null;
  _serviceInstance: any = null;
  _organization: any = null;
  _service: any = null;
  _template: any = null;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    private tools: Tools,
    private eventsManagerService: EventsManagerService,
    private apiService: OpenAPIService
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
            this._loadAll();
          }
        );
      }
    });
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this._loadAll();
    }
    if (changes.message) {
      const message = changes.message.currentValue;
      this.message = message.source;
      this.id = this.message.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadMessage();
  }

  _loadMessage() {
    if (this.id) {
      this._spin = true;
      this.message = null;
      let aux: any = null; // { params: this._queryToHttpParams({ embed: ['service-instance'] }) };
      this.apiService.getDetails(this.model, this.id, '', aux).subscribe({
        next: (response: any) => {
          this.message = response; // new Message({ ...response });
          if (this.message.payment && this.message.payment.amount) {
            this.message.payment.amount = this.message.payment.amount / 100;
          }
          this._message = new Message({ ...this.message });

          this._sender = this.message._embedded.sender;

          this._serviceInstance = this.message._embedded['service-instance'];
          this._organization = this._serviceInstance._embedded.organization;
          this._service = this._serviceInstance._embedded.service;
          this._template = this._serviceInstance._embedded.template;
  
          this.message.user = this._sender;
          this.message.organization = this._organization;
          this.message.service = this._service;
          this.message.template = this._template;

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
      { label: '', url: '', type: 'title', iconBs: 'send' },
      { label: 'APP.TITLE.Messages', url: '/messages', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _dummyAction(event: any, param: any) {
    console.log(event, param);
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    }
  }
}
