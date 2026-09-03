import { environment } from '../../../environments/environment';

export const appConfig = {
  apiUrl: environment.apiUrl,
  brand: environment.brand
} as const;
