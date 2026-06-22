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
  
  const [logs, setLogs] = useState<{ id: number, text: string, type: 'normal' | 'info' }[]>([]);
  const [logCounter, setLogCounter] = useState(0);

  const addLog = (text: string, type: 'normal' | 'info') => {
    setLogs(prev => [{ id: logCounter, text, type }, ...prev]);
    setLogCounter(c => c + 1);
  };

  // Auto-selección cuando solo queda 1 ficha
  React.useEffect(() => {
    if (currentLevel <= mode.levels && currentLevel - usedColsPlayer.length === 1) {
      const remaining = Array.from({ length: currentLevel }, (_, i) => i).find(c => !usedColsPlayer.includes(c));
      if (remaining !== undefined) {
        const timer = setTimeout(() => handleTokenSelect(remaining), 1000);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedColsPlayer.length, currentLevel]);

  const handleTokenSelect = (colIndex: number) => {
    if (usedColsPlayer.includes(colIndex)) return;

    const row = currentLevel - 1;
    const playerKey = `${row}-${colIndex}`;
    const playerToken = playerPyramid[playerKey];

    // 1. Bot chooses randomly from its REMAINING row
    const botCols = Array.from({ length: currentLevel }, (_, i) => i).filter(c => !usedColsBot.includes(c));
    const botChoiceCol = botCols[Math.floor(Math.random() * botCols.length)];
    const botTokenKey = `${row}-${botChoiceCol}`;
    const botToken = botPyramid[botTokenKey];

    // 2. Resolve Normal Battle
    const result = resolveBattle(playerToken, botToken, currentLevel);
    let newPlayerScore = playerScore;
    let newBotScore = botScore;
    let newTiePot = tiePot;

    const basePoints = 1;
    const isSpecial = mode.isSpecialRules;
    const pointsToAward = basePoints + (isSpecial ? tiePot : 0);

    if (result === 'WIN') {
      newPlayerScore += pointsToAward;
      newTiePot = 0;
      addLog(`Duelo Nivel ${currentLevel}: Tu ${TOKENS[playerToken].name} VENCE al ${TOKENS[botToken].name} rival! (+${pointsToAward} pt)`, 'normal');
    } else if (result === 'LOSS') {
      newBotScore += pointsToAward;
      newTiePot = 0;
      addLog(`Duelo Nivel ${currentLevel}: Tu ${TOKENS[playerToken].name} PIERDE ante el ${TOKENS[botToken].name} rival!`, 'normal');
    } else {
      if (isSpecial) newTiePot += 1;
      addLog(`Duelo Nivel ${currentLevel}: ¡EMPATE entre ${TOKENS[playerToken].name}s! ${isSpecial ? `Bote acumulado a ${newTiePot}` : ''}`, 'normal');
    }

    setPlayerScore(newPlayerScore);
    setBotScore(newBotScore);
    setTiePot(newTiePot);

    const newUsedP = [...usedColsPlayer, colIndex];
    const newUsedB = [...usedColsBot, botChoiceCol];

    if (newUsedP.length === currentLevel) {
      setUsedColsPlayer([]);
      setUsedColsBot([]);
      if (currentLevel < mode.levels) {
        setCurrentLevel(currentLevel + 1);
        addLog(`-- Avanzando al Nivel ${currentLevel + 1} --`, 'info');
      } else {
        setCurrentLevel(currentLevel + 1); // Game over state
        addLog(`-- PARTIDA FINALIZADA --`, 'info');
      }
    } else {
      setUsedColsPlayer(newUsedP);
      setUsedColsBot(newUsedB);
    }
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
    <div className="glass-panel responsive-split animate-fade-in" style={{ width: '100%', maxWidth: '900px' }}>
      
      {/* Tablero Izquierdo */}
      <div style={{ flex: '1 1 300px' }}>
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
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={onFinish}>Volver al Menú</button>
          </div>
        )}
      </div>

      {/* Panel Derecho (Logs) */}
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1rem' }}>Registro de Batalla</h3>
        <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {logs.length === 0 && <p style={{ color: '#666', fontStyle: 'italic' }}>Las batallas aparecerán aquí...</p>}
          {logs.map(log => (
            <div key={log.id} style={{
              padding: '0.8rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              background: log.type === 'normal' ? 'rgba(230, 177, 42, 0.1)' : 'transparent',
              borderLeft: log.type === 'normal' ? '3px solid var(--color-primary)' : 'none',
              color: log.type === 'info' ? 'var(--color-secondary-light)' : 'white'
            }}>
              {log.text}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
