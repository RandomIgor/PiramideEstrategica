import React, { useState } from 'react';
import { GAME_MODES } from '../constants/game';
import type { GameMode } from '../constants/game';

interface ModeSelectorProps {
  onSelectMode: (mode: GameMode, isPrivate?: boolean) => void;
  onBack: () => void;
  isMultiplayer?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode, onBack, isMultiplayer }) => {
  const [isExtended, setIsExtended] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Elige tu Pirámide</h2>
        <button className="btn" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white' }} onClick={onBack}>Volver</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div 
          onClick={() => setIsExtended(false)}
          style={{ padding: '1rem', flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: '8px', border: !isExtended ? '2px solid var(--color-primary)' : '2px solid var(--glass-border)', background: !isExtended ? 'rgba(230,177,42,0.1)' : 'rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
        >
          <h3 style={{ margin: 0, color: !isExtended ? 'var(--color-primary)' : '#ccc' }}>Modo Casual</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#aaa' }}>Juego clásico de cartas.</p>
        </div>
        <div 
          onClick={() => setIsExtended(true)}
          style={{ padding: '1rem', flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: '8px', border: isExtended ? '2px solid var(--color-secondary)' : '2px solid var(--glass-border)', background: isExtended ? 'rgba(92,37,141,0.2)' : 'rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
        >
          <h3 style={{ margin: 0, color: isExtended ? 'var(--color-secondary)' : '#ccc' }}>Modo Extendido</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#aaa' }}>Botes, Draft, Habilidades y Espejismos.</p>
        </div>
      </div>
      
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        
        {isMultiplayer && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid #95a5a6' }}>
            <input 
              type="checkbox" 
              checked={isPrivate} 
              onChange={e => setIsPrivate(e.target.checked)} 
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ color: '#ccc' }}>Partida Privada (oculta, unirse por código)</span>
          </label>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {GAME_MODES.map((mode) => (
          <div 
            key={mode.id}
            className="glass-panel"
            style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--color-primary-glow)' }}
            onClick={() => {
              const selectedMode = { ...mode, rules: { tiePot: isExtended, skirmishx2: isExtended, extendedRules: isExtended } };
              if (isExtended) {
                // Find token with highest count to replace with Espejismo
                let maxToken = 'SOL';
                let maxCount = 0;
                Object.entries(selectedMode.inventory).forEach(([type, count]) => {
                  if (count > maxCount) {
                    maxCount = count;
                    maxToken = type;
                  }
                });
                if (maxCount > 0) {
                  selectedMode.inventory = { ...selectedMode.inventory, [maxToken]: maxCount - 1, ESPEJISMO: 1 };
                }
              }
              onSelectMode(selectedMode, isPrivate);
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.4rem' }}>{mode.name}</h3>
              <span style={{ fontSize: '0.9rem', color: '#ccc', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                Niveles: {mode.levels} | Fichas: {mode.totalTokens}
              </span>
            </div>
            <p style={{ margin: '0.8rem 0 0 0', fontSize: '1rem', color: '#eaeaea' }}>{mode.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
