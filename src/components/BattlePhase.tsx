import React, { useState } from 'react';
import type { GameMode, TokenType } from '../constants/game';
import { TOKENS } from '../constants/game';
import { resolveBattle } from '../utils/battle';

interface BattlePhaseProps {
  mode: GameMode;
  playerPyramid: Record<string, TokenType>;
  botPyramid: Record<string, TokenType>;
  onFinish: () => void;
}

export const BattlePhase: React.FC<BattlePhaseProps> = ({ mode, playerPyramid, botPyramid, onFinish }) => {
  const [localPlayerPyramid, setLocalPlayerPyramid] = useState<Record<string, TokenType>>(playerPyramid);
  const [currentLevel, setCurrentLevel] = useState(1); // 1 to mode.levels
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [tiePot, setTiePot] = useState(0);
  
  const [usedColsPlayer, setUsedColsPlayer] = useState<number[]>([]);
  const [usedColsBot, setUsedColsBot] = useState<number[]>([]);
  
  const [history, setHistory] = useState<{
    id: number; level: number; pToken: TokenType; bToken: TokenType; result: 'WIN' | 'LOSS' | 'TIE'; points: number;
  }[]>([]);

  const [activeBattle, setActiveBattle] = useState<{
    playerToken: TokenType; botToken: TokenType; result: 'WIN' | 'LOSS' | 'TIE'; points: number; newTiePot: number; colIndex: number; botColIndex: number; levelObj: number;
  } | null>(null);

  const [showHistory, setShowHistory] = useState(false);

  // Habilidades (Modo Extendido)
  const [usedHorus, setUsedHorus] = useState(false);
  const [usedThot, setUsedThot] = useState(false);
  const [revealedBotCols, setRevealedBotCols] = useState<number[]>([]);
  const [isThotActive, setIsThotActive] = useState(false);
  const [thotFirstPick, setThotFirstPick] = useState<number | null>(null);

  const handleHorus = () => {
    if (usedHorus) return;
    const available = Array.from({ length: currentLevel }, (_, i) => i).filter(c => !usedColsBot.includes(c) && !revealedBotCols.includes(c));
    if (available.length > 0) {
      const pick = available[Math.floor(Math.random() * available.length)];
      setRevealedBotCols([...revealedBotCols, pick]);
    }
    setUsedHorus(true);
  };

  const handleThotSelect = (colIndex: number) => {
    if (thotFirstPick === null) {
      setThotFirstPick(colIndex);
    } else {
      if (thotFirstPick !== colIndex) {
        const row = currentLevel - 1;
        const key1 = `${row}-${thotFirstPick}`;
        const key2 = `${row}-${colIndex}`;
        const newPyramid = { ...localPlayerPyramid };
        const temp = newPyramid[key1];
        newPyramid[key1] = newPyramid[key2];
        newPyramid[key2] = temp;
        setLocalPlayerPyramid(newPyramid);
      }
      setIsThotActive(false);
      setThotFirstPick(null);
      setUsedThot(true);
    }
  };

  const handleTokenSelect = (colIndex: number) => {
    if (usedColsPlayer.includes(colIndex) || activeBattle) return;
    
    if (isThotActive) {
      handleThotSelect(colIndex);
      return;
    }

    const row = currentLevel - 1;
    const playerKey = `${row}-${colIndex}`;
    const playerToken = localPlayerPyramid[playerKey];

    const botCols = Array.from({ length: currentLevel }, (_, i) => i).filter(c => !usedColsBot.includes(c));
    const botChoiceCol = botCols[Math.floor(Math.random() * botCols.length)];
    const botTokenKey = `${row}-${botChoiceCol}`;
    const botToken = botPyramid[botTokenKey];

    const result = resolveBattle(playerToken, botToken, currentLevel, mode);
    const isLastBattle = usedColsPlayer.length === currentLevel - 1;
    let basePoints = mode.rules?.skirmishx2 && isLastBattle ? 2 : 1;
    
    // Mirage bonus
    if (mode.rules?.extendedRules) {
      if (playerToken === 'ESPEJISMO' && result === 'WIN') basePoints += 1;
      if (botToken === 'ESPEJISMO' && result === 'LOSS') basePoints += 1;
    }

    const isSpecialTie = mode.rules?.tiePot;
    const pointsToAward = basePoints + (isSpecialTie && result !== 'TIE' ? tiePot : 0);
    const newTiePot = result === 'TIE' && isSpecialTie ? tiePot + basePoints : 0;

    setActiveBattle({
      playerToken, botToken, result, points: pointsToAward, newTiePot, colIndex, botColIndex: botChoiceCol, levelObj: currentLevel
    });
  };

  const handleContinue = () => {
    if (!activeBattle) return;
    
    setHistory(prev => [{
      id: prev.length, level: activeBattle.levelObj,
      pToken: activeBattle.playerToken, bToken: activeBattle.botToken,
      result: activeBattle.result, points: activeBattle.points
    }, ...prev]);

    if (activeBattle.result === 'WIN') setPlayerScore(s => s + activeBattle.points);
    if (activeBattle.result === 'LOSS') setBotScore(s => s + activeBattle.points);
    setTiePot(activeBattle.newTiePot);

    const newUsedP = [...usedColsPlayer, activeBattle.colIndex];
    const newUsedB = [...usedColsBot, activeBattle.botColIndex];

    if (newUsedP.length === activeBattle.levelObj) {
      setUsedColsPlayer([]);
      setUsedColsBot([]);
      setRevealedBotCols([]);
      setCurrentLevel(activeBattle.levelObj + 1);
    } else {
      setUsedColsPlayer(newUsedP);
      setUsedColsBot(newUsedB);
    }
    setActiveBattle(null);
  };

  const renderPyramid = () => {
    const rows = [];
    for (let r = 0; r < mode.levels; r++) {
      const cols = r + 1;
      const rowTokens = [];
      
      const isPastRow = r < currentLevel - 1;
      const isFutureRow = r > currentLevel - 1;
      const isActiveRow = r === currentLevel - 1;

      for (let c = 0; c < cols; c++) {
        const tokenKey = `${r}-${c}`;
        const token = localPlayerPyramid[tokenKey];
        const isUsed = isActiveRow && usedColsPlayer.includes(c);
        const isThotSelected = isThotActive && thotFirstPick === c;

        rowTokens.push(
          <div
            key={c}
            className={`glass-panel battle-token ${isUsed ? 'used' : ''}`}
            style={{
              padding: '0.8rem', width: 'var(--token-size)', height: 'var(--token-size)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: 'var(--token-font)',
              background: isUsed ? 'transparent' : (isThotSelected ? 'rgba(46, 204, 113, 0.3)' : 'var(--glass-bg)'),
              border: isThotSelected ? '2px solid #2ecc71' : (isActiveRow && !isUsed ? '2px solid var(--color-primary)' : '2px solid var(--glass-border)'),
              cursor: (isActiveRow && !isUsed) ? 'pointer' : 'default',
              transition: 'all 0.2s',
              boxShadow: isThotSelected ? '0 0 15px rgba(46, 204, 113, 0.5)' : 'none'
            }}
            onClick={() => {
              if (isActiveRow && !isUsed && currentLevel <= mode.levels) {
                handleTokenSelect(c);
              }
            }}
          >
            {TOKENS[token].icon}
          </div>
        );
      }

      rows.push(
        <div 
          key={r} 
          className={isActiveRow && !isGameOver ? 'battle-row-active' : (isPastRow ? 'battle-row-past' : (isFutureRow ? 'battle-row-future' : ''))}
          style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', width: 'fit-content', margin: '0 auto 0.5rem auto' }}
        >
          {rowTokens}
        </div>
      );
    }
    return <div style={{ marginTop: '2rem' }}>{rows}</div>;
  };

  const isGameOver = currentLevel > mode.levels;

  return (
    <>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Fase de Batallas</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--color-primary)' }}>TÚ</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{playerScore}</p>
          </div>
          {mode.rules?.tiePot && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#ccc' }}>BOTE</h3>
              <p style={{ fontSize: '1.5rem', color: '#f39c12' }}>{tiePot}</p>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--color-accent)' }}>RIVAL</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{botScore}</p>
          </div>
        </div>

        {!isGameOver ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            {mode.rules?.extendedRules && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button 
                  className={`btn ${usedHorus ? 'btn-secondary' : 'btn-primary'}`} 
                  disabled={usedHorus || activeBattle !== null}
                  onClick={handleHorus}
                  style={{ opacity: usedHorus ? 0.5 : 1, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                  👁️ Ojo de Horus {usedHorus && '(Usado)'}
                </button>
                <button 
                  className={`btn ${usedThot ? 'btn-secondary' : (isThotActive ? 'btn-accent' : 'btn-primary')}`} 
                  disabled={usedThot || activeBattle !== null}
                  onClick={() => setIsThotActive(!isThotActive)}
                  style={{ opacity: usedThot ? 0.5 : 1, padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                  🔄 Dios Thot {usedThot && '(Usado)'} {isThotActive && '(Activo)'}
                </button>
              </div>
            )}
            
            {isThotActive && <p style={{ color: '#2ecc71', fontWeight: 'bold', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>Selecciona dos fichas de esta fila para intercambiarlas.</p>}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', minHeight: '60px' }}>
              {Array.from({ length: currentLevel }).map((_, c) => {
                const isRevealed = revealedBotCols.includes(c);
                const isUsed = usedColsBot.includes(c);
                return (
                  <div key={`bot-${c}`} style={{ width: '50px', height: '50px', border: '1px solid var(--color-accent)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: isUsed ? 'transparent' : 'rgba(231, 76, 60, 0.2)', opacity: isUsed ? 0.2 : 1 }}>
                    {isRevealed && !isUsed ? <span style={{ fontSize: '1.5rem' }}>{TOKENS[botPyramid[`${currentLevel - 1}-${c}`]].icon}</span> : (isUsed ? '' : '❓')}
                  </div>
                );
              })}
            </div>

            <h3>Nivel Actual: {currentLevel} de {mode.levels}</h3>
            <p style={{ color: '#aaa', marginTop: '0.5rem', marginBottom: '1rem' }}>Selecciona una ficha para el próximo duelo de este nivel ({currentLevel - usedColsPlayer.length} restantes).</p>
            {renderPyramid()}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '3rem', color: playerScore > botScore ? 'var(--color-primary)' : (playerScore < botScore ? 'var(--color-accent)' : 'white') }}>
              {playerScore > botScore ? '¡HAS GANADO!' : (playerScore < botScore ? '¡HAS PERDIDO!' : '¡EMPATE TÉCNICO!')}
            </h1>
            {renderPyramid()}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowHistory(true)}>Ver Historial</button>
              <button className="btn btn-primary" onClick={onFinish}>Volver al Menú</button>
            </div>
          </div>
        )}

        {!isGameOver && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setShowHistory(true)}>Historial de Batallas</button>
          </div>
        )}
      </div>

      {activeBattle && (
        <div className="modal-overlay">
          <div className="modal-content scale-in">
            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: activeBattle.result === 'WIN' ? 'var(--color-primary)' : (activeBattle.result === 'LOSS' ? 'var(--color-accent)' : 'white') }}>
              {activeBattle.result === 'WIN' ? '¡TÚ GANAS!' : (activeBattle.result === 'LOSS' ? '¡RIVAL GANA!' : '¡EMPATE!')}
            </h2>
            <p style={{ fontSize: '1.2rem', color: '#ccc' }}>
              {activeBattle.result === 'TIE' && mode.rules?.tiePot ? `Bote acumulado a: ${activeBattle.newTiePot}` : (activeBattle.result === 'TIE' ? 'Nadie suma puntos' : `+${activeBattle.points} Puntos`)}
            </p>
            
            <div className="battle-vs-container">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}>{TOKENS[activeBattle.playerToken].icon}</div>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Tú</p>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#666', fontStyle: 'italic' }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(231,76,60,0.3))' }}>{TOKENS[activeBattle.botToken].icon}</div>
                <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Rival</p>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem' }} onClick={handleContinue}>Continuar</button>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content scale-in" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>Historial de Batallas</h2>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {history.length === 0 && <p style={{ color: '#aaa', fontStyle: 'italic' }}>Aún no hay batallas registradas.</p>}
              {history.map(h => (
                <div key={h.id} className={`history-item ${h.result === 'WIN' ? 'win' : (h.result === 'LOSS' ? 'loss' : '')}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>{TOKENS[h.pToken].icon}</span>
                    <span style={{ color: '#666', fontWeight: 'bold' }}>vs</span>
                    <span style={{ fontSize: '2rem' }}>{TOKENS[h.bToken].icon}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: h.result === 'WIN' ? 'var(--color-primary)' : (h.result === 'LOSS' ? 'var(--color-accent)' : '#aaa') }}>
                      {h.result === 'WIN' ? 'GANAS' : (h.result === 'LOSS' ? 'PIERDES' : 'EMPATE')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Nivel {h.level}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setShowHistory(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
};
