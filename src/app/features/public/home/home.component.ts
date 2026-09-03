import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { appConfig } from '../../../core/config/app-config';
import { Property, PropertyType } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';
import { SeoService } from '../../../core/services/seo.service';
import { WhatsappService } from '../../../core/services/whatsapp.service';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  readonly brand = appConfig.brand;
  readonly properties = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly menuOpen = signal(false);
  readonly propertyTypes: PropertyType[] = ['CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL', 'CHACARA', 'OUTRO'];

  private readonly formBuilder = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly seoService = inject(SeoService);
  private readonly whatsappService = inject(WhatsappService);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    tipo: ['' as PropertyType | ''],
    precoMin: [null as number | null],
    precoMax: [null as number | null]
  });

  ngOnInit(): void {
    this.seoService.update({
      title: `${this.brand.siteName} | Imóveis em Paranaguá`,
      description: 'Imóveis selecionados em Paranaguá com atendimento direto pelo WhatsApp.'
    });
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading.set(true);
    this.error.set(false);

    this.propertyService.listFeatured(this.filtersForm.getRawValue()).subscribe({
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

  applyFilters(): void {
    this.loadProperties();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      q: '',
      tipo: '',
      precoMin: null,
      precoMax: null
    });
    this.loadProperties();
  }

  toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  coverImage(property: Property): string | null {
    const image = property.imagens.find((item) => item.capa) ?? property.imagens[0];

    if (!image) {
      return null;
    }

    if (image.url.startsWith('http')) {
      return image.url;
    }

    return `${this.apiOrigin()}${image.url}`;
  }

  formattedPrice(property: Property): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(property.preco);
  }

  propertyDetails(property: Property): string {
    return [
      property.quartos !== null ? `${property.quartos} quartos` : null,
      property.banheiros !== null ? `${property.banheiros} banheiros` : null,
      property.vagas !== null ? `${property.vagas} vagas` : null
    ]
      .filter(Boolean)
      .join(' - ');
  }

  whatsappLink(property: Property): string {
    return this.whatsappService.createPropertyInterestLink(property);
  }

  contactLink(): string {
    return `https://wa.me/${this.brand.whatsappNumber}`;
  }

  private apiOrigin(): string {
    if (!appConfig.apiUrl.startsWith('http')) {
      return '';
    }

    return new URL(appConfig.apiUrl).origin;
  }
}
