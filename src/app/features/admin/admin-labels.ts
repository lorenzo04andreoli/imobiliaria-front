import { PropertyStatus, PropertyType } from '../../core/models/property.model';

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'No site',
  INATIVO: 'Oculto',
  VENDIDO: 'Vendido',
};

export const TYPE_LABELS: Record<PropertyType, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  TERRENO: 'Terreno',
  COMERCIAL: 'Comercial',
  CHACARA: 'Chácara',
  OUTRO: 'Outro',
};
