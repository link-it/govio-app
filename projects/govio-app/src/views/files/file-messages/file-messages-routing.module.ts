import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FileMessagesComponent } from './file-messages.component';
import { FileMessageComponent } from '../file-message/file-message.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Messages' },
        component: FileMessagesComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: FileMessageComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FileMessagesRoutingModule {}
