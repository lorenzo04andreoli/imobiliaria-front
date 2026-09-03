import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { appConfig } from '../../../core/config/app-config';
import { Property, PropertyImage } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';

@Component({
  selector: 'app-property-images',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './property-images.component.html',
  styleUrl: './property-images.component.scss'
})
export class PropertyImagesComponent implements OnInit {
  readonly property = signal<Property | null>(null);
  readonly images = signal<PropertyImage[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly updatingId = signal<number | null>(null);
  readonly error = signal(false);

  private readonly formBuilder = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly propertyId = this.getPropertyId();

  readonly form = this.formBuilder.nonNullable.group({
    url: ['', [Validators.required]],
    ordem: [null as number | null, [Validators.min(0)]],
    capa: [false]
  });

  ngOnInit(): void {
    if (this.propertyId === null) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.loadData();
  }

  loadData(): void {
    if (this.propertyId === null) {
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    this.propertyService.findAdminById(this.propertyId).subscribe({
      next: (property) => {
        this.property.set(property);
        this.images.set(this.sortedImages(property.imagens));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  addImage(): void {
    if (this.form.invalid || this.saving() || this.propertyId === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(false);

    this.propertyService.addImage(this.propertyId, this.form.getRawValue()).subscribe({
      next: (image) => {
        this.images.update((items) => this.sortedImages([...items, image]));
        this.form.reset({ url: '', ordem: null, capa: false });
        this.saving.set(false);
      },
      error: () => {
        this.error.set(true);
        this.saving.set(false);
      }
    });
  }

  setCover(image: PropertyImage): void {
    if (this.propertyId === null || this.updatingId() !== null) {
      return;
    }

    this.updatingId.set(image.id);
    this.error.set(false);

    this.propertyService.setCoverImage(this.propertyId, image.id).subscribe({
      next: () => {
        this.images.update((items) =>
          items.map((item) => ({
            ...item,
            capa: item.id === image.id
          }))
        );
        this.updatingId.set(null);
      },
      error: () => {
        this.error.set(true);
        this.updatingId.set(null);
      }
    });
  }

  removeImage(image: PropertyImage): void {
    if (this.propertyId === null || this.updatingId() !== null) {
      return;
    }

    this.updatingId.set(image.id);
    this.error.set(false);

    this.propertyService.removeImage(this.propertyId, image.id).subscribe({
      next: () => {
        this.images.update((items) => items.filter((item) => item.id !== image.id));
        this.updatingId.set(null);
      },
      error: () => {
        this.error.set(true);
        this.updatingId.set(null);
      }
    });
  }

  imageUrl(image: PropertyImage): string {
    if (image.url.startsWith('http')) {
      return image.url;
    }

    return `${this.apiOrigin()}${image.url}`;
  }

  private sortedImages(images: PropertyImage[]): PropertyImage[] {
    return [...images].sort((first, second) => first.ordem - second.ordem);
  }

  private apiOrigin(): string {
    if (!appConfig.apiUrl.startsWith('http')) {
      return '';
    }

    return new URL(appConfig.apiUrl).origin;
  }

  private getPropertyId(): number | null {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }

    return id;
  }
}
