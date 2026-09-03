import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { appConfig } from '../config/app-config';
import { PageResponse } from '../models/page-response.model';
import {
  Property,
  PropertyImage,
  PropertyImageRequest,
  PropertyRequest,
  PropertyStatus,
  PropertyType
} from '../models/property.model';

export interface PropertyAdminFilters {
  q: string;
  cidade: string;
  tipo: PropertyType | '';
  status: PropertyStatus | '';
}

export interface PropertyAdminPageParams {
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = appConfig.apiUrl;

  listFeatured(): Observable<PageResponse<Property>> {
    const params = new HttpParams()
      .set('page', 0)
      .set('size', 6)
      .set('sort', 'criadoEm')
      .set('direction', 'desc');

    return this.http.get<PageResponse<Property>>(`${this.apiUrl}/imoveis`, { params });
  }

  listAdmin(
    filters?: PropertyAdminFilters,
    pageParams: PropertyAdminPageParams = { page: 0, size: 20 }
  ): Observable<PageResponse<Property>> {
    let params = new HttpParams()
      .set('page', pageParams.page)
      .set('size', pageParams.size)
      .set('sort', 'criadoEm')
      .set('direction', 'desc');

    if (filters?.q.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters?.cidade.trim()) {
      params = params.set('cidade', filters.cidade.trim());
    }

    if (filters?.tipo) {
      params = params.set('tipo', filters.tipo);
    }

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<PageResponse<Property>>(`${this.apiUrl}/admin/imoveis`, { params });
  }

  findById(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/imoveis/${id}`);
  }

  findAdminById(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/admin/imoveis/${id}`);
  }

  create(request: PropertyRequest): Observable<Property> {
    return this.http.post<Property>(`${this.apiUrl}/admin/imoveis`, request);
  }

  update(id: number, request: PropertyRequest): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/admin/imoveis/${id}`, request);
  }

  listImages(id: number): Observable<PropertyImage[]> {
    return this.http.get<PropertyImage[]>(`${this.apiUrl}/admin/imoveis/${id}/imagens`);
  }

  addImage(id: number, request: PropertyImageRequest): Observable<PropertyImage> {
    return this.http.post<PropertyImage>(`${this.apiUrl}/admin/imoveis/${id}/imagens`, request);
  }

  uploadImage(id: number, file: File, ordem: number | null, capa: boolean): Observable<PropertyImage> {
    const formData = new FormData();
    formData.append('arquivo', file);

    if (ordem !== null) {
      formData.append('ordem', String(ordem));
    }

    formData.append('capa', String(capa));

    return this.http.post<PropertyImage>(`${this.apiUrl}/admin/imoveis/${id}/imagens/upload`, formData);
  }

  setCoverImage(id: number, imageId: number): Observable<PropertyImage> {
    return this.http.patch<PropertyImage>(`${this.apiUrl}/admin/imoveis/${id}/imagens/${imageId}/capa`, {});
  }

  removeImage(id: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/imoveis/${id}/imagens/${imageId}`);
  }

  publish(id: number): Observable<Property> {
    return this.http.patch<Property>(`${this.apiUrl}/admin/imoveis/${id}/publicar`, {});
  }

  inactivate(id: number): Observable<Property> {
    return this.http.patch<Property>(`${this.apiUrl}/admin/imoveis/${id}/inativar`, {});
  }

  markAsSold(id: number): Observable<Property> {
    return this.http.patch<Property>(`${this.apiUrl}/admin/imoveis/${id}/vender`, {});
  }
}
