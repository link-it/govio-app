import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { LinkLabModule } from 'projects/link-lab/src/lib/link-lab.module';

import { PlaceholdersComponent } from './placeholders.component';
import { PlaceholdersRoutingModule } from './placeholders-routing.module';
import { PlaceholderDetailsModule } from './placeholder-details/placeholder-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    LinkLabModule,
    PlaceholdersRoutingModule,
    PlaceholderDetailsModule
  ],
  declarations: [
    PlaceholdersComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PlaceholdersModule { }
