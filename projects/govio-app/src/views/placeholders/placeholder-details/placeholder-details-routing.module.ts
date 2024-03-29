import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlaceholderDetailsComponent } from './placeholder-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: PlaceholderDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PlaceholderDetailsRoutingModule {}
