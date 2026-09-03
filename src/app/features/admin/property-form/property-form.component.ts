import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

import { Property, PropertyImage, PropertyRequest, PropertyStatus, PropertyType } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-property-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.scss'
})
export class PropertyFormComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal(false);
  readonly pendingImages = signal<PendingImage[]>([]);
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

    request.pipe(switchMap((property) => this.uploadPendingImages(property))).subscribe({
      next: () => {
        this.clearPendingImages();
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
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    this.pendingImages.update((items) => [...items, ...images]);
    input.value = '';
  }

  removePendingImage(image: PendingImage): void {
    URL.revokeObjectURL(image.previewUrl);
    this.pendingImages.update((items) => items.filter((item) => item.id !== image.id));
  }

  movePendingImage(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) {
      return;
    }

    this.pendingImages.update((items) => {
      const nextItems = [...items];
      const [image] = nextItems.splice(fromIndex, 1);
      nextItems.splice(toIndex, 0, image);
      return nextItems;
    });
  }

  startDraggingImage(event: DragEvent, index: number): void {
    event.dataTransfer?.setData('text/plain', String(index));
  }

  dropPendingImage(event: DragEvent, toIndex: number): void {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer?.getData('text/plain'));

    if (!Number.isInteger(fromIndex)) {
      return;
    }

    this.movePendingImage(fromIndex, toIndex);
  }

  clearPendingImages(): void {
    this.pendingImages().forEach((image) => URL.revokeObjectURL(image.previewUrl));
    this.pendingImages.set([]);

    const input = this.imageInput();

    if (input) {
      input.nativeElement.value = '';
    }
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

  private uploadPendingImages(property: Property): Observable<PropertyImage[]> {
    const images = this.pendingImages();

    if (images.length === 0) {
      return of([]);
    }

    const uploads = images.map((image, index) =>
      this.propertyService.uploadImage(property.id, image.file, index, index === 0)
    );

    return forkJoin(uploads);
  }

  private getPropertyId(): number | null {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }

    return id;
  }
}
