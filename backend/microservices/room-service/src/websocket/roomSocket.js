const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

class RoomWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.roomConnections = new Map(); // roomId -> Set of WebSocket connections
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'join_room':
        this.joinRoom(ws, data.roomId);
        break;
      case 'leave_room':
        this.leaveRoom(ws, data.roomId);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  joinRoom(ws, roomId) {
    if (!this.roomConnections.has(roomId)) {
      this.roomConnections.set(roomId, new Set());
      this.setupRoomSubscription(roomId);
    }

    this.roomConnections.get(roomId).add(ws);
    ws.roomId = roomId;

    ws.send(JSON.stringify({ 
      type: 'joined_room', 
      roomId,
      message: 'Successfully joined room updates' 
    }));

    console.log(`Client joined room: ${roomId}`);
  }

  leaveRoom(ws, roomId) {
    if (this.roomConnections.has(roomId)) {
      this.roomConnections.get(roomId).delete(ws);
      
      // Clean up empty rooms
      if (this.roomConnections.get(roomId).size === 0) {
        this.roomConnections.delete(roomId);
        // TODO: Clean up Supabase subscription for this room
      }
    }
    
    delete ws.roomId;
    console.log(`Client left room: ${roomId}`);
  }

  handleDisconnect(ws) {
    if (ws.roomId) {
      this.leaveRoom(ws, ws.roomId);
    }
  }

  setupRoomSubscription(roomId) {
    const channel = this.supabase
      .channel(`room_${roomId}_ws`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_invites',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          this.broadcastToRoom(roomId, {
            type: 'room_invite_update',
            payload
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_config',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          this.broadcastToRoom(roomId, {
            type: 'room_config_update',
            payload
          });
        }
      )
      .subscribe();

    console.log(`Set up Supabase subscription for room: ${roomId}`);
  }

  broadcastToRoom(roomId, message) {
    const connections = this.roomConnections.get(roomId);
    if (connections) {
      const messageStr = JSON.stringify(message);
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }
}

module.exports = RoomWebSocketServer;