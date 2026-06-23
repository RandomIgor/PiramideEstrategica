import React, { useState, useEffect } from 'react';
import type { GameMode, TokenType } from '../constants/game';
import { TOKENS } from '../constants/game';

interface DraftPhaseProps {
  mode: GameMode;
  onComplete: (playerInventory: Record<TokenType, number>, botInventory: Record<TokenType, number>) => void;
}

export const DraftPhase: React.FC<DraftPhaseProps> = ({ mode, onComplete }) => {
  const [pool, setPool] = useState<Record<TokenType, number>>({} as any);
  const [playerInv, setPlayerInv] = useState<Record<TokenType, number>>({} as any);
  const [botInv, setBotInv] = useState<Record<TokenType, number>>({} as any);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  useEffect(() => {
    const initialPool: any = {};
    const emptyInv: any = {};
    Object.entries(mode.inventory).forEach(([type, count]) => {
      initialPool[type] = count * 2;
      emptyInv[type] = 0;
    });
    setPool(initialPool);
    setPlayerInv({ ...emptyInv });
    setBotInv({ ...emptyInv });
  }, [mode]);

  useEffect(() => {
    if (Object.keys(pool).length === 0) return; // Not initialized yet

    const totalLeft = Object.values(pool).reduce((a, b) => a + b, 0);
    
    if (totalLeft === 0) {
      setTimeout(() => onComplete(playerInv, botInv), 1000);
      return;
    }

    if (!isPlayerTurn) {
      const timer = setTimeout(() => {
        let bestToken: TokenType | null = null;
        let maxVal = -1;
        
        // Bot picks highest value token available (Espejismo is value 0 but maybe we give it some priority if SOL is picked?)
        // For simplicity, just pick highest value token
        Object.entries(pool).forEach(([type, count]) => {
          if (count > 0 && TOKENS[type as TokenType].value > maxVal) {
             maxVal = TOKENS[type as TokenType].value;
             bestToken = type as TokenType;
          }
        });
        
        if (bestToken) {
           setPool(prev => ({ ...prev, [bestToken!]: prev[bestToken!] - 1 }));
           setBotInv(prev => ({ ...prev, [bestToken!]: prev[bestToken!] + 1 }));
           setIsPlayerTurn(true);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, pool, playerInv, botInv, onComplete]);

  const handlePick = (type: TokenType) => {
    if (!isPlayerTurn || pool[type] === 0) return;
    
    setPool(prev => ({ ...prev, [type]: prev[type] - 1 }));
    setPlayerInv(prev => ({ ...prev, [type]: prev[type] + 1 }));
    setIsPlayerTurn(false);
  };

  const totalLeft = Object.keys(pool).length > 0 ? Object.values(pool).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'center' }}>
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-secondary)' }}>Draft Público</h2>
        <p style={{ color: '#ccc', fontSize: '1rem' }}>Fichas restantes en la mesa: <strong>{totalLeft}</strong></p>
        <p style={{ color: isPlayerTurn ? 'var(--color-primary)' : 'var(--color-accent)', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '1rem' }}>
          {totalLeft === 0 ? '¡Draft Finalizado!' : (isPlayerTurn ? '¡Es tu turno! Elige una ficha.' : 'El rival está eligiendo...')}
        </p>
      </div>

      <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '16px' }}>
        <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Centro de la Mesa</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          {Object.entries(pool).map(([type, count]) => (
            count > 0 && (
              <div 
                key={`pool-${type}`}
                className="inventory-token"
                onClick={() => handlePick(type as TokenType)}
                style={{ 
                  cursor: isPlayerTurn ? 'pointer' : 'not-allowed', 
                  opacity: isPlayerTurn ? 1 : 0.6,
                  transform: isPlayerTurn ? 'scale(1)' : 'scale(0.95)',
                  position: 'relative'
                }}
                title={TOKENS[type as TokenType].name}
              >
                {TOKENS[type as TokenType].icon}
                <span style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'var(--color-accent)', color: 'white', borderRadius: '50%', width: '24px', height: '24px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #222' }}>
                  {count}
                </span>
              </div>
            )
          ))}
          {totalLeft === 0 && <p style={{ color: '#aaa', fontStyle: 'italic' }}>No quedan fichas.</p>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
        <div style={{ flex: 1, padding: '1rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--color-primary)' }}>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Tu Inventario</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {Object.entries(playerInv).map(([type, count]) => {
              const tokens = [];
              for(let i=0; i<count; i++) {
                tokens.push(<div key={`p-${type}-${i}`} style={{ fontSize: '1.5rem' }} title={TOKENS[type as TokenType].name}>{TOKENS[type as TokenType].icon}</div>);
              }
              return tokens;
            })}
          </div>
        </div>

        <div style={{ flex: 1, padding: '1rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--color-accent)' }}>
          <h3 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>Inventario del Rival</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {Object.entries(botInv).map(([type, count]) => {
              const tokens = [];
              for(let i=0; i<count; i++) {
                tokens.push(<div key={`b-${type}-${i}`} style={{ fontSize: '1.5rem' }} title={TOKENS[type as TokenType].name}>{TOKENS[type as TokenType].icon}</div>);
              }
              return tokens;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
