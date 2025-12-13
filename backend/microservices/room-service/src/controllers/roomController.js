const Joi = require('joi');
const db = require('../services/database');

// Validation schemas
const roomConfigSchema = Joi.object({
  roomId: Joi.string().required(),
  questionCount: Joi.number().integer().min(1).max(20).required(),
  minutes: Joi.number().integer().min(1).max(560).required(),
  format: Joi.string().valid('icpc', 'ioi', 'long').required(),
  minRating: Joi.number().integer().min(800).max(3500).required(),
  maxRating: Joi.number().integer().min(800).max(3500).required(),
  tags: Joi.array().items(Joi.string()).default([]),
  isRandomTags: Joi.boolean().default(false),
  problems: Joi.array().allow(null).default(null),
  customProblemLinks: Joi.array().items(Joi.string()).allow(null).default(null),
  useCustomLinks: Joi.boolean().default(false)
});

const inviteSchema = Joi.object({
  invitedUserId: Joi.string().required(),
  roomId: Joi.string().required(),
  slot: Joi.string().required(),
  slotType: Joi.string().valid('host', 'opponent').required(),
  roomMode: Joi.string().valid('1v1', 'team-vs-team').required()
});

const respondInviteSchema = Joi.object({
  roomId: Joi.string().required(),
  response: Joi.string().valid('accept', 'reject').required()
});

