import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { appConfig } from '../config/app-config';
import { PageResponse } from '../models/page-response.model';
import { Property } from '../models/property.model';

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

  listAdmin(): Observable<PageResponse<Property>> {
    const params = new HttpParams()
      .set('page', 0)
      .set('size', 20)
      .set('sort', 'criadoEm')
      .set('direction', 'desc');

    return this.http.get<PageResponse<Property>>(`${this.apiUrl}/admin/imoveis`, { params });
  }

  findById(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/imoveis/${id}`);
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
