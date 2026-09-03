import { Injectable } from '@angular/core';

import { appConfig } from '../config/app-config';
import { Property } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  createPropertyInterestLink(property: Property): string {
    const message = [
      `Ola, Eliane! Tenho interesse no imovel "${property.titulo}".`,
      `Ele fica em ${property.bairro}, ${property.cidade}.`,
      'Pode me passar mais informacoes?'
    ].join(' ');

    return `https://wa.me/${appConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
}
