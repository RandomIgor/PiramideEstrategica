import { useState, useEffect } from 'react'
import './App.css'
import { io } from 'socket.io-client';
import { ModeSelector } from './components/ModeSelector';
import { ConstructionPhase } from './components/ConstructionPhase';
import { BattlePhase } from './components/BattlePhase';
import { MultiplayerBattlePhase } from './components/MultiplayerBattlePhase';
import { Login } from './components/Login';
import { Leaderboard } from './components/Leaderboard';
import { SetupProfile } from './components/SetupProfile';
import { RoomBrowser } from './components/RoomBrowser';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { GameMode, TokenType } from './constants/game';
import { generateBotPyramid } from './utils/battle';

const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:3001';
const socket = io(SOCKET_URL, { autoConnect: false });

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState<'menu' | 'battle' | 'special' | 'learn' | 'construction' | 'battle-phase' | 'manual' | 'multiplayer-menu' | 'multiplayer-lobby' | 'multiplayer-battle' | 'leaderboard'>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [playerPyramid, setPlayerPyramid] = useState<Record<string, TokenType> | null>(null);
  const [botPyramid, setBotPyramid] = useState<Record<string, TokenType> | null>(null);
  
  // Multiplayer State
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<any>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [lastBattleData, setLastBattleData] = useState<any>(null);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().username) {
          setUsername(docSnap.data().username);
        } else {
          setUsername(null);
        }
      } else {
        setUsername(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    socket.connect();
    socket.on('room_created', (id) => setRoomId(id));
    socket.on('room_state', (state) => {
      setRoomState(state);
      setSelectedMode(state.mode);
    });
    socket.on('start_construction', () => setCurrentView('construction'));
    socket.on('error_msg', (msg) => {
      setSocketError(msg);
      setCurrentView('multiplayer-menu');
    });
    socket.on('battle_starts', () => setCurrentView('multiplayer-battle'));
    socket.on('round_result', (payload) => {
      if (payload.lastBattle) {
        setLastBattleData(payload.lastBattle);
        setRoomState(payload.room);
      } else {
        setRoomState(payload);
      }
    });
    socket.on('player_disconnected', () => {
      alert("El otro jugador se ha desconectado.");
      setCurrentView('menu');
      setRoomId(null);
      setRoomState(null);
    });

    return () => {
      socket.off('room_created');
      socket.off('room_state');
      socket.off('start_construction');
      socket.off('error_msg');
      socket.off('battle_starts');
      socket.off('round_result');
      socket.off('player_disconnected');
    };
  }, []);

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
    setIsMultiplayer(false);
    setCurrentView('construction');
  };

  const handleCreateRoom = (mode: GameMode, isPrivate?: boolean) => {
    socket.emit('create_room', { mode, username, isPrivate });
    setIsMultiplayer(true);
    setCurrentView('multiplayer-lobby');
  };

  const handleJoinRoom = (roomIdToJoin: string) => {
    socket.emit('join_room', { roomId: roomIdToJoin, username });
    setIsMultiplayer(true);
    setRoomId(roomIdToJoin);
  };

  const handleSignOut = () => {
    signOut(auth);
    if (socket.connected) {
      socket.disconnect();
    }
  };

  if (authLoading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center' }}>
        <h1 className="title">PIRÁMIDE<br/>ESTRATÉGICA</h1>
        <Login />
      </div>
    );
  }

  if (!username) {
    return (
      <div className="app-container" style={{ justifyContent: 'center' }}>
        <h1 className="title">PIRÁMIDE<br/>ESTRATÉGICA</h1>
        <SetupProfile userId={user.uid} onComplete={setUsername} />
      </div>
    );
  }

  const renderMenu = () => (
    <div className="main-menu glass-panel animate-fade-in">
      <button 
        className="btn btn-primary menu-btn"
        onClick={() => setCurrentView('battle')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
        Batalla Normal
      </button>

      <button 
        className="btn btn-secondary menu-btn"
        onClick={() => setCurrentView('multiplayer-menu')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
        Multijugador Online
      </button>

      <button 
        className="btn glass-panel menu-btn"
        style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        onClick={() => setCurrentView('leaderboard')}
      >
        🏆 Salón de la Fama
      </button>

      <button 
        className="btn glass-panel menu-btn"
        style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        onClick={() => setCurrentView('learn')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        Aprende a Jugar
      </button>

      <button 
        className="btn menu-btn"
        style={{ background: '#d35400', color: '#fff' }}
        onClick={() => setCurrentView('manual')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        Manual de Usuario (Leer)
      </button>
    </div>
  );

  return (
    <div className="app-container">
      {user && username && (
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 100 }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>👤 {username}</span>
          <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: '#ccc', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>Salir</button>
        </div>
      )}
      <header className="animate-fade-in">
        <h1 className="title text-gradient">Pirámide Estratégica</h1>
        <p className="subtitle">¡Desata el poder de los dioses egipcios!</p>
      </header>
      
      {currentView === 'menu' && renderMenu()}
      {currentView === 'battle' && (
        <ModeSelector onSelectMode={handleSelectMode} onBack={() => setCurrentView('menu')} />
      )}
      {currentView === 'multiplayer-menu' && (
        <div className="responsive-split animate-fade-in">
          <div style={{ flex: '1 1 300px', maxWidth: '600px', width: '100%' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-primary)' }}>Crear Partida</h3>
            <ModeSelector isMultiplayer={true} onSelectMode={handleCreateRoom} onBack={() => setCurrentView('menu')} />
          </div>
          <div style={{ flex: '1 1 300px', maxWidth: '600px', width: '100%' }}>
            {socketError && <p style={{ color: 'var(--color-accent)', textAlign: 'center', marginBottom: '1rem' }}>{socketError}</p>}
            <RoomBrowser socket={socket} onJoinRoom={handleJoinRoom} onBack={() => setCurrentView('menu')} />
          </div>
        </div>
      )}
      {currentView === 'multiplayer-lobby' && roomState && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Sala: <span style={{ color: 'var(--color-primary)' }}>{roomId}</span></h2>
          <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>Modo: {roomState.mode?.name}</p>
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '12px' }}>
            {roomState.players.length === 1 ? (
              <div>
                <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                <p>Esperando a que se una el Jugador 2...</p>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.5rem' }}>Comparte el código de la sala con tu amigo.</p>
              </div>
            ) : (
              <div>
                <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                <p style={{ color: 'var(--color-secondary)' }}>Esperando a que el rival termine su pirámide...</p>
              </div>
            )}
          </div>
        </div>
      )}
      {currentView === 'construction' && selectedMode && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <ConstructionPhase 
            mode={selectedMode} 
            onComplete={(pyramid) => {
              if (isMultiplayer && roomId) {
                socket.emit('submit_pyramid', { roomId, pyramid });
                setPlayerPyramid(pyramid);
                setCurrentView('multiplayer-lobby'); // Will change to battle when both ready
              } else {
                const bPyramid = generateBotPyramid(selectedMode.levels, selectedMode.inventory);
                setPlayerPyramid(pyramid);
                setBotPyramid(bPyramid);
                setCurrentView('battle-phase');
              }
            }} 
          />
          <button className="btn" style={{ marginTop: '1rem', background: 'transparent', color: '#ccc', border: '1px solid #555' }} onClick={() => setCurrentView('menu')}>
            Abandonar Construcción
          </button>
        </div>
      )}
      {currentView === 'battle-phase' && selectedMode && playerPyramid && botPyramid && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <BattlePhase 
            mode={selectedMode}
            playerPyramid={playerPyramid}
            botPyramid={botPyramid}
            onFinish={() => setCurrentView('menu')}
          />
        </div>
      )}
      {currentView === 'multiplayer-battle' && roomState && socket && roomId && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <MultiplayerBattlePhase 
            socket={socket}
            roomId={roomId}
            roomState={roomState}
            playerId={socket.id as string}
            onFinish={() => setCurrentView('menu')}
            lastBattleData={lastBattleData}
            onClearBattle={() => setLastBattleData(null)}
          />
        </div>
      )}
      {currentView === 'special' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'left', maxWidth: '600px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>Modos Especiales</h2>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--color-primary)' }}>Desempates Acumulativos</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>Si dos fichas empatan (mismo valor), se genera un Bote de 1 punto. Quien gane el siguiente duelo se lleva los puntos de la victoria MÁS el Bote acumulado. ¡Ideal para partidas de infarto!</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentView('menu')}>Volver</button>
          </div>
        </div>
      )}
      {currentView === 'learn' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'left', maxWidth: '700px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-accent)' }}>Jerarquía de Fichas</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ background: 'var(--glass-bg)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid var(--color-primary)' }}><strong>☀️ Sol (Valor 5):</strong> La ficha más poderosa. Vence a todas excepto al escarabajo.</div>
            <div style={{ background: 'var(--glass-bg)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid #f1c40f' }}><strong>👑 Faraón (Valor 4):</strong> Poderoso líder, pierde ante el Sol.</div>
            <div style={{ background: 'var(--glass-bg)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid #3498db' }}><strong>🕯️ Devoto (Valor 3):</strong> Ficha de poder medio.</div>
            <div style={{ background: 'var(--glass-bg)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid #95a5a6' }}><strong>🏺 Siervo (Valor 2):</strong> Ficha básica.</div>
            <div style={{ background: 'var(--glass-bg)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid var(--color-secondary)' }}><strong>🪲 Escarabajo (Valor 1):</strong> La más débil, pero VENCE AL SOL (La Plaga).</div>
            <div style={{ background: 'var(--glass-bg)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid #9b59b6' }}><strong>🐈‍⬛ Gato Místico (Valor 6):</strong> Exclusivo de Keops. Pierde según el nivel donde luche.</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentView('menu')}>Volver</button>
          </div>
        </div>
      )}
      {currentView === 'manual' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'left', maxWidth: '800px', maxHeight: '70vh', overflowY: 'auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#e67e22' }}>Manual de Usuario Oficial</h2>
          <h3 style={{ color: 'var(--color-primary)' }}>1. Introducción</h3>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Pirámide Estratégica es un juego de deducción, engaño y táctica para 2 jugadores ambientado en el Antiguo Egipto. El objetivo es colocar inteligentemente tus fichas en una pirámide y ganar batallas contra tu oponente.</p>
          
          <h3 style={{ color: 'var(--color-primary)' }}>2. Fases del Juego</h3>
          <p style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}><strong>Fase 1: Construcción.</strong> Ocultos del rival, cada jugador arrastra o toca sus fichas para formar la pirámide.</p>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}><strong>Fase 2: Batallas (Duelos).</strong> Nivel por nivel (desde la cúspide), los jugadores eligen la ficha a enfrentar en una serie de duelos uno contra uno. Quien tenga el valor más alto (salvo Reglas Especiales) suma 1 punto. El nivel termina cuando todas las fichas de esa fila han combatido.</p>

          <h3 style={{ color: 'var(--color-primary)' }}>3. Modos de Pirámide</h3>
          <ul style={{ marginBottom: '1rem', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
            <li><strong>Seila:</strong> 3 Niveles, 6 Fichas totales.</li>
            <li><strong>Meidum:</strong> 4 Niveles, 10 Fichas totales.</li>
            <li><strong>Guiza:</strong> 5 Niveles, 15 Fichas totales.</li>
            <li><strong>Keops:</strong> 6 Niveles, 21 Fichas totales (Se añade el Gato Místico).</li>
          </ul>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentView('menu')}>Volver al Menú Principal</button>
          </div>
        </div>
      )}
      {currentView === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Leaderboard onBack={() => setCurrentView('menu')} />
        </div>
      )}
    </div>
  )
}

export default App
