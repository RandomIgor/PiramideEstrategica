import React, { useEffect, useRef } from 'react';
import type { TokenType } from '../constants/game';
import { TOKENS } from '../constants/game';
import { db, auth } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface MultiplayerBattlePhaseProps {
  socket: any;
  roomId: string;
  roomState: any;
  playerId: string;
  onFinish: () => void;
}

export const MultiplayerBattlePhase: React.FC<MultiplayerBattlePhaseProps> = ({ socket, roomId, roomState, playerId, onFinish }) => {
  const hasSavedStats = useRef(false);

  useEffect(() => {
    if (roomState && roomState.currentLevel > roomState.mode.levels && !hasSavedStats.current) {
      hasSavedStats.current = true;
      const me = roomState.players.find((p: any) => p.id === playerId);
      const rival = roomState.players.find((p: any) => p.id !== playerId);
      
      if (me && rival && auth.currentUser) {
        if (me.score > rival.score) {
          updateDoc(doc(db, 'users', auth.currentUser.uid), {
            wins: increment(1),
            points: increment(10),
            matchesPlayed: increment(1)
          }).catch(console.error);
        } else if (me.score < rival.score) {
          updateDoc(doc(db, 'users', auth.currentUser.uid), {
            points: increment(-5),
            matchesPlayed: increment(1)
          }).catch(console.error);
        } else {
          // Empate
          updateDoc(doc(db, 'users', auth.currentUser.uid), {
            matchesPlayed: increment(1)
          }).catch(console.error);
        }
      }
    }
  }, [roomState, playerId]);

  const me = roomState.players.find((p: any) => p.id === playerId);
  const rival = roomState.players.find((p: any) => p.id !== playerId);

  const handleTokenSelect = (colIndex: number) => {
    socket.emit('submit_battle_choice', { roomId, choiceCol: colIndex });
  };

  const renderCurrentRowTokens = () => {
    if (roomState.currentLevel > roomState.mode.levels) return null;
    const row = roomState.currentLevel - 1;
    const tokens = [];
    for (let c = 0; c < roomState.currentLevel; c++) {
      const token = me.pyramid[`${row}-${c}`];
      const isUsed = me.usedCols && me.usedCols.includes(c);
      tokens.push(
        <button
          key={c}
          className="btn"
          disabled={me.currentChoice !== null || isUsed}
          style={{
            fontSize: 'var(--token-font)', padding: '0.8rem', background: me.currentChoice === c ? 'var(--color-primary)' : (isUsed ? 'transparent' : 'var(--glass-bg)'),
            border: '2px solid var(--color-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center',
            flex: '1 1 auto', minWidth: 'var(--token-size)',
            opacity: isUsed ? 0.2 : ((me.currentChoice !== null && me.currentChoice !== c) ? 0.5 : 1),
            cursor: (me.currentChoice !== null || isUsed) ? 'default' : 'pointer'
          }}
          onClick={() => handleTokenSelect(c)}
        >
          {TOKENS[token as TokenType].icon}
          <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: me.currentChoice === c ? 'white' : '#ccc' }}>
            {isUsed ? 'Usada' : (me.currentChoice === c ? 'Elegido' : 'Lanzar')}
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

  const isGameOver = roomState.currentLevel > roomState.mode.levels;

  return (
    <div className="glass-panel responsive-split animate-fade-in" style={{ width: '100%', maxWidth: '900px' }}>
      <div style={{ flex: '1 1 300px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Fase de Batallas (Online)</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--color-primary)' }}>TÚ</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{me.score}</p>
          </div>
          {roomState.mode.isSpecialRules && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#ccc' }}>BOTE</h3>
              <p style={{ fontSize: '1.5rem', color: '#f39c12' }}>{roomState.tiePot}</p>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--color-accent)' }}>RIVAL</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{rival.score}</p>
          </div>
        </div>

        {!isGameOver ? (
          <div style={{ textAlign: 'center' }}>
            <h3>Nivel Actual: {roomState.currentLevel} de {roomState.mode.levels}</h3>
            {me.currentChoice !== null && rival.currentChoice === null && (
              <p style={{ color: '#f39c12', marginTop: '0.5rem' }}>Esperando a que el rival elija su ficha...</p>
            )}
            {me.currentChoice === null && (
              <p style={{ color: '#aaa', marginTop: '0.5rem' }}>Selecciona una ficha para el próximo duelo ({roomState.currentLevel - (me.usedCols ? me.usedCols.length : 0)} restantes).</p>
            )}
            {renderCurrentRowTokens()}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '3rem', color: me.score > rival.score ? 'var(--color-primary)' : (me.score < rival.score ? 'var(--color-accent)' : 'white') }}>
              {me.score > rival.score ? '¡HAS GANADO!' : (me.score < rival.score ? '¡HAS PERDIDO!' : '¡EMPATE TÉCNICO!')}
            </h1>
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={onFinish}>Volver al Menú</button>
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '1rem' }}>Registro de Batalla</h3>
        <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {roomState.logs.length === 0 && <p style={{ color: '#666', fontStyle: 'italic' }}>Las batallas aparecerán aquí...</p>}
          {[...roomState.logs].reverse().map((log: string, i: number) => (
            <div key={i} style={{
              padding: '0.8rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              background: log.includes('Nivel') ? 'rgba(230, 177, 42, 0.1)' : 'rgba(255,255,255,0.05)',
              borderLeft: log.includes('Nivel') ? '3px solid var(--color-primary)' : '3px solid #ccc',
              color: 'white'
            }}>
              {log.replace('J1', me.name === 'Jugador 1' ? 'TÚ' : 'RIVAL').replace('J2', me.name === 'Jugador 2' ? 'TÚ' : 'RIVAL')}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
