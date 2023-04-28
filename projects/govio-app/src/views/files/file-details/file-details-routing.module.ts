import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FileDetailsComponent } from './file-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: FileDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FileDetailsRoutingModule {}
