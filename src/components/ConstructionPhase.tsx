import React, { useState } from 'react';
import { TOKENS } from '../constants/game';
import type { GameMode, TokenType } from '../constants/game';

interface ConstructionPhaseProps {
  mode: GameMode;
  onComplete: (pyramid: Record<string, TokenType>) => void;
}

export const ConstructionPhase: React.FC<ConstructionPhaseProps> = ({ mode, onComplete }) => {
  // State for inventory
  const [inventory, setInventory] = useState<Record<TokenType, number>>({ ...mode.inventory });
  
  // State for the pyramid grid (key: "row-col", value: TokenType)
  const [pyramid, setPyramid] = useState<Record<string, TokenType>>({});

  // Detect touch device to disable drag and drop which ruins touch clicks
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const handleDragStart = (e: React.DragEvent, type: TokenType, source: 'inventory' | string) => {
    e.dataTransfer.setData('tokenType', type);
    e.dataTransfer.setData('source', source);
  };

  const handleDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('tokenType') as TokenType;
    const source = e.dataTransfer.getData('source');
    
    if (!type) return;

    const targetKey = `${targetRow}-${targetCol}`;
    const existingToken = pyramid[targetKey];

    // If we dragged from inventory
    if (source === 'inventory') {
      if (inventory[type] <= 0) return;
      
      const newInventory = { ...inventory, [type]: inventory[type] - 1 };
      
      // If there was a token here, put it back in inventory
      if (existingToken) {
        newInventory[existingToken] = (newInventory[existingToken] || 0) + 1;
      }
      
      setInventory(newInventory);
      setPyramid({ ...pyramid, [targetKey]: type });
    } 
    // If we dragged from another slot
    else {
      if (source === targetKey) return; // Same slot
      
      const newPyramid = { ...pyramid };
      newPyramid[targetKey] = type;
      
      // Handle the slot we came from
      if (existingToken) {
        newPyramid[source] = existingToken; // Swap
      } else {
        delete newPyramid[source];
      }
      setPyramid(newPyramid);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleInventoryClick = (type: TokenType) => {
    if (inventory[type] <= 0) return;
    
    // Find first empty slot top-to-bottom, left-to-right
    let foundRow = -1;
    let foundCol = -1;
    
    for (let i = 0; i < mode.levels; i++) {
      for (let j = 0; j <= i; j++) {
        if (!pyramid[`${i}-${j}`]) {
          foundRow = i;
          foundCol = j;
          break;
        }
      }
      if (foundRow !== -1) break;
    }
    
    if (foundRow !== -1) {
      const newInventory = { ...inventory, [type]: inventory[type] - 1 };
      setInventory(newInventory);
      setPyramid({ ...pyramid, [`${foundRow}-${foundCol}`]: type });
    }
  };

  const handleRemoveFromPyramid = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const type = pyramid[key];
    if (type) {
      setInventory({ ...inventory, [type]: inventory[type] + 1 });
      const newPyramid = { ...pyramid };
      delete newPyramid[key];
      setPyramid(newPyramid);
    }
  };

  const isComplete = Object.keys(pyramid).length === mode.totalTokens;

  // Generate pyramid rows
  const rows = [];
  for (let i = 0; i < mode.levels; i++) {
    const cols = [];
    for (let j = 0; j <= i; j++) {
      const key = `${i}-${j}`;
      const token = pyramid[key];
      cols.push(
        <div 
          key={key}
          className="pyramid-cell"
          onDrop={(e) => handleDrop(e, i, j)}
          onDragOver={handleDragOver}
          onClick={() => handleRemoveFromPyramid(i, j)}
          style={{
            width: 'var(--token-size)', height: 'var(--token-size)', 
            border: '2px dashed var(--glass-border)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--token-font)',
            background: token ? 'rgba(0,0,0,0.4)' : 'transparent',
            cursor: token ? 'pointer' : 'default',
            margin: '0 4px',
            boxShadow: token ? '0 4px 12px rgba(0,0,0,0.3) inset' : 'none',
            transition: 'all 0.2s',
            touchAction: 'manipulation',
            userSelect: 'none'
          }}
        >
          {token ? (
            <div 
              draggable={!isTouchDevice}
              onDragStart={(e) => handleDragStart(e, token, key)}
              title={TOKENS[token].name}
              style={{ cursor: isTouchDevice ? 'pointer' : 'grab', userSelect: 'none', pointerEvents: 'none' }}
            >
              {TOKENS[token].icon}
            </div>
          ) : ''}
        </div>
      );
    }
    rows.push(
      <div key={`row-${i}`} style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
        {cols}
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Construye tu Pirámide</h2>
        <p style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>{mode.name} ({mode.levels} niveles)</p>
        <p style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '0.5rem' }}>Arrastra o <b>haz clic</b> en las fichas para colocarlas. Pulsa en una ficha de la pirámide para quitarla.</p>
      </div>

      <div className="inventory-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', minHeight: '100px' }}>
        {(Object.entries(inventory) as [TokenType, number][]).map(([type, count]) => {
          if (count === 0) return null;
          const token = TOKENS[type];
          return (
            <div 
              key={type}
              draggable={!isTouchDevice}
              onDragStart={(e) => handleDragStart(e, type, 'inventory')}
              onClick={() => handleInventoryClick(type)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0.5rem 0.8rem', background: 'var(--glass-bg)', borderRadius: '12px',
                cursor: 'pointer', border: '1px solid var(--glass-border)',
                transition: 'transform 0.2s',
                touchAction: 'manipulation',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: 'var(--token-font)', userSelect: 'none' }}>{token.icon}</span>
              <span style={{ fontSize: '1rem', marginTop: '8px', fontWeight: 'bold' }}>x{count}</span>
            </div>
          );
        })}
        {isComplete && <div style={{ color: 'var(--color-primary)', fontStyle: 'italic', padding: '1rem', fontSize: '1.2rem' }}>¡Inventario vacío! La pirámide está lista.</div>}
      </div>

      <div className="pyramid-section" style={{ padding: '1rem 0' }}>
        {rows}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button 
          className="btn btn-primary" 
          disabled={!isComplete}
          style={{ opacity: isComplete ? 1 : 0.5, cursor: isComplete ? 'pointer' : 'not-allowed', width: '100%', maxWidth: '300px' }}
          onClick={() => onComplete(pyramid)}
        >
          Confirmar Formación
        </button>
      </div>
    </div>
  );
};
