import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { LinkLabModule } from 'projects/link-lab/src/lib/link-lab.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { MessagesComponent } from './messages.component';
import { MessagesRoutingModule } from './messages-routing.module';
import { MessageDetailsModule } from './message-details/message-details.module';
import { SendMessagesModule } from './send-messages/send-messages.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    LinkLabModule,
    HasPermissionModule,
    MessagesRoutingModule,
    MessageDetailsModule,
    SendMessagesModule
  ],
  declarations: [
    MessagesComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MessagesModule { }
