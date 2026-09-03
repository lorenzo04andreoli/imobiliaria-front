import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Property, PropertyStatus, PropertyType } from '../../../core/models/property.model';
import { PageResponse } from '../../../core/models/page-response.model';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyService } from '../../../core/services/property.service';

@Component({
  selector: 'app-properties',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss'
})
export class PropertiesComponent implements OnInit {
  readonly properties = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly updatingId = signal<number | null>(null);
  readonly pageInfo = signal<Omit<PageResponse<Property>, 'content'> | null>(null);
  readonly propertyTypes: PropertyType[] = ['CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL', 'CHACARA', 'OUTRO'];
  readonly propertyStatuses: PropertyStatus[] = ['RASCUNHO', 'PUBLICADO', 'INATIVO', 'VENDIDO'];

  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    cidade: [''],
    tipo: ['' as PropertyType | ''],
    status: ['' as PropertyStatus | '']
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(page = this.pageInfo()?.page ?? 0): void {
    this.loading.set(true);
    this.error.set(false);

    this.propertyService.listAdmin(this.filtersForm.getRawValue(), { page, size: 20 }).subscribe({
      next: (response) => {
        this.properties.set(response.content);
        this.pageInfo.set({
          page: response.page,
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          first: response.first,
          last: response.last
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.loadProperties(0);
  }

  clearFilters(): void {
    this.filtersForm.reset({
      q: '',
      cidade: '',
      tipo: '',
      status: ''
    });
    this.loadProperties(0);
  }

  previousPage(): void {
    const pageInfo = this.pageInfo();

    if (!pageInfo || pageInfo.first) {
      return;
    }

    this.loadProperties(pageInfo.page - 1);
  }

  nextPage(): void {
    const pageInfo = this.pageInfo();

    if (!pageInfo || pageInfo.last) {
      return;
    }

    this.loadProperties(pageInfo.page + 1);
  }

  pageLabel(): string {
    const pageInfo = this.pageInfo();

    if (!pageInfo || pageInfo.totalPages === 0) {
      return 'Pagina 0 de 0';
    }

    return `Pagina ${pageInfo.page + 1} de ${pageInfo.totalPages}`;
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
