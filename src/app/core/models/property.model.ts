export type PropertyType = 'CASA' | 'APARTAMENTO' | 'TERRENO' | 'CHACARA' | 'COMERCIAL' | 'OUTRO';

export type PropertyStatus = 'RASCUNHO' | 'PUBLICADO' | 'INATIVO' | 'VENDIDO';

export interface PropertyImage {
  id: number;
  url: string;
  ordem: number;
  capa: boolean;
}

export interface Property {
  id: number;
  titulo: string;
  descricao: string;
  preco: number;
  tipo: PropertyType;
  cidade: string;
  bairro: string;
  endereco: string | null;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  area: number | null;
  status: PropertyStatus;
  imagens: PropertyImage[];
  criadoEm: string;
  atualizadoEm: string;
}
