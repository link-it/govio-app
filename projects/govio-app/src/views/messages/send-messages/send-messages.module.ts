import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { LinkLabModule } from 'projects/link-lab/src/lib/link-lab.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { SendMessagesComponent } from './send-messages.component';
import { SendMessagesRoutingModule } from './send-messages-routing.module';
import { TemplateViewModule } from '../../templates/template-view/template-view.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    LinkLabModule,
    HasPermissionModule,
    SendMessagesRoutingModule,
    TemplateViewModule
  ],
  declarations: [
    SendMessagesComponent
  ],
  exports: [SendMessagesComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SendMessagesModule { }
