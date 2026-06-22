import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface PlayerScore {
  username: string;
  points: number;
  wins: number;
  matchesPlayed: number;
}

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [players, setPlayers] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const fetchedPlayers: PlayerScore[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedPlayers.push({
            username: data.username,
            points: data.points || 0,
            wins: data.wins || 0,
            matchesPlayed: data.matchesPlayed || 0
          });
        });
        setPlayers(fetchedPlayers);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', width: '100%' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#f1c40f' }}>🏆 Salón de la Fama 🏆</h2>
      
      {loading ? (
        <div className="spinner" style={{ margin: '2rem auto' }}></div>
      ) : (
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', fontWeight: 'bold', paddingBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
            <span>Rank</span>
            <span style={{ textAlign: 'left' }}>Jugador</span>
            <span>Puntos</span>
          </div>
          
          {players.length === 0 ? (
            <p style={{ padding: '1rem', color: '#ccc' }}>Aún no hay jugadores registrados.</p>
          ) : (
            players.map((p, idx) => (
              <div key={idx} style={{ 
                display: 'grid', 
                gridTemplateColumns: '50px 1fr 100px', 
                padding: '0.8rem 0',
                borderBottom: idx === players.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: idx === 0 ? '#f1c40f' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : 'white',
                fontWeight: idx < 3 ? 'bold' : 'normal',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: idx < 3 ? '1.2rem' : '1rem' }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <span style={{ textAlign: 'left' }}>{p.username}</span>
                <span style={{ fontSize: '1.2rem', color: 'var(--color-accent)' }}>{p.points}</span>
              </div>
            ))
          )}
        </div>
      )}

      <button className="btn btn-secondary" onClick={onBack}>Volver al Menú</button>
    </div>
  );
};
