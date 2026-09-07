import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { concatMap, from, Observable, of, switchMap, tap, toArray } from 'rxjs';
import {
  LucideArrowUp,
  LucideArrowDown,
  LucideImagePlus,
  LucideStar,
  LucideTrash2,
  LucideSave,
  LucideArrowLeft,
} from '@lucide/angular';
import { STATUS_LABELS, TYPE_LABELS } from '../admin-labels';
import { ConfirmationService } from '../../../shared/confirmation/confirmation.service';

import { appConfig } from '../../../core/config/app-config';
import {
  Property,
  PropertyImage,
  PropertyRequest,
  PropertyStatus,
  PropertyType,
} from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';
import { AdminNavComponent } from '../admin-nav/admin-nav.component';

const DEFAULT_CITY = 'Paranaguá';

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
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminNavComponent,
    LucideArrowUp,
    LucideArrowDown,
    LucideImagePlus,
    LucideStar,
    LucideTrash2,
    LucideSave,
    LucideArrowLeft,
  ],
  templateUrl: './property-form.component.html',
  styleUrl: './property-form.component.scss',
})
export class PropertyFormComponent implements OnInit, OnDestroy {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal(false);
  readonly loadError = signal(false);
  readonly step = signal(0);
  readonly imageError = signal('');
  readonly feedback = signal('');
  readonly saveProgress = signal('');
  readonly imageChanges = signal(false);
  readonly previewSource = signal('');
  private readonly photoDialog =
    viewChild<ElementRef<HTMLDialogElement>>('photoDialog');
  readonly statusLabels = STATUS_LABELS;
  readonly typeLabels = TYPE_LABELS;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly editableImages = signal<EditableImage[]>([]);
  readonly removedImageIds = signal<number[]>([]);
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private propertyId = this.getPropertyId();
  private readonly imageInput =
    viewChild<ElementRef<HTMLInputElement>>('imageInput');

  readonly form = this.formBuilder.nonNullable.group({
    titulo: ['', [Validators.required]],
    descricao: ['', [Validators.required]],
    preco: [0, [Validators.required, Validators.min(0)]],
    tipo: ['CASA' as PropertyType, [Validators.required]],
    cidade: [DEFAULT_CITY, [Validators.required]],
    bairro: ['', [Validators.required]],
    endereco: [''],
    quartos: [null as number | null, [Validators.min(0)]],
    banheiros: [null as number | null, [Validators.min(0)]],
    vagas: [null as number | null, [Validators.min(0)]],
    area: [null as number | null, [Validators.min(0)]],
    status: ['RASCUNHO' as PropertyStatus, [Validators.required]],
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
          cidade: property.cidade || DEFAULT_CITY,
          bairro: property.bairro,
          endereco: property.endereco ?? '',
          quartos: property.quartos,
          banheiros: property.banheiros,
          vagas: property.vagas,
          area: property.area,
          status: property.status,
        });
        this.editableImages.set(
          this.sortImages(property.imagens).map((image) => ({
            type: 'existing',
            id: `existing-${image.id}`,
            image,
          })),
        );
        this.removedImageIds.set([]);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  title(): string {
    return this.propertyId === null ? 'Novo imóvel' : 'Editar imóvel';
  }

  submit(): void {
    if (this.saving() || this.loading() || this.loadError()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.step.set(0);
      this.feedback.set('Revise os campos destacados antes de salvar.');
      setTimeout(() =>
        this.element.nativeElement
          .querySelector<HTMLElement>('.ng-invalid[formControlName]')
          ?.focus(),
      );
      return;
    }

    this.saving.set(true);
    this.error.set(false);
    this.saveProgress.set('Salvando dados...');

    const request =
      this.propertyId === null
        ? this.propertyService.create(this.toRequest())
        : this.propertyService.update(this.propertyId, this.toRequest());

    request
      .pipe(
        tap((property) => {
          this.propertyId = property.id;
        }),
        switchMap((property) => this.syncImages(property)),
      )
      .subscribe({
        next: () => {
          this.clearImages();
          this.saving.set(false);
          this.form.markAsPristine();
          this.imageChanges.set(false);
          this.router.navigateByUrl('/admin/imoveis', {
            state: { saved: true },
          });
        },
        error: () => {
          this.saving.set(false);
          this.error.set(true);
        },
      });
  }

  selectImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (this.saving()) return;
    this.imageError.set('');

    if (files.length === 0) {
      return;
    }

    const accepted = files.filter(
      (file) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
        file.size <= 5 * 1024 * 1024,
    );
    if (accepted.length !== files.length)
      this.imageError.set(
        'Algumas fotos não foram adicionadas. Aceitamos JPG, PNG ou WebP de até 5 MB por foto.',
      );
    const images = accepted.map((file) => ({
      type: 'pending' as const,
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    this.editableImages.update((items) => [...items, ...images]);
    if (images.length) this.imageChanges.set(true);
    input.value = '';
  }

  async removeImage(image: EditableImage): Promise<void> {
    if (this.saving()) return;
    if (
      !(await this.confirmation.ask({
        title: 'Remover esta foto',
        message:
          'Esta foto sairá do anúncio quando você salvar o imóvel. As outras fotos serão mantidas.',
        confirmLabel: 'Remover foto',
        cancelLabel: 'Manter foto',
        image: this.imageSource(image),
      }))
    )
      return;
    this.imageChanges.set(true);
    if (image.type === 'pending') {
      URL.revokeObjectURL(image.previewUrl);
      this.editableImages.update((items) =>
        items.filter((item) => item.id !== image.id),
      );
      return;
    }

    this.removedImageIds.update((ids) => [...ids, image.image.id]);
    this.editableImages.update((items) =>
      items.filter((item) => item.id !== image.id),
    );
  }

  moveImage(fromIndex: number, toIndex: number): void {
    const length = this.editableImages().length;
    if (
      this.saving() ||
      !Number.isInteger(fromIndex) ||
      !Number.isInteger(toIndex) ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= length ||
      toIndex >= length ||
      fromIndex === toIndex
    ) {
      return;
    }

    this.editableImages.update((items) => {
      const nextItems = [...items];
      const [image] = nextItems.splice(fromIndex, 1);
      nextItems.splice(toIndex, 0, image);
      return nextItems;
    });
    this.imageChanges.set(true);
    this.feedback.set(
      toIndex === 0 ? 'Foto de capa alterada.' : 'Ordem das fotos alterada.',
    );
  }

  setStep(step: number): void {
    this.step.set(step);
    this.feedback.set('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  canLeave(): boolean | Promise<boolean> {
    if (this.saving()) return false;
    if (!(this.form.dirty || this.imageChanges())) return true;
    return this.confirmation.ask({
      title: 'Sua edição ainda não foi salva',
      message:
        'Você pode continuar editando ou sair e deixar de lado as alterações desta edição.',
      confirmLabel: 'Sair sem salvar',
      cancelLabel: 'Continuar editando',
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.form.dirty || this.imageChanges() || this.saving())
      event.preventDefault();
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

  openPreview(image: EditableImage): void {
    this.previewSource.set(this.imageSource(image));
    this.photoDialog()?.nativeElement.showModal();
  }

  closePreview(): void {
    this.photoDialog()?.nativeElement.close();
    this.previewSource.set('');
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
      area: this.numberOrNull(rawValue.area),
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
    const removeImages = from(removedImageIds).pipe(
      concatMap((imageId) =>
        this.propertyService
          .removeImage(property.id, imageId)
          .pipe(
            tap(() =>
              this.removedImageIds.update((ids) =>
                ids.filter((id) => id !== imageId),
              ),
            ),
          ),
      ),
      toArray(),
    );

    if (images.length === 0) {
      return removeImages.pipe(switchMap(() => of([])));
    }

    // Record successful uploads immediately so retrying does not resend those photos.
    const savedImages = from(images).pipe(
      concatMap((image, index) => {
        if (image.type === 'existing') {
          return of(image.image);
        }

        this.saveProgress.set(
          `Enviando foto ${index + 1} de ${images.length}...`,
        );
        return this.propertyService
          .uploadImage(property.id, image.file, index, index === 0)
          .pipe(
            tap((saved) => {
              this.editableImages.update((items) =>
                items.map((item) =>
                  item.id === image.id
                    ? {
                        type: 'existing',
                        id: `existing-${saved.id}`,
                        image: saved,
                      }
                    : item,
                ),
              );
              URL.revokeObjectURL(image.previewUrl);
            }),
          );
      }),
      toArray(),
    );

    return removeImages.pipe(
      switchMap(() => savedImages),
      switchMap((orderedImages) =>
        this.propertyService.reorderImages(
          property.id,
          orderedImages.map((image) => image.id),
        ),
      ),
      switchMap((orderedImages) => {
        const coverImage = orderedImages[0];

        if (!coverImage) {
          return of(orderedImages);
        }

        return this.propertyService
          .setCoverImage(property.id, coverImage.id)
          .pipe(switchMap(() => of(orderedImages)));
      }),
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
