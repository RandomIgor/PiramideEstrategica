import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('El correo ya está en uso.');
      else if (err.code === 'auth/wrong-password') setError('Contraseña incorrecta.');
      else if (err.code === 'auth/user-not-found') setError('Usuario no encontrado.');
      else setError(err.message);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '400px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
      <h2>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
      <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Conéctate para jugar online</p>
      
      {error && <p style={{ color: 'var(--color-accent)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}
      
      <button className="btn" style={{ width: '100%', marginBottom: '1.5rem', background: 'white', color: 'black', fontWeight: 'bold' }} onClick={handleGoogleSignIn}>
        Continuar con Google
      </button>

      <div style={{ margin: '1rem 0', color: '#555', display: 'flex', alignItems: 'center' }}>
        <hr style={{ flex: 1, borderColor: '#333' }} />
        <span style={{ padding: '0 10px' }}>o usa tu email</span>
        <hr style={{ flex: 1, borderColor: '#333' }} />
      </div>

      <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="email" 
          placeholder="Correo electrónico" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-primary)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-primary)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
        />
        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
          {isRegistering ? 'Registrarse' : 'Entrar'}
        </button>
      </form>

      <button 
        style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}
        onClick={() => setIsRegistering(!isRegistering)}
      >
        {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
      </button>
    </div>
  );
};
