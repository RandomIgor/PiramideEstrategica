import { TOKENS } from '../constants/game';
import type { TokenType, GameMode } from '../constants/game';

export type BattleResult = 'WIN' | 'LOSS' | 'TIE';

export const resolveBattle = (player: TokenType, bot: TokenType, level: number, mode: GameMode): BattleResult => {
  if (player === bot) return 'TIE';

  // Find the weakest token in this mode's inventory
  let weakestToken: TokenType | null = null;
  let minVal = Infinity;
  Object.entries(mode.inventory).forEach(([type, count]) => {
    if (count > 0 && TOKENS[type as TokenType].value < minVal) {
      minVal = TOKENS[type as TokenType].value;
      weakestToken = type as TokenType;
    }
  });

  // Regla Especial: PLAGA
  if (weakestToken) {
    if (player === weakestToken && bot === 'SOL') return 'WIN';
    if (bot === weakestToken && player === 'SOL') return 'LOSS';
  }

  // Regla Especial: GATO MÍSTICO (Modo Keops)
  // En Nivel 1 pierde contra todos. En Nivel N, pierde contra (6 - N + 1).
  const gatoLosesToValue = 6 - level + 1;

  if (player === 'GATO') {
    if (level === 1) return 'LOSS'; 
    if (TOKENS[bot].value === gatoLosesToValue) return 'LOSS';
    return 'WIN';
  }

  if (bot === 'GATO') {
    if (level === 1) return 'WIN'; // Bot pierde contra todos, Player gana
    if (TOKENS[player].value === gatoLosesToValue) return 'WIN';
    return 'LOSS';
  }

  // Resolución normal por valor
  return TOKENS[player].value > TOKENS[bot].value ? 'WIN' : 'LOSS';
};

export const generateBotPyramid = (levels: number, inventory: Record<TokenType, number>): Record<string, TokenType> => {
  const pyramid: Record<string, TokenType> = {};
  const availableTokens: TokenType[] = [];
  
  Object.entries(inventory).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) availableTokens.push(type as TokenType);
  });
  
  // Barajar fichas (Fisher-Yates)
  for (let i = availableTokens.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableTokens[i], availableTokens[j]] = [availableTokens[j], availableTokens[i]];
  }

  let tokenIndex = 0;
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j <= i; j++) {
      pyramid[`${i}-${j}`] = availableTokens[tokenIndex++];
    }
  }

  return pyramid;
};
