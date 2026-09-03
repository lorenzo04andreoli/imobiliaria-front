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
}
