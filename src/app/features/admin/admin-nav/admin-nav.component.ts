import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.scss'
})
export class AdminNavComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
