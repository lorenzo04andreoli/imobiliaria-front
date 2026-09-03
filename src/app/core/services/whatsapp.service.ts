import { Injectable } from '@angular/core';

import { appConfig } from '../config/app-config';
import { Property } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  createPropertyInterestLink(property: Property): string {
    const message = [
      `Olá, ${appConfig.brand.brokerName}! Tenho interesse no imóvel "${property.titulo}".`,
      `Ele fica em ${property.bairro}, ${property.cidade}.`,
      'Pode me passar mais informações?'
    ].join(' ');

    return `https://wa.me/${appConfig.brand.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
}
