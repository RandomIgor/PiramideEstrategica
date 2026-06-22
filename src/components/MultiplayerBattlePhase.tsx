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
  lastBattleData?: any;
  onClearBattle?: () => void;
}

export const MultiplayerBattlePhase: React.FC<MultiplayerBattlePhaseProps> = ({ socket, roomId, roomState, playerId, onFinish, lastBattleData, onClearBattle }) => {
  const hasSavedStats = useRef(false);
  const [showHistory, setShowHistory] = useState(false);

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
    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%' }}>
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

      {lastBattleData && (
        <div className="modal-overlay">
          <div className="modal-content scale-in">
            {(() => {
              const isP1 = lastBattleData.p1Id === playerId;
              const myToken = isP1 ? lastBattleData.p1Token : lastBattleData.p2Token;
              const rivalToken = isP1 ? lastBattleData.p2Token : lastBattleData.p1Token;
              let myResult = lastBattleData.result;
              if (!isP1 && myResult !== 'TIE') myResult = myResult === 'WIN' ? 'LOSS' : 'WIN';

              return (
                <>
                  <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: myResult === 'WIN' ? 'var(--color-primary)' : (myResult === 'LOSS' ? 'var(--color-accent)' : 'white') }}>
                    {myResult === 'WIN' ? '¡TÚ GANAS!' : (myResult === 'LOSS' ? '¡RIVAL GANA!' : '¡EMPATE!')}
                  </h2>
                  <p style={{ fontSize: '1.2rem', color: '#ccc' }}>
                    {myResult === 'TIE' && roomState.mode.isSpecialRules ? `Bote acumulado a: ${lastBattleData.tiePot}` : (myResult === 'TIE' ? 'Nadie suma puntos' : `+${lastBattleData.points} Puntos`)}
                  </p>
                  
                  <div className="battle-vs-container">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }}>{TOKENS[myToken as TokenType].icon}</div>
                      <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Tú</p>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#666', fontStyle: 'italic' }}>VS</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(231,76,60,0.3))' }}>{TOKENS[rivalToken as TokenType].icon}</div>
                      <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Rival</p>
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.2rem' }} onClick={onClearBattle}>Continuar</button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content scale-in" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>Historial de Batallas</h2>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {roomState.logs.length === 0 && <p style={{ color: '#aaa', fontStyle: 'italic' }}>Aún no hay batallas registradas.</p>}
              {[...roomState.logs].reverse().map((log: string, i: number) => {
                const isMyWin = log.includes('TÚ VENCE') || log.includes(me.name + ' VENCE');
                const isMyLoss = log.includes('TÚ PIERDE') || log.includes(me.name + ' PIERDE') || log.includes('VENCE al ' + me.name);
                const isTie = log.includes('EMPATE');
                const myLogClass = isMyWin ? 'win' : (isMyLoss ? 'loss' : '');

                return (
                  <div key={i} className={`history-item ${myLogClass}`}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <p style={{ fontWeight: 'bold', color: isMyWin ? 'var(--color-primary)' : (isMyLoss ? 'var(--color-accent)' : '#aaa') }}>
                        {isMyWin ? 'GANAS' : (isMyLoss ? 'PIERDES' : (isTie ? 'EMPATE' : 'INFO'))}
                      </p>
                      <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.2rem' }}>
                        {log.replace('J1', me.name === 'Jugador 1' ? 'TÚ' : 'RIVAL').replace('J2', me.name === 'Jugador 2' ? 'TÚ' : 'RIVAL')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setShowHistory(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};
