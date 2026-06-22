import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface SetupProfileProps {
  userId: string;
  onComplete: (username: string) => void;
}

export const SetupProfile: React.FC<SetupProfileProps> = ({ userId, onComplete }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificamos si el nombre de usuario ya existe
      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Este nombre de usuario ya está cogido. Por favor, elige otro.');
        setLoading(false);
        return;
      }

      // Si no existe, lo guardamos en el perfil del usuario
      await setDoc(doc(db, 'users', userId), {
        username: username,
        wins: 0,
        points: 0,
        matchesPlayed: 0,
        createdAt: new Date().toISOString()
      });

      onComplete(username);
    } catch (err: any) {
      setError('Error al guardar el perfil: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '400px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
      <h2>Crea tu Nombre de Usuario</h2>
      <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Este será el nombre que verán tus rivales en las batallas online.</p>
      
      {error && <p style={{ color: 'var(--color-accent)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Nombre de Usuario" 
          value={username}
          onChange={e => setUsername(e.target.value.trim())}
          required
          style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-primary)', background: 'rgba(0,0,0,0.5)', color: 'white', textAlign: 'center', fontSize: '1.2rem' }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Guardando...' : 'Confirmar'}
        </button>
      </form>
    </div>
  );
};
