import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Property } from '../../../core/models/property.model';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyService } from '../../../core/services/property.service';

@Component({
  selector: 'app-properties',
  imports: [RouterLink],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss'
})
export class PropertiesComponent implements OnInit {
  readonly properties = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly updatingId = signal<number | null>(null);

  private readonly authService = inject(AuthService);
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading.set(true);
    this.error.set(false);

    this.propertyService.listAdmin().subscribe({
      next: (response) => {
        this.properties.set(response.content);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  publish(property: Property): void {
    this.updateStatus(property, () => this.propertyService.publish(property.id));
  }

  inactivate(property: Property): void {
    this.updateStatus(property, () => this.propertyService.inactivate(property.id));
  }

  markAsSold(property: Property): void {
    this.updateStatus(property, () => this.propertyService.markAsSold(property.id));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }

  formattedPrice(property: Property): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(property.preco);
  }

  private updateStatus(property: Property, request: () => ReturnType<PropertyService['publish']>): void {
    this.updatingId.set(property.id);

    request().subscribe({
      next: (updatedProperty) => {
        this.properties.update((items) =>
          items.map((item) => (item.id === updatedProperty.id ? updatedProperty : item))
        );
        this.updatingId.set(null);
      },
      error: () => {
        this.error.set(true);
        this.updatingId.set(null);
      }
    });
  }
}
