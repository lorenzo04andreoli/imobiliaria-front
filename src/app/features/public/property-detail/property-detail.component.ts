import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { appConfig } from '../../../core/config/app-config';
import { Property, PropertyImage } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';
import { WhatsappService } from '../../../core/services/whatsapp.service';

@Component({
  selector: 'app-property-detail',
  imports: [RouterLink],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss'
})
export class PropertyDetailComponent implements OnInit {
  readonly brand = appConfig.brand;
  readonly property = signal<Property | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly activeImageIndex = signal<number | null>(null);
  readonly menuOpen = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly propertyService = inject(PropertyService);
  private readonly whatsappService = inject(WhatsappService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.propertyService.findById(id).subscribe({
      next: (property) => {
        this.property.set(property);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  images(property: Property): PropertyImage[] {
    return [...property.imagens].sort((first, second) => first.ordem - second.ordem);
  }

  openGallery(index: number): void {
    this.activeImageIndex.set(index);
  }

  closeGallery(): void {
    this.activeImageIndex.set(null);
  }

  toggleMenu(): void {
    this.menuOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  previousImage(property: Property): void {
    const index = this.activeImageIndex();
    const images = this.images(property);

    if (index === null || images.length === 0) {
      return;
    }

    this.activeImageIndex.set(index === 0 ? images.length - 1 : index - 1);
  }

  nextImage(property: Property): void {
    const index = this.activeImageIndex();
    const images = this.images(property);

    if (index === null || images.length === 0) {
      return;
    }

    this.activeImageIndex.set(index === images.length - 1 ? 0 : index + 1);
  }

  imageUrl(image: PropertyImage): string {
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

  propertyDetails(property: Property): { label: string; value: string }[] {
    return [
      property.quartos !== null ? { label: 'Quartos', value: String(property.quartos) } : null,
      property.banheiros !== null ? { label: 'Banheiros', value: String(property.banheiros) } : null,
      property.vagas !== null ? { label: 'Vagas', value: String(property.vagas) } : null,
      property.area !== null ? { label: 'Area', value: `${property.area} m2` } : null
    ].filter((item): item is { label: string; value: string } => item !== null);
  }

  propertySummary(property: Property): string {
    const details = this.propertyDetails(property)
      .map((detail) => detail.value)
      .join(', ');

    return details ? `${property.bairro}, ${details}` : property.bairro;
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
