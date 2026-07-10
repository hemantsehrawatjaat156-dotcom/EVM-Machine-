const { v4: uuidv4 } = require('uuid');
const { getRedis } = require('../config/redis');

const connectedDevices = {}; // socketId -> { deviceId, role }
const validRequestedRoles = new Set(['supreme', 'machine1', 'machine2', 'machine3']);
let electionAction = 'stop';
let activeToken = null;

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Device connected: ${socket.id}`);

    // Device registers itself with a deviceId
    socket.on('register_device', async ({ deviceId, requestedRole }) => {
      connectedDevices[socket.id] = { deviceId, role: 'unassigned' };

      const redis = getRedis();
      const storedRole = await redis.get(`role:${deviceId}`);
      const role = validRequestedRoles.has(requestedRole) ? requestedRole : storedRole || 'unassigned';
      connectedDevices[socket.id].role = role;

      if (role !== 'supreme' && role !== 'unassigned') {
        await redis.set(`role:${deviceId}`, role);
      }

      socket.join(role);
      socket.join(deviceId); // also join own room for direct messaging

      // Send current role back to device
      socket.emit('role_assigned', { role });
      socket.emit('election_status', { action: electionAction });

      // Notify supreme of updated device list
      io.emit('devices_updated', getDeviceList());

      console.log(`📱 Device ${deviceId} registered as ${role}`);
    });

    // Supreme assigns role to a device
    socket.on('assign_role', async ({ targetDeviceId, role }) => {
      const redis = getRedis();

      // Remove old role assignment if any
      for (const [sid, dev] of Object.entries(connectedDevices)) {
        if (dev.role === role && dev.deviceId !== targetDeviceId) {
          await redis.del(`role:${dev.deviceId}`);
          connectedDevices[sid].role = 'unassigned';
          io.to(sid).emit('role_assigned', { role: 'unassigned' });
          const s = io.sockets.sockets.get(sid);
          if (s) { s.leave(role); s.join('unassigned'); }
        }
      }

      await redis.set(`role:${targetDeviceId}`, role);

      // Find socket of target device and update it
      for (const [sid, dev] of Object.entries(connectedDevices)) {
        if (dev.deviceId === targetDeviceId) {
          const oldRole = dev.role;
          connectedDevices[sid].role = role;
          const s = io.sockets.sockets.get(sid);
          if (s) { s.leave(oldRole); s.join(role); }
          io.to(sid).emit('role_assigned', { role });
          break;
        }
      }

      io.emit('devices_updated', getDeviceList());
      console.log(`✅ Device ${targetDeviceId} assigned role: ${role}`);
    });

    socket.on('request_devices', () => {
      socket.emit('devices_updated', getDeviceList());
    });

    socket.on('stop_machine', async ({ targetDeviceId }) => {
      const redis = getRedis();
      await redis.del(`role:${targetDeviceId}`);

      for (const [sid, dev] of Object.entries(connectedDevices)) {
        if (dev.deviceId === targetDeviceId) {
          const oldRole = dev.role;
          dev.role = 'unassigned';
          const s = io.sockets.sockets.get(sid);
          if (s) {
            s.leave(oldRole);
            s.join('unassigned');
          }
          io.to(sid).emit('role_assigned', { role: 'unassigned' });
          io.to(sid).emit('admin_reset', { message: 'Machine stopped by Supreme Device' });
        }
      }

      io.emit('devices_updated', getDeviceList());
      console.log(`🛑 Device ${targetDeviceId} stopped by supreme`);
    });

    socket.on('reset_machines', async () => {
      const redis = getRedis();
      if (activeToken) {
        await redis.del(`token:${activeToken}`);
        activeToken = null;
      }

      io.to('machine1').emit('reset_auth');
      io.to('machine2').emit('reset_voting', { message: 'Voting session reset by Supreme Device' });
      io.to('machine3').emit('reset_receipt', { message: 'Receipt session reset by Supreme Device' });
      io.emit('devices_updated', getDeviceList());
      console.log('🛑 Active voting session reset by supreme');
    });

    // Machine 1: Approve voter after verification
    socket.on('approve_voter', async ({ voterId, voterName }) => {
      const redis = getRedis();
      const token = uuidv4();
      activeToken = token;

      // Store token with 3 min expiry
      await redis.set(`token:${token}`, voterId, { EX: 180 });

      // Send token to machine2 room
      io.to('machine2').emit('voter_approved', { token, voterId, voterName });
      io.to('machine3').emit('voter_approved', { token, voterId, voterName });

      console.log(`✅ Voter ${voterId} approved, token issued`);
    });

    // Machine 2: Vote cast
    socket.on('vote_cast', async ({ token, candidateId, candidateName, candidateSymbol, voterName }) => {
      const redis = getRedis();
      const voterId = await redis.get(`token:${token}`);

      if (!voterId) {
        socket.emit('vote_error', { message: 'Invalid or expired token' });
        return;
      }

      // Invalidate token
      await redis.del(`token:${token}`);
      if (activeToken === token) activeToken = null;

      // Notify machine3 for receipt
      io.to('machine3').emit('print_receipt', {
        voterName,
        candidateName,
        candidateSymbol,
        timestamp: new Date().toISOString(),
      });

      // Notify machine1 to reset
      io.to('machine1').emit('reset_auth');

      socket.emit('vote_success');
      console.log(`🗳️ Vote cast by voter ${voterId} for candidate ${candidateId}`);
    });

    // Supreme: start/end election
    socket.on('election_control', ({ action }) => {
      electionAction = action;
      io.emit('election_status', { action });
      console.log(`🗳️ Election ${action}`);
    });

    socket.on('disconnect', () => {
      const dev = connectedDevices[socket.id];
      if (dev) {
        delete connectedDevices[socket.id];
        io.emit('devices_updated', getDeviceList());
        console.log(`❌ Device ${dev.deviceId} disconnected`);
      }
    });
  });

  function getDeviceList() {
    return Object.entries(connectedDevices).map(([socketId, d]) => ({
      socketId,
      deviceId: d.deviceId,
      role: d.role,
    }));
  }
};
