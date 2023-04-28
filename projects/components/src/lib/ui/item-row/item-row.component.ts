import { AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'ui-item-row',
  templateUrl: './item-row.component.html',
  styleUrls: [
    './item-row.component.scss'
  ]
})
export class ItemRowComponent implements OnInit, AfterViewInit {
  @HostBinding('class.notify') get notifyClass(): boolean {
    return this.notify;
  }

  @Input('data') _data: any = null;
  @Input('config') _config: any = null;
  @Input() configRow: string = 'itemRow';
  @Input() actionDisabled: boolean = false;
  @Input() notify: boolean = false;
  @Input() hoverFeedback: boolean = true;
  @Input() hasLink: boolean = false;

  @Output() itemClick: EventEmitter<any> = new EventEmitter();

  _dummyText: string = 'DUMMY TEXT';

  _itemRowConfig: any = null;

  constructor(
    private element: ElementRef,
    private sanitized: DomSanitizer
  ) { }

  ngOnInit() {
    this._itemRowConfig = this._config[this.configRow] || this._config.simpleItem;
  }

  ngAfterViewInit(): void {
  }

  _sanitizeHtml(html: string) {
    return this.sanitized.bypassSecurityTrustHtml(html);
  }

  __itemClick(event: any, activeItem: any) {
    this.itemClick.emit(this._data);
  }
}
