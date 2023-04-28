import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlaceholdersComponent } from './placeholders.component';
import { PlaceholderDetailsComponent } from './placeholder-details/placeholder-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Placeholders' },
        component: PlaceholdersComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: PlaceholderDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PlaceholdersRoutingModule {}
