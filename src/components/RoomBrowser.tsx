import React, { useEffect, useState } from 'react';

export interface RoomInfo {
  roomId: string;
  host: string;
  mode: string;
  isSpecial?: boolean;
}

interface RoomBrowserProps {
  socket: any;
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
}

export const RoomBrowser: React.FC<RoomBrowserProps> = ({ socket, onJoinRoom, onBack }) => {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [joinInput, setJoinInput] = useState('');

  useEffect(() => {
    socket.on('available_rooms', (roomList: RoomInfo[]) => {
      setRooms(roomList);
    });
    
    // Request initial list
    socket.emit('request_rooms');

    return () => {
      socket.off('available_rooms');
    };
  }, [socket]);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: '800px', width: '100%' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Buscador de Partidas</h2>
      
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', minHeight: '200px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', gap: '1rem', fontWeight: 'bold', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem', color: 'var(--color-secondary)' }}>
          <span style={{ textAlign: 'left' }}>Host</span>
          <span>Modo de Juego</span>
          <span>Reglas Especiales</span>
          <span>Acción</span>
        </div>
        
        {rooms.length === 0 ? (
          <p style={{ padding: '2rem', color: '#ccc' }}>No hay partidas públicas disponibles en este momento.</p>
        ) : (
          rooms.map((room) => (
            <div key={room.roomId} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr 100px', 
              gap: '1rem',
              padding: '0.8rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              alignItems: 'center'
            }}>
              <span style={{ textAlign: 'left', fontWeight: 'bold' }}>👤 {room.host}</span>
              <span style={{ color: 'var(--color-accent)' }}>{room.mode}</span>
              <span>{room.isSpecial ? '✅ Sí' : '❌ No'}</span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.4rem', fontSize: '0.9rem' }}
                onClick={() => onJoinRoom(room.roomId)}
              >
                Unirse
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <span style={{ color: '#aaa' }}>¿Tienes un código privado?</span>
        <input 
          type="text" 
          placeholder="Código de Sala" 
          value={joinInput}
          onChange={e => setJoinInput(e.target.value.toUpperCase())}
          style={{ padding: '0.5rem', width: '150px', fontSize: '1rem', textAlign: 'center', textTransform: 'uppercase', borderRadius: '4px', border: '1px solid var(--color-primary)', background: 'black', color: 'white' }}
        />
        <button className="btn" style={{ background: '#34495e', color: 'white' }} onClick={() => joinInput && onJoinRoom(joinInput)}>
          Entrar
        </button>
      </div>

      <button className="btn btn-secondary" onClick={onBack}>Volver al Menú</button>
    </div>
  );
};
