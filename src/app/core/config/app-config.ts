import { environment } from '../../../environments/environment';

export const appConfig = {
  siteUrl: 'https://elianecarneiroimoveis.com.br',
  apiUrl: environment.apiUrl,
  brand: environment.brand
} as const;
