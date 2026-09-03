import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/public/home/home.component').then((component) => component.HomeComponent)
  },
  {
    path: 'imoveis/:id',
    loadComponent: () =>
      import('./features/public/property-detail/property-detail.component').then(
        (component) => component.PropertyDetailComponent
      )
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then((component) => component.LoginComponent)
  },
  {
    path: 'admin/imoveis',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/properties/properties.component').then(
        (component) => component.PropertiesComponent
      )
  },
  {
    path: 'admin/imoveis/novo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/property-form/property-form.component').then(
        (component) => component.PropertyFormComponent
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
