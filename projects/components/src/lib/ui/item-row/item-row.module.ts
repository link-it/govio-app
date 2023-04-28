import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemTypeModule } from '../item-type/item-type.module';
import { ItemRowComponent } from './item-row.component';

@NgModule({
  declarations: [
    ItemRowComponent
  ],
  imports: [
    CommonModule,
    ItemTypeModule
  ],
  exports: [
    ItemRowComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ItemRowModule { }