class RoomController {
  // Room Configuration
  async createOrUpdateConfig(req, res, next) {
    try {
      console.log('CreateOrUpdateConfig called with:', { body: req.body, userId: req.userId });
      
      // Check if user is authenticated
      if (!req.userId) {
        console.error('No userId found - authentication failed');
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { error, value } = roomConfigSchema.validate(req.body);
      if (error) {
        console.error('Config validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
      }

      const {
        roomId,
        questionCount,
        minutes,
        format,
        minRating,
        maxRating,
        tags,
        isRandomTags,
        problems,
        customProblemLinks,
        useCustomLinks
      } = value;

      const configData = {
        room_id: roomId,
        question_count: questionCount,
        minutes,
        format,
        min_rating: minRating,
        max_rating: maxRating,
        tags,
        is_random_tags: isRandomTags,
        problems,
        custom_problem_links: customProblemLinks,
        use_custom_links: useCustomLinks,
        created_by: req.userId,
        updated_at: new Date().toISOString()
      };

      console.log('🔗 Storing custom links in room config:', {
        customProblemLinks: customProblemLinks || null,
        useCustomLinks: useCustomLinks || false,
        linksLength: customProblemLinks?.length || 0
      });

      console.log('Creating/updating config with data:', configData);
      const config = await db.createOrUpdateRoomConfig(configData);
      console.log('Config created/updated successfully:', config);
      
      res.json({ success: true, config });
    } catch (err) {
      console.error('CreateOrUpdateConfig error:', { message: err.message, code: err.code, details: err.details });
      next(err);
    }
  }

  async getConfig(req, res, next) {
    try {
      const { roomId } = req.query;
      
      if (!roomId) {
        return res.status(400).json({ error: 'Room ID is required' });
      }

      const config = await db.getRoomConfig(roomId);
      
      if (!config) {
        return res.status(404).json({ error: 'Room configuration not found' });
      }

      res.json({ config });
    } catch (err) {
      next(err);
    }
  }

  // Room Invitations
  async createInvite(req, res, next) {
    try {
      console.log('CreateInvite called with:', { body: req.body, userId: req.userId });
      
      const { error, value } = inviteSchema.validate(req.body);
      if (error) {
        console.error('Validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
      }

      const { invitedUserId, roomId, slot, slotType, roomMode } = value;

      // Prevent self-invitation
      if (invitedUserId === req.userId) {
        console.log('Self-invitation attempt blocked');
        return res.status(400).json({ error: 'Cannot invite yourself' });
      }

      // Get inviter's handle from user service
      let inviterHandle = null;
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
        console.log('Fetching inviter details from:', `${userServiceUrl}/api/user/details?clerkId=${req.userId}`);
        const userResponse = await fetch(`${userServiceUrl}/api/user/details?clerkId=${req.userId}`);
        console.log('Inviter fetch response status:', userResponse.status);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('Inviter user data:', userData);
          inviterHandle = userData.codeforces_handle;
        } else {
          const errorText = await userResponse.text();
          console.error('Failed to fetch inviter details:', errorText);
        }
      } catch (fetchError) {
        console.error('Failed to fetch inviter handle:', fetchError);
      }

      if (!inviterHandle) {
        console.error('Could not get inviter handle, aborting invite');
        return res.status(400).json({ error: 'Could not find inviter profile. Please make sure you have verified your Codeforces handle.' });
      }

      // Get invited user's handle as well
      let invitedHandle = null;
      try {
        const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
        console.log('Fetching invited user details from:', `${userServiceUrl}/api/user/details?clerkId=${invitedUserId}`);
        const userResponse = await fetch(`${userServiceUrl}/api/user/details?clerkId=${invitedUserId}`);
        console.log('Invited user fetch response status:', userResponse.status);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('Invited user data:', userData);
          invitedHandle = userData.codeforces_handle;
        } else {
          const errorText = await userResponse.text();
          console.error('Failed to fetch invited user details:', errorText);
        }
      } catch (fetchError) {
        console.error('Failed to fetch invited user handle:', fetchError);
      }

      if (!invitedHandle) {
        console.error('Could not get invited user handle, aborting invite');
        return res.status(400).json({ error: 'Could not find invited user profile. The user may not have verified their Codeforces handle.' });
      }

      const inviteData = {
        room_id: roomId,
        inviter_clerk_id: req.userId,
        invited_clerk_id: invitedUserId,
        inviter_handle: inviterHandle,
        invited_handle: invitedHandle,
        slot,
        slot_type: slotType,
        room_mode: roomMode,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('Creating invite with data:', inviteData);
      const invite = await db.createRoomInvite(inviteData);
      console.log('Invite created successfully:', invite);
      
      res.json({ success: true, invite });
    } catch (err) {
      console.error('CreateInvite error:', { code: err.code, message: err.message, details: err.details });
      if (err.code === '23505') {
        return res.status(409).json({ error: 'User already invited to this slot' });
      }
      next(err);
    }
  }

  async getRoomState(req, res, next) {
    try {
      const { roomId } = req.query;
      
      if (!roomId) {
        return res.status(400).json({ error: 'Room ID is required' });
      }

      const invites = await db.getRoomInvites(roomId);
      res.json({ invites });
    } catch (err) {
      next(err);
    }
  }

  async respondToInvite(req, res, next) {
    try {
      const { error, value } = respondInviteSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { roomId, response } = value;
      const status = response === 'accept' ? 'accepted' : 'rejected';

      const updatedInvite = await db.updateInviteStatus(roomId, req.userId, status);
      res.json({ success: true, invite: updatedInvite });
    } catch (err) {
      next(err);
    }
  }

  async removeUser(req, res, next) {
    try {
      console.log('RemoveUser called with:', { body: req.body, userId: req.userId });
      
      const { roomId, slot } = req.body;

      if (!roomId || !slot) {
        console.error('Missing roomId or slot');
        return res.status(400).json({ error: 'Room ID and slot are required' });
      }

      console.log('Removing user from room:', roomId, 'slot:', slot);
      await db.removeRoomInvite(roomId, slot);
      console.log('User removed successfully');
      
      res.json({ success: true, message: 'User removed from room' });
    } catch (err) {
      console.error('RemoveUser error:', err);
      next(err);
    }
  }

  async getPendingInvites(req, res, next) {
    try {
      const invites = await db.getUserPendingInvites(req.userId);
      res.json({ invites });
    } catch (err) {
      next(err);
    }
  }

  // Game Management
  async startGame(req, res, next) {
    try {
      const { roomId, questions, customProblemLinks, useCustomLinks } = req.body;

      console.log('🎯 StartGame called with:', {
        roomId,
        questionsLength: questions?.length || 0,
        customProblemLinks: customProblemLinks || null,
        customProblemLinksLength: customProblemLinks?.length || 0,
        useCustomLinks: useCustomLinks || false,
        userId: req.userId
      });

      if (!roomId) {
        return res.status(400).json({ error: 'Room ID is required' });
      }

      // Get room configuration first
      const roomConfig = await db.getRoomConfig(roomId);
      if (!roomConfig) {
        return res.status(404).json({ error: 'Room configuration not found' });
      }

      console.log('🔍 Room config custom links:', {
        use_custom_links: roomConfig.use_custom_links,
        custom_problem_links: roomConfig.custom_problem_links,
        linksLength: roomConfig.custom_problem_links?.length || 0
      });

      // Use custom links from room config if not provided in request
      let finalCustomProblemLinks = customProblemLinks;
      let finalUseCustomLinks = useCustomLinks;
      
      if (!finalCustomProblemLinks && roomConfig.use_custom_links && roomConfig.custom_problem_links) {
        console.log('🔄 Using custom links from room config as fallback');
        finalCustomProblemLinks = roomConfig.custom_problem_links;
        finalUseCustomLinks = roomConfig.use_custom_links;
      }

      // Verify user is room creator (check config first, then invites as fallback)
      let roomCreatorId = roomConfig.created_by;
      
      // If no creator in config, try to get from invites
      if (!roomCreatorId) {
        const invites = await db.getRoomInvites(roomId);
        if (invites && invites.length > 0) {
          roomCreatorId = invites[0].inviter_clerk_id;
        }
      }
      
      // If still no creator found, the room doesn't exist or is invalid
      if (!roomCreatorId) {
        return res.status(404).json({ error: 'Room not found or invalid' });
      }
      
      if (roomCreatorId !== req.userId) {
        return res.status(403).json({ error: 'Only room creator can start the game' });
      }

      // Get invites for participants (may be empty for solo testing)
      const invites = await db.getRoomInvites(roomId);

      const gameStartTime = new Date().toISOString();
      
      // Update room_config with game start info
      await db.updateRoomGameStatus(roomId, {
        game_status: 'started',
        game_started_by: req.userId,
        game_started_at: gameStartTime
      });

      // Prepare participants for arena session
      const acceptedInvites = invites ? invites.filter(invite => invite.status === 'accepted') : [];
      
      // Get room creator's handle
      let creatorHandle = 'Unknown';
      if (invites && invites.length > 0) {
        creatorHandle = invites[0].inviter_handle;
      } else {
        // Fetch creator's handle from user service if no invites exist
        try {
          const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
          const userResponse = await fetch(`${userServiceUrl}/api/user/details?clerkId=${roomCreatorId}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            creatorHandle = userData.codeforces_handle || 'Unknown';
          }
        } catch (error) {
          console.error('Failed to fetch creator handle:', error);
        }
      }
      
      const participants = [
        // Add room creator as host1
        {
          clerk_id: roomCreatorId,
          codeforces_handle: creatorHandle,
          team_type: 'host'
        },
        // Add accepted invites
        ...acceptedInvites.map(invite => ({
          clerk_id: invite.invited_clerk_id,
          codeforces_handle: invite.invited_handle,
          team_type: invite.slot_type
        }))
      ];

      // Create arena session via arena service
      try {
        const arenaServiceUrl = process.env.ARENA_SERVICE_URL || 'http://localhost:3004';
        console.log('Creating arena session via:', `${arenaServiceUrl}/api/arena/session`);
        
        console.log('🎯 Calling arena service at:', `${arenaServiceUrl}/api/arena/session`);
        console.log('🎯 Arena payload:', {
          roomId,
          questionsLength: questions?.length || 0,
          customProblemLinks: finalCustomProblemLinks || null,
          useCustomLinks: finalUseCustomLinks || false,
          participantsCount: participants.length
        });

        const arenaResponse = await fetch(`${arenaServiceUrl}/api/arena/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization // Forward auth header
          },
          body: JSON.stringify({
            roomId,
            questions: questions || [],
            config: roomConfig,
            participants,
            customProblemLinks: finalCustomProblemLinks || null,
            useCustomLinks: finalUseCustomLinks || false
          })
        });

        console.log('🎯 Arena service response status:', arenaResponse.status);

        if (!arenaResponse.ok) {
          let errorData;
          try {
            errorData = await arenaResponse.json();
          } catch (jsonError) {
            const textResponse = await arenaResponse.text();
            console.error('❌ Arena service non-JSON error response:', textResponse);
            errorData = { error: `Arena service error: ${arenaResponse.status} - ${textResponse}` };
          }
          console.error('❌ Arena service error:', errorData);
          throw new Error(errorData.error || 'Failed to create arena session');
        }

        const arenaData = await arenaResponse.json();
        console.log('✅ Arena session created successfully:', {
          sessionId: arenaData.session?.id,
          useCustomLinks: arenaData.session?.use_custom_links,
          customLinksLength: arenaData.session?.custom_problem_links?.length || 0
        });

        // Verify the arena session was created with correct custom links data
        if (finalUseCustomLinks && (!arenaData.session?.use_custom_links || !arenaData.session?.custom_problem_links)) {
          console.error('⚠️ Arena session created but custom links data missing');
        }

        res.json({
          success: true,
          gameStartTime,
          participants,
          arenaSession: arenaData.session
        });
      } catch (arenaError) {
        console.error('Failed to create arena session:', arenaError);
        // Fallback to original behavior if arena service is unavailable
        res.json({
          success: true,
          gameStartTime,
          participants,
          arenaSession: null,
          warning: 'Arena session creation failed, using fallback mode'
        });
      }
    } catch (err) {
      next(err);
    }
  }

  async discardRoom(req, res, next) {
    try {
      const { roomId } = req.body;

      if (!roomId) {
        return res.status(400).json({ error: 'Room ID is required' });
      }

      // Verify user is room creator
      const invites = await db.getRoomInvites(roomId);
      if (invites && invites.length > 0) {
        const roomCreatorId = invites[0].inviter_clerk_id;
        if (roomCreatorId !== req.userId) {
          return res.status(403).json({ error: 'Only room creator can discard the room' });
        }
      }

      // Delete all invites and room config
      await Promise.all([
        db.deleteAllRoomInvites(roomId),
        db.deleteRoomConfig(roomId)
      ]);

      res.json({ success: true, message: 'Room discarded successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RoomController();