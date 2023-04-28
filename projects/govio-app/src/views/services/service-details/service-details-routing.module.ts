import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServiceDetailsComponent } from './service-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ServiceDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServiceDetailsRoutingModule {}
