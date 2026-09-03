import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PropertyRequest, PropertyStatus, PropertyType } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';

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
  readonly propertyTypes: PropertyType[] = ['CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL', 'CHACARA', 'OUTRO'];
  readonly propertyStatuses: PropertyStatus[] = ['RASCUNHO', 'PUBLICADO', 'INATIVO', 'VENDIDO'];

  private readonly formBuilder = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyId = this.getPropertyId();

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

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl('/admin/imoveis');
      },
      error: () => {
        this.saving.set(false);
        this.error.set(true);
      }
    });
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

  private getPropertyId(): number | null {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }

    return id;
  }
}
