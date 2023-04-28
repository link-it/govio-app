import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { LinkLabModule } from 'projects/link-lab/src/lib/link-lab.module';

import { PlaceholderItemModule } from '../placeholder-item/placeholder-item.module';
import { TemplatePlaceholdersComponent } from './template-placeholders.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    LinkLabModule,
    PlaceholderItemModule
  ],
  declarations: [
    TemplatePlaceholdersComponent
  ],
  exports: [TemplatePlaceholdersComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TemplatePlaceholdersModule { }
