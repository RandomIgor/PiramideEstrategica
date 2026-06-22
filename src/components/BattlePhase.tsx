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

  const handleTokenSelect = (colIndex: number) => {
    if (usedColsPlayer.includes(colIndex) || activeBattle) return;

    const row = currentLevel - 1;
    const playerKey = `${row}-${colIndex}`;
    const playerToken = playerPyramid[playerKey];

    const botCols = Array.from({ length: currentLevel }, (_, i) => i).filter(c => !usedColsBot.includes(c));
    const botChoiceCol = botCols[Math.floor(Math.random() * botCols.length)];
    const botTokenKey = `${row}-${botChoiceCol}`;
    const botToken = botPyramid[botTokenKey];

    const result = resolveBattle(playerToken, botToken, currentLevel);
    const basePoints = 1;
    const isSpecial = mode.isSpecialRules;
    const pointsToAward = basePoints + (isSpecial && result !== 'TIE' ? tiePot : 0);
    const newTiePot = result === 'TIE' && isSpecial ? tiePot + 1 : 0;

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
      setCurrentLevel(activeBattle.levelObj + 1);
    } else {
      setUsedColsPlayer(newUsedP);
      setUsedColsBot(newUsedB);
    }
    setActiveBattle(null);
  };

  const renderCurrentRowTokens = () => {
    if (currentLevel > mode.levels) return null;
    const row = currentLevel - 1;
    const tokens = [];
    for (let c = 0; c < currentLevel; c++) {
      const token = playerPyramid[`${row}-${c}`];
      const isUsed = usedColsPlayer.includes(c);
      tokens.push(
        <button
          key={c}
          className="btn"
          disabled={isUsed}
          style={{
            fontSize: 'var(--token-font)', padding: '0.8rem', background: isUsed ? 'transparent' : 'var(--glass-bg)',
            border: '2px solid var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center',
            flex: '1 1 auto', minWidth: 'var(--token-size)',
            opacity: isUsed ? 0.2 : 1, cursor: isUsed ? 'default' : 'pointer'
          }}
          onClick={() => handleTokenSelect(c)}
        >
          {TOKENS[token].icon}
          <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#ccc' }}>
            {isUsed ? 'Usada' : 'Lanzar'}
          </span>
        </button>
      );
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        {tokens}
      </div>
    );
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
          {mode.isSpecialRules && (
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
          <div style={{ textAlign: 'center' }}>
            <h3>Nivel Actual: {currentLevel} de {mode.levels}</h3>
            <p style={{ color: '#aaa', marginTop: '0.5rem' }}>Selecciona una ficha para el próximo duelo de este nivel ({currentLevel - usedColsPlayer.length} restantes).</p>
            {renderCurrentRowTokens()}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '3rem', color: playerScore > botScore ? 'var(--color-primary)' : (playerScore < botScore ? 'var(--color-accent)' : 'white') }}>
              {playerScore > botScore ? '¡HAS GANADO!' : (playerScore < botScore ? '¡HAS PERDIDO!' : '¡EMPATE TÉCNICO!')}
            </h1>
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
              {activeBattle.result === 'TIE' && mode.isSpecialRules ? `Bote acumulado a: ${activeBattle.newTiePot}` : (activeBattle.result === 'TIE' ? 'Nadie suma puntos' : `+${activeBattle.points} Puntos`)}
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
