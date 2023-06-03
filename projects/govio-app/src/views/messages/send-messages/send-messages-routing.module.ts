import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SendMessagesComponent } from './send-messages.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: SendMessagesComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SendMessagesRoutingModule {}
