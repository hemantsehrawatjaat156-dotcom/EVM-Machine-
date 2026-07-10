import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket/socket';

export default function Machine3() {
  const [connected, setConnected] = useState(false);
  const [role, setRole] = useState('unassigned');
  const [electionRunning, setElectionRunning] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [approvedVoter, setApprovedVoter] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const receiptRef = useRef(null);
  const deviceId = localStorage.getItem('evm_device_id') || 'MACHINE3';

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('register_device', { deviceId, requestedRole: 'machine3' });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('role_assigned', ({ role }) => {
      setRole(role);
      if (role !== 'machine3') {
        setReceipt(null);
        setApprovedVoter(null);
      }
    });
    socket.on('election_status', ({ action }) => {
      setElectionRunning(action === 'start');
    });

    socket.on('voter_approved', ({ voterName }) => {
      setApprovedVoter(voterName);
      setReceipt(null);
    });

    socket.on('print_receipt', (data) => {
      const receiptData = {
        ...data,
        receiptId: `RCP-${Date.now()}`,
      };
      setReceipt(receiptData);
      setApprovedVoter(null);
      setReceipts(prev => [receiptData, ...prev.slice(0, 9)]);
    });

    socket.on('reset_receipt', () => {
      setReceipt(null);
      setApprovedVoter(null);
    });

    socket.on('admin_reset', () => {
      setReceipt(null);
      setApprovedVoter(null);
    });

    return () => socket.disconnect();
  }, [deviceId]);

  const printReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Vote Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .symbol { font-size: 48px; display: block; margin: 10px 0; }
            h2 { margin: 0; font-size: 1.1rem; }
            p { margin: 4px 0; font-size: 0.85rem; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>🗳️ VOTE RECEIPT</h2>
            <p>Official EVM Receipt</p>
          </div>
          <div class="divider"></div>
          <p><strong>Voter:</strong> ${receipt.voterName}</p>
          <p><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</p>
          <p><strong>Receipt ID:</strong> ${receipt.receiptId}</p>
          <div class="divider"></div>
          <div class="center">
            <p><strong>You voted for:</strong></p>
            <span class="symbol">${receipt.candidateSymbol}</span>
            <h2>${receipt.candidateName}</h2>
          </div>
          <div class="divider"></div>
          <div class="center"><p>Thank you for voting!</p></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="page">
      <div className="card card-wide">
        <div className="machine-label">Machine 3 — Receipt Device</div>
        <div className="header-row">
          <h2>🧾 Receipt Printer</h2>
          <span className={`badge ${connected ? 'badge-green' : 'badge-red'}`}>
            {connected ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="status-bar">
          <div className={`dot ${role === 'machine3' ? 'dot-green' : 'dot-yellow'}`} />
          <span>Role: <strong style={{ color: 'var(--text)' }}>
            {role === 'machine3' ? 'Active — Machine 3' : 'Waiting for role assignment...'}
          </strong></span>
        </div>

        {role !== 'machine3' ? (
          <div className="alert alert-info">
            Waiting for Supreme Device to assign Machine 3 role.
          </div>
        ) : !electionRunning ? (
          <div className="alert alert-info">Election not started yet.</div>
        ) : receipt ? (
          <>
            {/* Receipt Card */}
            <div ref={receiptRef} style={{
              background: '#fff',
              color: '#000',
              borderRadius: 12,
              padding: '24px',
              marginBottom: 16,
              fontFamily: 'monospace',
              border: '2px dashed #ccc',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>🗳️ VOTE RECEIPT</div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>Official EVM Receipt</div>
              </div>

              <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }} />

              <div style={{ fontSize: '0.82rem', lineHeight: 1.8 }}>
                <div><strong>Voter:</strong> {receipt.voterName}</div>
                <div><strong>Date:</strong> {new Date(receipt.timestamp).toLocaleString()}</div>
                <div><strong>Receipt ID:</strong> {receipt.receiptId}</div>
              </div>

              <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }} />

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', color: '#666', marginBottom: 4 }}>
                  You voted for:
                </div>
                <div style={{ fontSize: '3.5rem', lineHeight: 1.2 }}>{receipt.candidateSymbol}</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 4 }}>
                  {receipt.candidateName}
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }} />
              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#666' }}>
                Thank you for voting!
              </div>
            </div>

            <button className="btn btn-primary" onClick={printReceipt}>
              🖨️ Print Receipt
            </button>
            <button className="btn btn-ghost gap" onClick={() => setReceipt(null)}>
              Clear / Ready for Next
            </button>
          </>
        ) : approvedVoter ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 600 }}>{approvedVoter}</div>
            <div style={{ color: 'var(--text2)', marginTop: 4 }}>is casting their vote...</div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🟢</div>
            <div style={{ color: 'var(--text2)' }}>
              Ready — Waiting for a vote to be cast
            </div>
          </div>
        )}

        {/* Receipt History */}
        {receipts.length > 1 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 10 }}>
              Recent Receipts ({receipts.length})
            </h3>
            {receipts.slice(1).map(r => (
              <div key={r.receiptId} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', background: 'var(--surface2)',
                borderRadius: 10, marginBottom: 6,
                border: '1px solid var(--border)',
                fontSize: '0.82rem',
              }}>
                <span style={{ fontSize: '1.4rem' }}>{r.candidateSymbol}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.voterName}</div>
                  <div style={{ color: 'var(--text2)' }}>{r.candidateName}</div>
                </div>
                <div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>
                  {new Date(r.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
