import { Routes } from '@angular/router';
import { AdminComponent } from './components/admin/admin.component';
import { LivreurComponent } from './components/livreur/livreur.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'admin', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'livreur', component: LivreurComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'admin' }
];
