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
  
  const [logs, setLogs] = useState<{ id: number, text: string, type: 'normal' | 'escaramuza' | 'info' }[]>([]);
  const [logCounter, setLogCounter] = useState(0);

  const addLog = (text: string, type: 'normal' | 'escaramuza' | 'info') => {
    setLogs(prev => [{ id: logCounter, text, type }, ...prev]);
    setLogCounter(c => c + 1);
  };

  const handleTokenSelect = (colIndex: number) => {
    const row = currentLevel - 1;
    const playerKey = `${row}-${colIndex}`;
    const playerToken = playerPyramid[playerKey];

    // 1. Bot chooses randomly from its row
    const botCols = Array.from({ length: currentLevel }, (_, i) => i);
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
      addLog(`Nivel ${currentLevel} Batalla: Tu ${TOKENS[playerToken].name} VENCE al ${TOKENS[botToken].name} rival! (+${pointsToAward} pt)`, 'normal');
    } else if (result === 'LOSS') {
      newBotScore += pointsToAward;
      newTiePot = 0;
      addLog(`Nivel ${currentLevel} Batalla: Tu ${TOKENS[playerToken].name} PIERDE ante el ${TOKENS[botToken].name} rival! (-${pointsToAward} pt al rival)`, 'normal');
    } else {
      if (isSpecial) newTiePot += 1;
      addLog(`Nivel ${currentLevel} Batalla: ¡EMPATE entre ${TOKENS[playerToken].name}s! ${isSpecial ? `Bote acumulado a ${newTiePot}` : ''}`, 'normal');
    }

    // 3. Resolve Escaramuzas (remaining tokens)
    const playerRemaining: TokenType[] = [];
    const botRemaining: TokenType[] = [];
    for (let c = 0; c < currentLevel; c++) {
      if (c !== colIndex) playerRemaining.push(playerPyramid[`${row}-${c}`]);
      if (c !== botChoiceCol) botRemaining.push(botPyramid[`${row}-${c}`]);
    }

    // Shuffle bot remaining to make skirmishes random
    botRemaining.sort(() => Math.random() - 0.5);

    for (let i = 0; i < playerRemaining.length; i++) {
      const pToken = playerRemaining[i];
      const bToken = botRemaining[i];
      const escResult = resolveBattle(pToken, bToken, currentLevel);
      const escBase = isSpecial ? 2 : 1;
      const escPoints = escBase + (isSpecial ? newTiePot : 0);

      if (escResult === 'WIN') {
        newPlayerScore += escPoints;
        newTiePot = 0;
        addLog(`Escaramuza: Tu ${TOKENS[pToken].name} VENCE a ${TOKENS[bToken].name}. (+${escPoints} pt)`, 'escaramuza');
      } else if (escResult === 'LOSS') {
        newBotScore += escPoints;
        newTiePot = 0;
        addLog(`Escaramuza: Tu ${TOKENS[pToken].name} PIERDE ante ${TOKENS[bToken].name}.`, 'escaramuza');
      } else {
        if (isSpecial) newTiePot += 2; // "+2 si es empate en escaramuza" solo en reglas especiales
        addLog(`Escaramuza: EMPATE de ${TOKENS[pToken].name}s. ${isSpecial ? `Bote a ${newTiePot}` : ''}`, 'escaramuza');
      }
    }

    setPlayerScore(newPlayerScore);
    setBotScore(newBotScore);
    setTiePot(newTiePot);

    if (currentLevel < mode.levels) {
      setCurrentLevel(currentLevel + 1);
      addLog(`-- Avanzando al Nivel ${currentLevel + 1} --`, 'info');
    } else {
      setCurrentLevel(currentLevel + 1); // Game over state
      addLog(`-- PARTIDA FINALIZADA --`, 'info');
    }
  };

  const renderCurrentRowTokens = () => {
    if (currentLevel > mode.levels) return null;
    const row = currentLevel - 1;
    const tokens = [];
    for (let c = 0; c < currentLevel; c++) {
      const token = playerPyramid[`${row}-${c}`];
      tokens.push(
        <button
          key={c}
          className="btn"
          style={{
            fontSize: '2rem', padding: '1rem', background: 'var(--glass-bg)',
            border: '2px solid var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}
          onClick={() => handleTokenSelect(c)}
        >
          {TOKENS[token].icon}
          <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#ccc' }}>Lanzar</span>
        </button>
      );
    }
    return (
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        {tokens}
      </div>
    );
  };

  const isGameOver = currentLevel > mode.levels;

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', width: '100%', maxWidth: '900px', display: 'flex', gap: '2rem' }}>
      
      {/* Tablero Izquierdo */}
      <div style={{ flex: 1 }}>
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
            <p style={{ color: '#aaa', marginTop: '0.5rem' }}>Selecciona tu ficha para la batalla normal de este nivel. Las demás irán a escaramuzas automáticamente.</p>
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
      <div style={{ flex: 1, borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1rem' }}>Registro de Batalla</h3>
        <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {logs.length === 0 && <p style={{ color: '#666', fontStyle: 'italic' }}>Las batallas aparecerán aquí...</p>}
          {logs.map(log => (
            <div key={log.id} style={{
              padding: '0.8rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              background: log.type === 'normal' ? 'rgba(230, 177, 42, 0.1)' : (log.type === 'escaramuza' ? 'rgba(255,255,255,0.05)' : 'transparent'),
              borderLeft: log.type === 'normal' ? '3px solid var(--color-primary)' : (log.type === 'escaramuza' ? '3px solid #ccc' : 'none'),
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
