import { Component, ElementRef, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

import { appConfig } from '../../../core/config/app-config';
import { Property, PropertyImage, PropertyRequest, PropertyStatus, PropertyType } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

interface PendingImageItem {
  type: 'pending';
  id: string;
  file: File;
  previewUrl: string;
}

interface ExistingImageItem {
  type: 'existing';
  id: string;
  image: PropertyImage;
}

type EditableImage = ExistingImageItem | PendingImageItem;

@Component({
  selector: 'app-property-form',
  imports: [ReactiveFormsModule, RouterLink, AdminNavComponent],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.scss'
})
export class PropertyFormComponent implements OnInit, OnDestroy {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal(false);
  readonly editableImages = signal<EditableImage[]>([]);
  readonly removedImageIds = signal<number[]>([]);
  readonly propertyTypes: PropertyType[] = ['CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL', 'CHACARA', 'OUTRO'];
  readonly propertyStatuses: PropertyStatus[] = ['RASCUNHO', 'PUBLICADO', 'INATIVO', 'VENDIDO'];

  private readonly formBuilder = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyId = this.getPropertyId();
  private readonly imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');

  readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', [Validators.required]],
    descricao: ['', [Validators.required]],
    preco: [0, [Validators.required, Validators.min(0)]],
    tipo: ['CASA' as PropertyType, [Validators.required]],
    cidade: ['', [Validators.required]],
    bairro: ['', [Validators.required]],
    endereco: [''],
    quartos: [null as number | null, [Validators.min(0)]],
    banheiros: [null as number | null, [Validators.min(0)]],
    vagas: [null as number | null, [Validators.min(0)]],
    area: [null as number | null, [Validators.min(0)]],
    status: ['RASCUNHO' as PropertyStatus, [Validators.required]]
  });

  ngOnInit(): void {
    if (this.propertyId === null) {
      return;
    }

    this.loading.set(true);

    this.propertyService.findAdminById(this.propertyId).subscribe({
      next: (property) => {
        this.form.patchValue({
          titulo: property.titulo,
          descricao: property.descricao,
          preco: property.preco,
          tipo: property.tipo,
          cidade: property.cidade,
          bairro: property.bairro,
          endereco: property.endereco ?? '',
          quartos: property.quartos,
          banheiros: property.banheiros,
          vagas: property.vagas,
          area: property.area,
          status: property.status
        });
        this.editableImages.set(
          this.sortImages(property.imagens).map((image) => ({
            type: 'existing',
            id: `existing-${image.id}`,
            image
          }))
        );
        this.removedImageIds.set([]);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  title(): string {
    return this.propertyId === null ? 'Novo imovel' : 'Editar imovel';
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(false);

    const request = this.propertyId === null
      ? this.propertyService.create(this.toRequest())
      : this.propertyService.update(this.propertyId, this.toRequest());

    request.pipe(switchMap((property) => this.syncImages(property))).subscribe({
      next: () => {
        this.clearImages();
        this.saving.set(false);
        this.router.navigateByUrl('/admin/imoveis');
      },
      error: () => {
        this.saving.set(false);
        this.error.set(true);
      }
    });
  }

  selectImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    const images = files.map((file) => ({
      type: 'pending' as const,
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    this.editableImages.update((items) => [...items, ...images]);
    input.value = '';
  }

  removeImage(image: EditableImage): void {
    if (image.type === 'pending') {
      URL.revokeObjectURL(image.previewUrl);
      this.editableImages.update((items) => items.filter((item) => item.id !== image.id));
      return;
    }

    this.removedImageIds.update((ids) => [...ids, image.image.id]);
    this.editableImages.update((items) => items.filter((item) => item.id !== image.id));
  }

  moveImage(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) {
      return;
    }

    this.editableImages.update((items) => {
      const nextItems = [...items];
      const [image] = nextItems.splice(fromIndex, 1);
      nextItems.splice(toIndex, 0, image);
      return nextItems;
    });
  }

  startDraggingImage(event: DragEvent, index: number): void {
    event.dataTransfer?.setData('text/plain', String(index));
  }

  dropImage(event: DragEvent, toIndex: number): void {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer?.getData('text/plain'));

    if (!Number.isInteger(fromIndex)) {
      return;
    }

    this.moveImage(fromIndex, toIndex);
  }

  clearImages(): void {
    this.editableImages().forEach((image) => {
      if (image.type === 'pending') {
        URL.revokeObjectURL(image.previewUrl);
      }
    });
    this.editableImages.set([]);

    const input = this.imageInput();

    if (input) {
      input.nativeElement.value = '';
    }
  }

  imageSource(image: EditableImage): string {
    if (image.type === 'pending') {
      return image.previewUrl;
    }

    if (image.image.url.startsWith('http')) {
      return image.image.url;
    }

    return `${this.apiOrigin()}${image.image.url}`;
  }

  imageName(image: EditableImage): string {
    return image.type === 'pending' ? image.file.name : 'Imagem cadastrada';
  }

  ngOnDestroy(): void {
    this.clearImages();
  }

  private toRequest(): PropertyRequest {
    const rawValue = this.form.getRawValue();

    return {
      ...rawValue,
      endereco: this.emptyToNull(rawValue.endereco),
      quartos: this.numberOrNull(rawValue.quartos),
      banheiros: this.numberOrNull(rawValue.banheiros),
      vagas: this.numberOrNull(rawValue.vagas),
      area: this.numberOrNull(rawValue.area)
    };
  }

  private emptyToNull(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private numberOrNull(value: number | null): number | null {
    return value === null ? null : Number(value);
  }

  private syncImages(property: Property): Observable<PropertyImage[]> {
    const images = this.editableImages();
    const removedImageIds = this.removedImageIds();
    const removeImages = removedImageIds.length > 0
      ? forkJoin(removedImageIds.map((imageId) => this.propertyService.removeImage(property.id, imageId)))
      : of([]);

    if (images.length === 0) {
      return removeImages.pipe(switchMap(() => of([])));
    }

    const savedImages = images.map((image, index) => {
      if (image.type === 'existing') {
        return of(image.image);
      }

      return this.propertyService.uploadImage(property.id, image.file, index, index === 0);
    });

    return removeImages.pipe(
      switchMap(() => forkJoin(savedImages)),
      switchMap((orderedImages) =>
        this.propertyService.reorderImages(
          property.id,
          orderedImages.map((image) => image.id)
        )
      ),
      switchMap((orderedImages) => {
        const coverImage = orderedImages[0];

        if (!coverImage) {
          return of(orderedImages);
        }

        return this.propertyService.setCoverImage(property.id, coverImage.id).pipe(
          switchMap(() => of(orderedImages))
        );
      })
    );
  }

  private getPropertyId(): number | null {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }

    return id;
  }

  private sortImages(images: PropertyImage[]): PropertyImage[] {
    return [...images].sort((first, second) => first.ordem - second.ordem);
  }

  private apiOrigin(): string {
    if (!appConfig.apiUrl.startsWith('http')) {
      return '';
    }

    return new URL(appConfig.apiUrl).origin;
  }
}
