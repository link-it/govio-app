import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TemplateDetailsComponent } from './template-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: TemplateDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TemplateDetailsRoutingModule {}
