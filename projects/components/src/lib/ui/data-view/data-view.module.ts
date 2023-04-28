import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { DataTypeModule } from '../data-type/data-type.module';
import { DataViewComponent } from './data-view.component';

@NgModule({
  declarations: [
    DataViewComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    DataTypeModule
  ],
  exports: [
    DataViewComponent
  ]
})
export class DataViewModule { }
