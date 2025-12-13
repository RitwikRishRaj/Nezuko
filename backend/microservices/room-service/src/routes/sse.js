const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// SSE endpoint for room updates
router.get('/room/:roomId/events', async (req, res) => {
  const { roomId } = req.params;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', roomId })}\n\n`);

  // Set up Supabase realtime subscription
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const channel = supabase
    .channel(`room_${roomId}_sse`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_invites',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        res.write(`data: ${JSON.stringify({ 
          type: 'room_invite_change', 
          payload 
        })}\n\n`);
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
        res.write(`data: ${JSON.stringify({ 
          type: 'room_config_change', 
          payload 
        })}\n\n`);
      }
    )
    .subscribe();

  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE client disconnected for room: ${roomId}`);
    supabase.removeChannel(channel);
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

module.exports = router;