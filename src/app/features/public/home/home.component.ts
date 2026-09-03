import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { appConfig } from '../../../core/config/app-config';
import { Property } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';
import { WhatsappService } from '../../../core/services/whatsapp.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  readonly properties = signal<Property[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  private readonly propertyService = inject(PropertyService);
  private readonly whatsappService = inject(WhatsappService);

  ngOnInit(): void {
    this.propertyService.listFeatured().subscribe({
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

  private apiOrigin(): string {
    if (!appConfig.apiUrl.startsWith('http')) {
      return '';
    }

    return new URL(appConfig.apiUrl).origin;
  }
}
