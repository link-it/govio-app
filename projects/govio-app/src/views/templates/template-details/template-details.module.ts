import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { LinkLabModule } from 'projects/link-lab/src/lib/link-lab.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { TemplateDetailsComponent } from './template-details.component';
import { TemplateDetailsRoutingModule } from './template-details-routing.module';
import { TemplatePlaceholdersModule } from '../template-placeholders/template-placeholders.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    LinkLabModule,
    HasPermissionModule,
    TemplateDetailsRoutingModule,
    TemplatePlaceholdersModule
  ],
  declarations: [
    TemplateDetailsComponent
  ],
  exports: [TemplateDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TemplateDetailsModule { }
