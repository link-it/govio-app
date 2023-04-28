import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'ui-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: [
    './data-view.component.scss'
  ]
})
export class DataViewComponent implements OnInit {

  @Input('data') _data: any = null;
  @Input('config') _config: any = null;
  @Input('columns') _columns: number = 6;

  @Output() downloadClick: EventEmitter<any> = new EventEmitter();

  _detailsConfig: any = null;

  constructor(private sanitized: DomSanitizer) { }

  ngOnInit() {
    this._detailsConfig = this._config.details;
  }

  __downloadClick(item: any) {
    this.downloadClick.emit({ item });
  }

  _sanitizeHtml(html: string) {
    return this.sanitized.bypassSecurityTrustHtml(html)
  }

  _showEmpty(field: any) {
    return (!this._data[field.field] && field.hideEmpty) ? false : true;;
  }
}
