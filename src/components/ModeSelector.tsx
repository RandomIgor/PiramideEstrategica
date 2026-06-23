import React, { useState } from 'react';
import { GAME_MODES } from '../constants/game';
import type { GameMode } from '../constants/game';

interface ModeSelectorProps {
  onSelectMode: (mode: GameMode, isPrivate?: boolean) => void;
  onBack: () => void;
  isMultiplayer?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode, onBack, isMultiplayer }) => {
  const [useTiePot, setUseTiePot] = useState(false);
  const [useSkirmish, setUseSkirmish] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Elige tu Pirámide</h2>
        <button className="btn" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white' }} onClick={onBack}>Volver</button>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-primary)' }}>
          <input 
            type="checkbox" 
            checked={useTiePot} 
            onChange={e => setUseTiePot(e.target.checked)} 
            style={{ width: '20px', height: '20px' }}
          />
          <span>Bote Acumulativo en Empates</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-primary)' }}>
          <input 
            type="checkbox" 
            checked={useSkirmish} 
            onChange={e => setUseSkirmish(e.target.checked)} 
            style={{ width: '20px', height: '20px' }}
          />
          <span>Escaramuza x2 (Última batalla x2)</span>
        </label>
        
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
            onClick={() => onSelectMode({ ...mode, rules: { tiePot: useTiePot, skirmishx2: useSkirmish } }, isPrivate)}
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
