import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TemplatesComponent } from './templates.component';
import { TemplateDetailsComponent } from './template-details/template-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Templates' },
        component: TemplatesComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: TemplateDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TemplatesRoutingModule {}
