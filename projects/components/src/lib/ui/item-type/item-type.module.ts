import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { MarkdownModule } from 'ngx-markdown';
import { GravatarModule } from 'ngx-gravatar';

import { ItemTypeComponent } from './item-type.component';

@NgModule({
  declarations: [
    ItemTypeComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    TooltipModule,
    MarkdownModule,
    GravatarModule
  ],
  exports: [
    ItemTypeComponent
  ]
})
export class ItemTypeModule { }
