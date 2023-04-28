import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FilesComponent } from './files.component';
import { FileDetailsComponent } from './file-details/file-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Files' },
        component: FilesComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: FileDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class FilesRoutingModule {}
