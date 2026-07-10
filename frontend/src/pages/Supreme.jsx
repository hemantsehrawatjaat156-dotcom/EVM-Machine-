import React, { useState, useEffect } from 'react';
import socket from '../socket/socket';
import { BACKEND_URL } from '../config/api';

export default function Supreme() {
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [electionStatus, setElectionStatus] = useState('stopped');
  const [results, setResults] = useState([]);
  const [adminStatus, setAdminStatus] = useState(null);
  const deviceId = localStorage.getItem('evm_device_id') || 'SUPREME';

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('register_device', { deviceId, requestedRole: 'supreme' });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('role_assigned', ({ role }) => {
      // Supreme confirmed
    });

    socket.on('devices_updated', (list) => {
      setDevices(list);
    });

    socket.on('election_status', ({ action }) => {
      setElectionStatus(action === 'start' ? 'running' : 'stopped');
    });

    return () => socket.disconnect();
  }, [deviceId]);

  const assignRole = (targetDeviceId, role) => {
    socket.emit('assign_role', { targetDeviceId, role });
  };

  const refreshDevices = () => {
    socket.emit('request_devices');
    setAdminStatus('Device list refreshed.');
  };

  const stopMachine = (targetDeviceId) => {
    socket.emit('stop_machine', { targetDeviceId });
    setAdminStatus(`${targetDeviceId} stopped.`);
  };

  const resetMachines = () => {
    socket.emit('reset_machines');
    setAdminStatus('Active voting session reset.');
  };

  const controlElection = (action) => {
    socket.emit('election_control', { action });
    setElectionStatus(action === 'start' ? 'running' : 'stopped');
  };

  const fetchResults = async () => {
    const res = await fetch(`${BACKEND_URL}/api/candidates/results`);
    const data = await res.json();
    setResults(data);
  };

  const resetResults = async () => {
    await fetch(`${BACKEND_URL}/api/candidates/reset`, { method: 'POST' });
    setResults([]);
    setAdminStatus('Votes and voter status reset.');
  };

  const roleColor = {
    supreme: '#f59e0b',
    machine1: '#3b82f6',
    machine2: '#6366f1',
    machine3: '#22c55e',
    unassigned: '#64748b',
  };

  return (
    <div className="page">
      <div className="card card-wide">
        <div className="machine-label">Supreme Device</div>
        <div className="header-row">
          <h2>⚙️ Admin Control Panel</h2>
          <span className={`badge ${connected ? 'badge-green' : 'badge-red'}`}>
            {connected ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Election Control */}
        <div style={{
          background: 'var(--surface2)', borderRadius: 12,
          padding: '16px', marginBottom: 20,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 12 }}>
            Election Status: <span style={{
              color: electionStatus === 'running' ? 'var(--success)' : 'var(--text2)',
              fontWeight: 600
            }}>
              {electionStatus === 'running' ? '🟢 Running' : '⭕ Stopped'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-success"
              style={{ flex: 1 }}
              onClick={() => controlElection('start')}
              disabled={electionStatus === 'running'}
            >
              Start Election
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => controlElection('stop')}
              disabled={electionStatus === 'stopped'}
            >
              End Election
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 20,
        }}>
          <button className="btn btn-ghost" onClick={refreshDevices}>
            Show Connected Devices
          </button>
          <button className="btn btn-danger" onClick={resetMachines}>
            Stop Active Voting
          </button>
          <button className="btn btn-ghost" onClick={resetResults}>
            Reset Vote Data
          </button>
        </div>

        {adminStatus && (
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            {adminStatus}
          </div>
        )}

        {/* Connected Devices */}
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
          Connected Devices ({devices.length})
        </h3>

        {devices.length === 0 ? (
          <div style={{
            padding: '24px', textAlign: 'center',
            color: 'var(--text2)', fontSize: '0.875rem',
            background: 'var(--surface2)', borderRadius: 12,
            border: '1px dashed var(--border)'
          }}>
            Waiting for devices to connect...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {devices.map(dev => (
              <div key={dev.socketId || `${dev.deviceId}-${dev.role}`} style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dev.deviceId}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: roleColor[dev.role] || '#64748b'
                    }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text2)', textTransform: 'capitalize' }}>
                      {dev.role}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['machine1', 'machine2', 'machine3', 'unassigned'].map(role => (
                    <button
                      key={role}
                      onClick={() => assignRole(dev.deviceId, role)}
                      disabled={dev.role === 'supreme'}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: dev.role === role
                          ? `1px solid ${roleColor[role]}`
                          : '1px solid var(--border)',
                        background: dev.role === role
                          ? `${roleColor[role]}22`
                          : 'transparent',
                        color: dev.role === role ? roleColor[role] : 'var(--text2)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: dev.role === 'supreme' ? 'not-allowed' : 'pointer',
                        opacity: dev.role === 'supreme' ? 0.45 : 1,
                        textTransform: 'capitalize',
                      }}
                    >
                      {role === 'unassigned' ? 'Remove' : role}
                    </button>
                  ))}
                  <button
                    onClick={() => stopMachine(dev.deviceId)}
                    disabled={dev.role === 'supreme'}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(239,68,68,0.5)',
                      background: 'rgba(239,68,68,0.12)',
                      color: 'var(--danger)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: dev.role === 'supreme' ? 'not-allowed' : 'pointer',
                      opacity: dev.role === 'supreme' ? 0.45 : 1,
                    }}
                  >
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <button className="btn btn-ghost gap" onClick={fetchResults}>
          View Results
        </button>

        {results.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
              📊 Election Results
            </h3>
            {results.map((c, i) => (
              <div key={c.id} style={{
                display: 'grid',
                gridTemplateColumns: '40px minmax(0, 1fr) auto',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px', background: 'var(--surface2)',
                borderRadius: 10, marginBottom: 8,
                border: i === 0 ? '1px solid rgba(34,197,94,0.4)' : '1px solid var(--border)'
              }}>
                <span style={{ fontSize: '1.5rem', textAlign: 'center' }}>{c.symbol}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', wordBreak: 'break-word' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: 3 }}>{c.party}</div>
                </div>
                <div style={{
                  fontWeight: 700, fontSize: '1.1rem',
                  color: i === 0 ? 'var(--success)' : 'var(--text)',
                  minWidth: 48,
                  textAlign: 'right',
                }}>
                  {c.vote_count} {i === 0 && '🏆'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
