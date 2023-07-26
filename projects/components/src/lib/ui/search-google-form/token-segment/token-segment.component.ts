import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, startWith, switchMap, tap } from 'rxjs/operators';

import _ from 'lodash';

@Component({
  selector: 'ui-token-segment',
  templateUrl: './token-segment.component.html',
  styleUrls: [
    './token-segment.component.scss'
  ]
})
export class TokenSegmentComponent implements OnInit, OnChanges {

  @Input() token: any = null;
  @Input() index: any = null;
  @Input() simple: boolean = false;
  @Input() useCondition: boolean = true;

  @Output() onAction: EventEmitter<any> = new EventEmitter();
  @Output() onRemove: EventEmitter<any> = new EventEmitter();

  config: any;

  data$!: Observable<any>;
  field: string = '';

  api_url: string = '';

  constructor(
    private http: HttpClient,
    private translate: TranslateService,
    private configService: ConfigService
  ) {
    this.config = this.configService.getConfiguration();
    this.api_url = this.config.AppConfig.GOVAPI.HOST;
  }

  ngOnInit(): void {
    // console.group('TOKEN')
    // console.log('token', this.token);
    // console.log('index', this.index);
    // console.groupEnd();
    this.data$ = of({ nome: this.token.value });
    if (this.token.data && this.token.data.params && this.token.data.params.resource) {
      // console.log(this.token.data.params.resource);
      // console.log(this.token.data.params.field);
      this.field = this.token.data.params.field;
      const _resource = this.token.data.params.resource;
      const _path = this.token.data.params.path;
      const _id = this.token.value;
      const _endPoint = _path ? `${this.api_url}/${_resource}${_path}${_id}` : `${this.api_url}/${_resource}/${_id}`;
      this._getData(_endPoint);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  _onAction(event: any) {
    event.stopPropagation();
    this.onAction.emit(this.token);
  }
  
  _removeToken(event: any) {
    event.stopPropagation();
    this.onRemove.emit({ token: this.token, index: this.index });
  }

  _getData(endPoint: string) {
    this.data$ = this.http.get(`${endPoint}`, {})
      .pipe(
        map((data: any) => (Array.isArray(data.items)) ? data.items[0] : data )
      );
  }
}
