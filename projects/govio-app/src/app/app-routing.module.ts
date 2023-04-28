import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { AuthGuard, PermissionGuard } from '../guard';

import { GpLayoutComponent, SimpleLayoutComponent } from '../containers';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    component: SimpleLayoutComponent,
    children: [
      {
        path: 'login',
        loadChildren: () => import('../views/login/login.module').then(m => m.LoginModule)
      }
    ]
  },
  {
    path: '',
    component: GpLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '_home',
        loadChildren: () => import('../views/home/home.module').then(m => m.HomeModule),
      },
      {
        path: 'dashboard',
        loadChildren: () => import('../views/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'files',
        canActivate: [PermissionGuard],
        data: {  permission: 'FILES', grant: 'view' },
        loadChildren: () => import('../views/files/files.module').then(m => m.FilesModule)
      },
      {
        path: 'messages',
        canActivate: [PermissionGuard],
        data: {  permission: 'MESSAGES', grant: 'view' },
        loadChildren: () => import('../views/messages/messages.module').then(m => m.MessagesModule)
      },
      {
        path: 'service-instances',
        canActivate: [PermissionGuard],
        data: {  permission: 'SERVICE-INSTANCES', grant: 'view' },
        loadChildren: () => import('../views/services/services.module').then(m => m.ServicesModule)
      },
      {
        path: 'placeholders',
        canActivate: [PermissionGuard],
        data: {  permission: 'PLACEHOLDERS', grant: 'view' },
        loadChildren: () => import('../views/placeholders/placeholders.module').then(m => m.PlaceholdersModule)
      },
      {
        path: 'templates',
        canActivate: [PermissionGuard],
        data: {  permission: 'TEMPLATES', grant: 'view' },
        loadChildren: () => import('../views/templates/templates.module').then(m => m.TemplatesModule)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(
    routes,
    { preloadingStrategy: PreloadAllModules, enableTracing: false }
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
