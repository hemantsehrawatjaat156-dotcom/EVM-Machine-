import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ROLES = [
  { label: 'Supreme Device', path: '/supreme', desc: 'Admin — assign roles, control election', color: '#f59e0b' },
  { label: 'Machine 1', path: '/machine1', desc: 'Auth Device — verify & approve voters', color: '#3b82f6' },
  { label: 'Machine 2', path: '/machine2', desc: 'Voting Device — cast votes', color: '#6366f1' },
  { label: 'Machine 3', path: '/machine3', desc: 'Receipt Device — print vote receipt', color: '#22c55e' },
];

export default function Home() {
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState(() => {
    return localStorage.getItem('evm_device_id') || '';
  });

  const handleSelect = (path) => {
    if (!deviceId.trim()) return alert('Enter a Device ID first');
    localStorage.setItem('evm_device_id', deviceId.trim().toUpperCase());
    navigate(path);
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🗳️</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>EVM System</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Distributed Electronic Voting Machine
          </p>
        </div>

        <label style={{ fontSize: '0.85rem', color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
          Device ID (unique name for this device)
        </label>
        <input
          type="text"
          placeholder="e.g. DEVICE_A or MOBILE_01"
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
          style={{ marginBottom: 24 }}
        />

        <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 16 }}>
          Select this device's role:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ROLES.map(role => (
            <button
              key={role.path}
              onClick={() => handleSelect(role.path)}
              style={{
                background: 'var(--surface2)',
                border: `1px solid var(--border)`,
                borderRadius: 12,
                padding: '14px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = role.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: role.color, flexShrink: 0,
                boxShadow: `0 0 8px ${role.color}`,
              }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
                  {role.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: 2 }}>
                  {role.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text2)', textAlign: 'center', marginTop: 20 }}>
          Open this URL on each device/tab, enter a unique Device ID, then choose its machine screen.
        </p>
      </div>
    </div>
  );
}
