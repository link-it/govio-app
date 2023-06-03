import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MessagesComponent } from './messages.component';
import { MessageDetailsComponent } from './message-details/message-details.component';
import { SendMessagesComponent } from './send-messages/send-messages.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Messages' },
        component: MessagesComponent
      },
      {
        path: 'send',
        data: { breadcrumb: 'send' },
        component: SendMessagesComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: MessageDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MessagesRoutingModule {}
