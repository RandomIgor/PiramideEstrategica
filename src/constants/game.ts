export type TokenType = 'SOL' | 'FARAON' | 'DEVOTO' | 'SIERVO' | 'ESCARABAJO' | 'GATO';

export interface Token {
  id: TokenType;
  name: string;
  value: number;
  icon: string;
}

export const TOKENS: Record<TokenType, Token> = {
  SOL: { id: 'SOL', name: 'Sol', value: 5, icon: '☀️' },
  FARAON: { id: 'FARAON', name: 'Faraón', value: 4, icon: '👑' },
  DEVOTO: { id: 'DEVOTO', name: 'Devoto', value: 3, icon: '🕯️' },
  SIERVO: { id: 'SIERVO', name: 'Siervo', value: 2, icon: '🏺' },
  ESCARABAJO: { id: 'ESCARABAJO', name: 'Escarabajo', value: 1, icon: '🪲' },
  GATO: { id: 'GATO', name: 'Gato Místico', value: 6, icon: '🐈⬛' },
};

export interface GameMode {
  id: string;
  name: string;
  levels: number;
  totalTokens: number;
  description: string;
  inventory: Record<TokenType, number>;
  isSpecialRules?: boolean; // deprecated
  rules?: {
    tiePot: boolean;
    skirmishx2: boolean;
  };
}

export const GAME_MODES: GameMode[] = [
  {
    id: 'seila',
    name: 'Seila',
    levels: 3,
    totalTokens: 6,
    description: 'Rápido y letal. Pirámide pequeña.',
    inventory: {
      SOL: 1,
      FARAON: 0,
      DEVOTO: 2,
      SIERVO: 0,
      ESCARABAJO: 3,
      GATO: 0
    }
  },
  {
    id: 'meidum',
    name: 'Meidum',
    levels: 4,
    totalTokens: 10,
    description: 'Se introduce el Faraón.',
    inventory: {
      SOL: 1,
      FARAON: 2,
      DEVOTO: 3,
      SIERVO: 0,
      ESCARABAJO: 4,
      GATO: 0
    }
  },
  {
    id: 'guiza',
    name: 'Guiza',
    levels: 5,
    totalTokens: 15,
    description: 'Partidas estratégicas profundas.',
    inventory: {
      SOL: 1,
      FARAON: 2,
      DEVOTO: 3,
      SIERVO: 4,
      ESCARABAJO: 5,
      GATO: 0
    }
  },
  {
    id: 'keops',
    name: 'Keops',
    levels: 6,
    totalTokens: 21,
    description: 'Introduce el Gato Místico.',
    inventory: {
      SOL: 2,
      FARAON: 3,
      DEVOTO: 4,
      SIERVO: 5,
      ESCARABAJO: 6,
      GATO: 1
    }
  }
];
