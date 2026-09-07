import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  Property,
  PropertyStatus,
  PropertyType,
} from '../../../core/models/property.model';
import { PageResponse } from '../../../core/models/page-response.model';
import { PropertyService } from '../../../core/services/property.service';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';
import { appConfig } from '../../../core/config/app-config';
import { STATUS_LABELS, TYPE_LABELS } from '../admin-labels';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';
import {
  LucidePlus,
  LucidePencil,
  LucideExternalLink,
  LucideSearch,
  LucideHouse,
} from '@lucide/angular';

@Component({
  selector: 'app-properties',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminNavComponent,
    LucidePlus,
    LucidePencil,
    LucideExternalLink,
    LucideSearch,
    LucideHouse,
  ],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent implements OnInit {
  readonly properties = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly actionError = signal('');
  readonly feedback = signal(
    history.state?.saved ? 'Imóvel salvo com sucesso.' : '',
  );
  readonly statusLabels = STATUS_LABELS;
  readonly typeLabels = TYPE_LABELS;
  readonly updatingId = signal<number | null>(null);
  readonly pageInfo = signal<Omit<PageResponse<Property>, 'content'> | null>(
    null,
  );
  readonly propertyTypes: PropertyType[] = [
    'CASA',
    'APARTAMENTO',
    'TERRENO',
    'COMERCIAL',
    'CHACARA',
    'OUTRO',
  ];
  readonly propertyStatuses: PropertyStatus[] = [
    'RASCUNHO',
    'PUBLICADO',
    'INATIVO',
    'VENDIDO',
  ];

  private readonly formBuilder = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly confirmation = inject(ConfirmationService);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    tipo: ['' as PropertyType | ''],
    status: ['' as PropertyStatus | ''],
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(page = this.pageInfo()?.page ?? 0): void {
    this.loading.set(true);
    this.error.set(false);

    this.propertyService
      .listAdmin(this.filtersForm.getRawValue(), { page, size: 20 })
      .subscribe({
        next: (response) => {
          this.properties.set(response.content);
          this.pageInfo.set({
            page: response.page,
            size: response.size,
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            first: response.first,
            last: response.last,
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.loadProperties(0);
  }

  clearFilters(): void {
    this.filtersForm.reset({
      q: '',
      tipo: '',
      status: '',
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
      return 'Página 0 de 0';
    }

    return `Página ${pageInfo.page + 1} de ${pageInfo.totalPages}`;
  }

  async publish(property: Property): Promise<void> {
    if (
      !(await this.confirmation.ask({
        title: 'Publicar imóvel',
        message: `“${property.titulo}” ficará visível no site para os visitantes.`,
        confirmLabel: 'Publicar no site',
      }))
    )
      return;
    this.updateStatus(property, () =>
      this.propertyService.publish(property.id),
    );
  }

  async inactivate(property: Property): Promise<void> {
    if (
      !(await this.confirmation.ask({
        title: 'Ocultar por enquanto',
        message: `“${property.titulo}” sairá do site, mas continuará salvo no painel. Você pode publicá-lo novamente depois.`,
        confirmLabel: 'Ocultar imóvel',
        cancelLabel: 'Manter no site',
      }))
    )
      return;
    this.updateStatus(property, () =>
      this.propertyService.inactivate(property.id),
    );
  }

  async markAsSold(property: Property): Promise<void> {
    if (
      !(await this.confirmation.ask({
        title: 'Imóvel vendido',
        message: `“${property.titulo}” será marcado como vendido. O cadastro e as fotos continuarão salvos.`,
        confirmLabel: 'Marcar como vendido',
      }))
    )
      return;
    this.updateStatus(property, () =>
      this.propertyService.markAsSold(property.id),
    );
  }

  formattedPrice(property: Property): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(property.preco);
  }

  private updateStatus(
    property: Property,
    request: () => ReturnType<PropertyService['publish']>,
  ): void {
    if (this.updatingId() !== null) return;
    this.actionError.set('');
    this.updatingId.set(property.id);

    request().subscribe({
      next: (updatedProperty) => {
        this.properties.update((items) =>
          items.map((item) =>
            item.id === updatedProperty.id ? updatedProperty : item,
          ),
        );
        this.updatingId.set(null);
        this.feedback.set('Situação do imóvel atualizada.');
        this.loadProperties();
      },
      error: () => {
        this.actionError.set(
          'Não foi possível alterar a situação. Tente novamente.',
        );
        this.updatingId.set(null);
      },
    });
  }

  coverUrl(property: Property): string | null {
    const image =
      property.imagens.find((item) => item.capa) ??
      [...property.imagens].sort((a, b) => a.ordem - b.ordem)[0];
    if (!image) return null;
    if (image.url.startsWith('http')) return image.url;
    return (
      (appConfig.apiUrl.startsWith('http')
        ? new URL(appConfig.apiUrl).origin
        : '') + image.url
    );
  }
}
