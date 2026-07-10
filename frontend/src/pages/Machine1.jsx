import React, { useState, useEffect } from 'react';
import socket from '../socket/socket';
import { BACKEND_URL } from '../config/api';

export default function Machine1() {
  const [connected, setConnected] = useState(false);
  const [role, setRole] = useState('unassigned');
  const [electionRunning, setElectionRunning] = useState(false);
  const [voterId, setVoterId] = useState('');
  const [voter, setVoter] = useState(null);
  const [status, setStatus] = useState(null); // { type, message }
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const deviceId = localStorage.getItem('evm_device_id') || 'MACHINE1';

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('register_device', { deviceId, requestedRole: 'machine1' });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('role_assigned', ({ role }) => {
      setRole(role);
      if (role !== 'machine1') resetAll();
    });

    socket.on('election_status', ({ action }) => {
      setElectionRunning(action === 'start');
      if (action === 'stop') resetAll();
    });

    socket.on('reset_auth', () => {
      resetAll();
      setStatus({ type: 'success', message: 'Vote cast! Ready for next voter.' });
    });

    socket.on('admin_reset', ({ message }) => {
      resetAll();
      setStatus({ type: 'info', message });
    });

    return () => socket.disconnect();
  }, [deviceId]);

  const resetAll = () => {
    setVoter(null);
    setVoterId('');
    setApproved(false);
    setStatus(null);
  };

  const verifyVoter = async () => {
    if (!voterId.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/voters/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: voterId.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setVoter(data.voter);
        setStatus({ type: 'success', message: `Voter verified: ${data.voter.name}` });
      } else {
        setStatus({ type: 'error', message: data.error || 'Verification failed' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Server error. Check backend.' });
    }
    setLoading(false);
  };

  const approveVoter = () => {
    if (!voter) return;
    socket.emit('approve_voter', { voterId: voter.id, voterName: voter.name });
    setApproved(true);
    setStatus({ type: 'info', message: `${voter.name} approved. Waiting for vote...` });
  };

  if (role !== 'machine1' && role !== 'unassigned') {
    return (
      <div className="page">
        <div className="card">
          <div className="alert alert-error">
            This device is assigned role: <strong>{role}</strong>. Expected: machine1.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <div className="machine-label">Machine 1 — Auth Device</div>
        <div className="header-row">
          <h2>🔐 Voter Auth</h2>
          <span className={`badge ${connected ? 'badge-blue' : 'badge-red'}`}>
            {connected ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="status-bar">
          <div className={`dot ${role === 'machine1' ? 'dot-green' : 'dot-yellow'}`} />
          <span>Role: <strong style={{ color: 'var(--text)' }}>
            {role === 'machine1' ? 'Active — Machine 1' : 'Waiting for role assignment...'}
          </strong></span>
        </div>

        {role !== 'machine1' ? (
          <div className="alert alert-info">
            Waiting for Supreme Device to assign Machine 1 role to this device.
          </div>
        ) : !electionRunning ? (
          <div className="alert alert-info">
            Election has not started yet. Waiting for Supreme Device.
          </div>
        ) : approved ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 600, color: 'var(--text2)' }}>
              Waiting for {voter?.name} to cast vote...
            </div>
            {status && (
              <div className={`alert alert-${status.type}`} style={{ marginTop: 16 }}>
                {status.message}
              </div>
            )}
            <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={resetAll}>
              Cancel / Reset
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                Voter ID
              </label>
              <input
                type="text"
                placeholder="e.g. VOTER001"
                value={voterId}
                onChange={e => setVoterId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyVoter()}
                disabled={!!voter}
              />
            </div>

            {!voter ? (
              <button
                className="btn btn-primary"
                onClick={verifyVoter}
                disabled={loading || !voterId.trim()}
              >
                {loading ? 'Verifying...' : 'Verify Voter'}
              </button>
            ) : (
              <>
                <div style={{
                  background: 'var(--surface2)', borderRadius: 12,
                  padding: '16px', marginBottom: 16,
                  border: '1px solid rgba(34,197,94,0.3)'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 4 }}>
                    Verified Voter
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{voter.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>ID: {voter.id}</div>
                </div>
                <button className="btn btn-success" onClick={approveVoter}>
                  ✅ Approve to Vote
                </button>
                <button className="btn btn-ghost gap" onClick={resetAll}>
                  Cancel
                </button>
              </>
            )}

            {status && (
              <div className={`alert alert-${status.type}`}>
                {status.message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
