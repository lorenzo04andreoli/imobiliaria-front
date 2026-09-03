import { environment } from '../../../environments/environment';

export const appConfig = {
  apiUrl: environment.apiUrl,
  whatsappNumber: environment.whatsappNumber
} as const;
