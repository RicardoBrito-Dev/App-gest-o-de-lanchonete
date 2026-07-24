'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { UserProfile, UserRole } from '@/lib/data';
import { showToast } from '@/components/shared/Toast';

const PRESET_USERS: Array<UserProfile & { pin: string; desc: string }> = [
  {
    id: '1',
    name: 'Gerente Admin',
    role: 'admin',
    email: 'admin@pizzalanche.com',
    avatar: '👑',
    pin: '1234',
    desc: 'Acesso total a relatórios, configurações e gestão',
  },
  {
    id: '2',
    name: 'Operador de Caixa',
    role: 'caixa',
    email: 'caixa@pizzalanche.com',
    avatar: '💵',
    pin: '1234',
    desc: 'Gestão de caixa, abertura/fechamento e delivery',
  },
  {
    id: '3',
    name: 'Chefe de Cozinha',
    role: 'cozinha',
    email: 'cozinha@pizzalanche.com',
    avatar: '👨‍🍳',
    pin: '1234',
    desc: 'Painel KDS de preparo de pedidos e comandas',
  },
  {
    id: '4',
    name: 'Atendente Garçom',
    role: 'garcom',
    email: 'garcom@pizzalanche.com',
    avatar: '🪑',
    pin: '1234',
    desc: 'Lançamento de comanda e mapa de mesas',
  },
];

export default function LoginPage() {
  const { login } = useStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('admin@pizzalanche.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (user: typeof PRESET_USERS[0]) => {
    setSelectedRole(user.role);
    setEmail(user.email);
    setPassword('123456');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Por favor, informe seu usuário ou e-mail!', 'error');
      return;
    }
    if (!password.trim()) {
      showToast('Por favor, informe a sua senha!', 'error');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const foundPreset = PRESET_USERS.find((u) => u.role === selectedRole) || PRESET_USERS[0];
      const userToLogin: UserProfile = {
        id: foundPreset.id,
        name: foundPreset.name,
        role: foundPreset.role,
        email: email.trim(),
        avatar: foundPreset.avatar,
      };

      login(userToLogin);
      setIsLoading(false);
      showToast(`Bem-vindo(a) de volta, ${userToLogin.name}! 🍕`, 'success');
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #1a1a2e 0%, #0a0a12 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Background Decorative Glow Shapes */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255, 107, 53, 0.15) 0%, rgba(232, 67, 154, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(18, 18, 30, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 107, 53, 0.1)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(232,67,154,0.2))',
              border: '1px solid rgba(255,107,53,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.25)',
            }}
          >
            🍕
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #ff6b35, #e8439a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            PizzaLanche Pro
          </h1>
          <p style={{ color: '#8888aa', fontSize: '0.875rem', marginTop: '6px' }}>
            Sistema de Gestão & Pedidos Inteligentes
          </p>
        </div>

        {/* Profile Selector Tabs */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#8888aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Selecione o Perfil de Acesso
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {PRESET_USERS.map((preset) => {
              const isSelected = selectedRole === preset.role;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleRoleSelect(preset)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid',
                    borderColor: isSelected ? '#ff6b35' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#ffffff' : '#aaaaee',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{preset.avatar}</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>{preset.name}</div>
                    <div style={{ fontSize: '0.68rem', color: isSelected ? '#ff6b35' : '#666688' }}>
                      {preset.role.toUpperCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cccccc', marginBottom: '6px' }}>
              E-mail ou Usuário
            </label>
            <input
              type="text"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@pizzalanche.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cccccc' }}>Senha de Acesso</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#ff6b35', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#8888aa', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#ff6b35' }} />
              Lembrar meu acesso
            </label>
            <span style={{ fontSize: '0.75rem', color: '#666688' }}>Senha padrão: 123456</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ff6b35, #e8439a)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: isLoading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading ? (
              <span>Entrando...</span>
            ) : (
              <>
                <span>Acessar Painel</span>
                <span>➔</span>
              </>
            )}
          </button>
        </form>

        {/* Links externos */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <a
            href="/cardapio"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#aaaaee',
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            📱 Cardápio do Cliente
          </a>
          <a
            href="/cozinha"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#aaaaee',
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            👨‍🍳 Tela da Cozinha
          </a>
        </div>
      </div>
    </div>
  );
}
