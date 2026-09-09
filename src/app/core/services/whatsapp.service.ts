import { Injectable } from '@angular/core';

import { appConfig } from '../config/app-config';
import { Property } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  createPropertyInterestLink(property: Property): string {
    const message = [
      `Olá, ${appConfig.brand.brokerName}! Vi este imóvel no seu site e gostaria de saber mais:`,
      '',
      `${this.propertyType(property)} em ${property.bairro}, ${property.cidade}`,
      `Código do imóvel: ${property.id}`,
      new URL(`/imoveis/${property.id}`, appConfig.siteUrl).href,
      '',
      'Pode me passar mais informações?'
    ].join('\n');

    return this.createLink(message);
  }

  createContactLink(): string {
    return this.createLink(`Olá, ${appConfig.brand.brokerName}! Vi os imóveis no seu site e gostaria de ajuda para encontrar uma opção e agendar uma visita. Podemos conversar?`);
  }

  private propertyType(property: Property): string {
    return { CASA: 'Casa', APARTAMENTO: 'Apartamento', TERRENO: 'Terreno', COMERCIAL: 'Imóvel comercial', CHACARA: 'Chácara', OUTRO: 'Imóvel' }[property.tipo] ?? 'Imóvel';
  }

  private createLink(message: string): string {
    const url = new URL(`https://wa.me/${appConfig.brand.whatsappNumber}`);
    url.searchParams.set('text', message);
    return url.href;
  }
}
