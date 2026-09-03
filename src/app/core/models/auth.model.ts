export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  id: number;
  nome: string;
  email: string;
  role: string;
  token: string;
  tokenType: string;
  expiresIn: number;
}
