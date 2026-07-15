import React, { useState, useEffect } from 'react';
import socket from '../socket/socket';
import { BACKEND_URL } from '../config/api';

export default function Machine2() {
  const [connected, setConnected] = useState(false);
  const [role, setRole] = useState('unassigned');
  const [electionRunning, setElectionRunning] = useState(false);
  const [approvedVoter, setApprovedVoter] = useState(null);
  const [token, setToken] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [voted, setVoted] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const deviceId = localStorage.getItem('evm_device_id') || 'MACHINE2';

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('register_device', { deviceId, requestedRole: 'machine2' });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('role_assigned', ({ role }) => {
      setRole(role);
      if (role !== 'machine2') resetAll();
    });

    socket.on('election_status', ({ action }) => {
      setElectionRunning(action === 'start');
      if (action === 'start') fetchCandidates();
      if (action === 'stop') resetAll();
    });

    socket.on('voter_approved', ({ token, voterId, voterName }) => {
      setApprovedVoter({ id: voterId, name: voterName });
      setToken(token);
      setSelected(null);
      setVoted(false);
      setStatus({ type: 'info', message: `${voterName} approved. Select a candidate.` });
    });

    socket.on('vote_success', () => {
      setVoted(true);
    });

    socket.on('vote_error', ({ message }) => {
      setStatus({ type: 'error', message });
    });

    socket.on('reset_voting', ({ message }) => {
      resetAll();
      setStatus({ type: 'info', message });
    });

    socket.on('admin_reset', ({ message }) => {
      resetAll();
      setStatus({ type: 'info', message });
    });

    return () => socket.disconnect();
  }, [deviceId]);

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/candidates`);
      const data = await res.json();
      setCandidates(data);
    } catch {
      setStatus({ type: 'error', message: 'Failed to load candidates' });
    }
  };

  useEffect(() => {
    if (electionRunning) fetchCandidates();
  }, [electionRunning]);

  const resetAll = () => {
    setApprovedVoter(null);
    setToken(null);
    setSelected(null);
    setVoted(false);
    setStatus(null);
  };

  const castVote = async () => {
    if (!selected || !token) return;
    setLoading(true);

    const candidate = candidates.find(c => c.id === selected);

    try {
      const res = await fetch(`${BACKEND_URL}/api/candidates/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: approvedVoter.id, candidateId: selected }),
      });
      const data = await res.json();

      if (data.success) {
        socket.emit('vote_cast', {
          token,
          candidateId: selected,
          candidateName: candidate.name,
          candidateSymbol: candidate.symbol,
          voterName: approvedVoter.name,
        });
      } else {
        setStatus({ type: 'error', message: data.error });
      }
    } catch {
      setStatus({ type: 'error', message: 'Vote submission failed' });
    }
    setLoading(false);
  };

  if (voted) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <h2 style={{ marginBottom: 8 }}>Vote Recorded!</h2>
          <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
            Thank you for voting. Receipt is printing on Machine 3.
          </p>
          <button className="btn btn-ghost" onClick={resetAll}>
            Ready for Next Voter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card card-wide">
        <div className="machine-label">Machine 2 — Voting Device</div>
        <div className="header-row">
          <h2>🗳️ Cast Vote</h2>
          <span className={`badge ${connected ? 'badge-blue' : 'badge-red'}`}>
            {connected ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="status-bar">
          <div className={`dot ${role === 'machine2' ? 'dot-green' : 'dot-yellow'}`} />
          <span>Role: <strong style={{ color: 'var(--text)' }}>
            {role === 'machine2' ? 'Active — Machine 2' : 'Waiting for role assignment...'}
          </strong></span>
        </div>

        {role !== 'machine2' ? (
          <div className="alert alert-info">
            Waiting for Supreme Device to assign Machine 2 role to this device.
          </div>
        ) : !electionRunning ? (
          <div className="alert alert-info">
            Election has not started yet.
          </div>
        ) : !approvedVoter ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
            <div style={{ color: 'var(--text2)' }}>
              Locked — Waiting for Machine 1 to approve a voter
            </div>
          </div>
        ) : (
          <>
            <div style={{
              background: 'var(--surface2)', borderRadius: 12,
              padding: '14px 16px', marginBottom: 20,
              border: '1px solid rgba(15, 245, 145, 0.3)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>Voting as</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{approvedVoter.name}</div>
              </div>
              <span className="badge badge-blue">Approved</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 16 }}>
              Select your candidate:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {candidates.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  style={{
                    background: selected === c.id ? 'rgba(99,102,241,0.15)' : 'var(--surface2)',
                    border: selected === c.id
                      ? '2px solid var(--accent2)'
                      : '1px solid var(--border)',
                    borderRadius: 12, padding: '16px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 16,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{c.symbol}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{c.party}</div>
                  </div>
                  {selected === c.id && (
                    <span style={{ marginLeft: 'auto', color: 'var(--accent2)', fontSize: '1.2rem' }}>
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={castVote}
              disabled={!selected || loading}
            >
              {loading ? 'Submitting...' : '🗳️ Cast Vote'}
            </button>

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
