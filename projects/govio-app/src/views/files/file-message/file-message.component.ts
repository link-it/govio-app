import { Component, EventEmitter, Inject, Input, OnInit, Optional, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from 'projects/govio-app/src/services/openAPI.service';
import { FieldClass } from 'projects/link-lab/src/lib/it/link/classes/definitions';

export interface DialogTarnsactionData {
  transaction: any;
  config: any;
}

@Component({
  selector: 'app-file-message',
  templateUrl: 'file-message.component.html',
  styleUrls: ['file-message.component.scss']
})
export class FileMessageComponent implements OnInit {
  static readonly Name = 'FileMessageComponent';

  @Input() journal: number | null = null;
  @Input() id: number | null = null;
  @Input() transaction: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();

  _isDialog: boolean = true;

  Tools = Tools;

  appConfig: any;

  _informazioni: FieldClass[] = [];

  _spin: boolean = false;
  desktop: boolean = false;

  breadcrumbs: any[] = [];

  _message: string = 'APP.MESSAGE.NoData';
  _messageHelp: string = 'APP.MESSAGE.NoDataHelp';

  _error: boolean = false;

  constructor(
    private router: Router,
    @Optional() public dialogRef: MatDialogRef<FileMessageComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogTarnsactionData,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService
  ) {
    this.appConfig = this.configService.getConfiguration();

    if (this._isDialog && data) {
      this.transaction = data.transaction;
      this.config = data.config;
    }
  }

  ngOnInit() {
    if (this._isDialog) {
      this.__initInformazioni();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      // this._loadAll();
    }
    if (changes.transaction) {
      this._isDialog = false;
      const transaction = changes.transaction.currentValue;
      this.transaction = transaction.source;
      this.id = this.transaction.id;
      this._initBreadcrumb();
      this.__initInformazioni();
    }
  }

  ngAfterContentChecked(): void {
    this._spin = this.tools.getSpinner() && !this.tools.isSpinnerGlobal();
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    this.breadcrumbs = [
      { label: 'APP.TITLE.Reconciliations', url: '', type: 'title', icon: 'account_balance' },
      { label: 'APP.TITLE.Journals', url: '/journals', type: 'link', route: true },
      { label: `#${this.journal}`, url: `/journals/${this.journal}`, type: 'link', route: true },
      { label: 'APP.TITLE.FileMessages', url: `/journals/${this.journal}/transactions`, type: 'link', route: false },
      { label: `#${this.transaction.reference}`, url: '', type: 'title' }
    ];
  }

  __initInformazioni() {
    if (this.transaction) {
      const _data = this.transaction.source || this.transaction;
      const _detailsPagoPa = Tools.generateFields(this.config.transactions.details, _data).map((field: FieldClass) => {
        field.label = this.translate.instant(field.label);
        return field;
      });

      this._informazioni = [ ...this._informazioni, ..._detailsPagoPa ];
    }
  }

  _dummyAction(event: any, param: any) {
    console.log(event, param);
  }

  _onClose() {
    if (this._isDialog) {
      this.dialogRef.close();
    } else {
      this.close.emit({ id: this.id, transaction: this.transaction });
    }
  }

  onBreadcrumb(event: any) {
    if (event.route) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
  }
}
