import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { LinkLabModule } from 'projects/link-lab/src/lib/link-lab.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { SendMessagesComponent } from './send-messages.component';
import { SendMessagesRoutingModule } from './send-messages-routing.module';
import { TemplateViewModule } from '../../templates/template-view/template-view.module';

import { CurrencyMaskConfig, CURRENCY_MASK_CONFIG } from "ng2-currency-mask";

export const CustomCurrencyMaskConfig: CurrencyMaskConfig = {
  align: "left",
  allowNegative: false,
  decimal: ",",
  precision: 2,
  prefix: "€ ",
  suffix: "",
  thousands: "."
};

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
  providers: [
    CurrencyPipe,
    { provide: CURRENCY_MASK_CONFIG, useValue: CustomCurrencyMaskConfig }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SendMessagesModule { }
