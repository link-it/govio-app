import { AfterViewInit, Component, EventEmitter, HostBinding, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { formatCurrency } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { UtilsLib } from '../../utils/utils.lib';

import * as moment from 'moment';

@Component({
  selector: 'ui-data-type',
  templateUrl: './data-type.component.html',
  styleUrls: [
    './data-type.component.scss'
  ]
})
export class DataTypeComponent implements OnInit, AfterViewInit {
  @HostBinding('class.empty-space') get emptySpace(): boolean {
    return this._elem.emptySpace;
  }
  @HostBinding('class.block-space') get blockSpace(): boolean {
    return this._elem.blockSpace;
  }

  @Input('data') _data: any = null;
  @Input('elem') _elem: any = null;
  @Input('config') _config: any = null;

  @Output() dataClick: EventEmitter<any> = new EventEmitter();

  _value: any = null;

  locale = 'it-IT';
  currency = '€';
  currencyCode = 'EUR';
  digitsInfo = '1.2-2';

  _label: string = '';
  _background: string = '';
  _border: string = '';
  _color: string = '';
  _class: string = '';
  _showBadged: boolean = false;
  _tooltip: string = '';

  constructor(
    private sanitized: DomSanitizer,
    private translate: TranslateService,
    public utilsLib: UtilsLib
  ) { }

  ngOnInit() {
    this._value = this.utilsLib.getObjectValue(this._data, this._elem.field);
    if (this._elem.type === 'status') {
      if (this._config.options) {
        const _origValue = this._value;
        const _optionsName = this._elem.options;
        this._value = this._value ? (this._config.options[_optionsName].values[_origValue] ? this._config.options[_optionsName].values[_origValue].label : this._value) : 'undefined';
        this._label = (this._config.options.statusLabel) ? this._config.options.statusLabel : 'Status';
        this._background = (this._config.options.status && this._config.options.status[_origValue]) ? this._config.options.status[_origValue].background : '#1f1f1f';
        this._border = (this._config.options.status && this._config.options.status[_origValue]) ? this._config.options.status[_origValue].border : '#1f1f1f';
        this._color = (this._config.options.status && this._config.options.status[_origValue]) ? this._config.options.status[_origValue].color : '#fff';
        this._class = this._config.options.statusSmall ? 'status-label-sm' : '';
      }
    }
    if (this._elem.type === 'label') {
      if (this._config.options) {
        const _origValue = this._value;
        const _optionsName = this._elem.options;
        this._label = (this._config.options[_optionsName].label) ? this._config.options[_optionsName].label : _optionsName;
        this._value = this._value ? (this._config.options[_optionsName].values[_origValue] ? this._config.options[_optionsName].values[_origValue].label : this._value) : 'undefined';
        this._background = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].background : '#1f1f1f';
        this._border = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].border : '#1f1f1f';
        this._color = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].color : '#fff';
        this._class = this._config.options[_optionsName].small ? 'status-label-sm' : '';
      }
    }
    if (this._elem.type === 'tag') {
      if (this._config.options) {
        const _origValue = this._value;
        const _optionsName = this._elem.options;
        this._value = String(this._value) ? (this._config.options[_optionsName].values[_origValue] ? this._config.options[_optionsName].values[_origValue].label : this._value) : 'undefined';
        this._background = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].background : '#1f1f1f';
        this._border = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].border : '#1f1f1f';
        this._color = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].color : '#fff';
        this._showBadged = (this._elem.badged !== undefined) ? this._elem.badged : true;
        this._class = 'gl-badge badge badge-pill';
      }
    }
    if (this._elem.type === 'image') {
      this._tooltip = this.utilsLib.getObjectValue(this._data.source, this._elem.tooltip);
    }
    if (this._elem.type === 'avatar') {
      this._tooltip = this.utilsLib.getObjectValue(this._data.source, this._elem.tooltip);
    }
  }

  ngAfterViewInit(): void {
  }
}
