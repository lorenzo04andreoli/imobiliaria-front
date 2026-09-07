import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import {
  LucideHouse,
  LucidePlus,
  LucideExternalLink,
  LucideLogOut,
} from '@lucide/angular';

@Component({
  selector: 'app-admin-nav',
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideHouse,
    LucidePlus,
    LucideExternalLink,
    LucideLogOut,
  ],
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.scss',
})
export class AdminNavComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.router.navigateByUrl('/admin/login').then((navigated) => {
      if (navigated) this.authService.logout();
    });
  }
}
