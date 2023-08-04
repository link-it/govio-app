import { Injectable } from '@angular/core';
import { formatCurrency } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class UtilsLib {

  locale = 'it-IT';
  currency = '€';
  currencyCode = 'EUR';
  digitsInfo = '1.2-2';

  constructor(
    private sanitized: DomSanitizer
  ) { }

  _sanitizeHtml(html: string) {
    return this.sanitized.bypassSecurityTrustHtml(html);
  }

  formatNumber = (value: number) => {
    return Math.floor(value)
      .toString()
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  };

  formatNumberSuff(value: any, args?: any): any {
    var exp, rounded,
      suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];
    if (Number.isNaN(value)) {
      return null;
    }
    if (value < 1000) {
      return value;
    }
    exp = Math.floor(Math.log(value) / Math.log(1000));
    return (value / Math.pow(1000, exp)).toFixed(args) + suffixes[exp - 1];
  }

  formatBytes(value: any) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];

    for (var i = 0; value >= 1024 && i < 4; i++) {
      value /= 1024;
    }

    return value.toFixed(2) + units[i];
  }

  getObjectValue(obj: any, path: string): any {
    if (!path) { return obj; }
    const properties: string[] = path.split('.');
    const first = properties.shift() || '';
    const _objFirst = (typeof obj[first] === 'boolean') ? obj[first].toString() : obj[first];
    return _objFirst ? this.getObjectValue(obj[first], properties.join('.')) : '';
  }

  currencyFormatter(value: any) {
    const currency = formatCurrency(value || 0, this.locale, this.currency, this.currencyCode, this.digitsInfo);
    return currency;
  }

  dateFormatter(value: any, config: any) {
    const format = (typeof config === 'object' ? config.format : config) || 'DD-MM-YYYY';
    const date = value ? moment(value).format(format) : '';
    return date;
  }
}
