import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { TokenSegmentComponent } from './token-segment.component';

@NgModule({
  declarations: [
    TokenSegmentComponent
  ],
  imports: [
    CommonModule,
    TranslateModule
  ],
  exports: [
    TokenSegmentComponent
  ]
})
export class TokenSegmentModule { }
