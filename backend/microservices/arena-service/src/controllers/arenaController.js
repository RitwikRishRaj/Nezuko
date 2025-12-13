const Joi = require('joi');
const db = require('../services/database');

// Validation schemas
const createSessionSchema = Joi.object({
  roomId: Joi.string().required(),
  questions: Joi.array().items(Joi.object()).required(),
  config: Joi.object().required(),
  participants: Joi.array().items(Joi.object()).required(),
  customProblemLinks: Joi.array().items(Joi.string()).allow(null).optional(),
  useCustomLinks: Joi.boolean().default(false)
});

const submitSolutionSchema = Joi.object({
  sessionId: Joi.string().required(),
  problemId: Joi.string().required(),
  status: Joi.string().valid('accepted', 'wrong_answer', 'time_limit', 'runtime_error', 'compilation_error').required(),
  score: Joi.number().integer().min(0).default(0),
  submissionTime: Joi.date().iso().optional()
});

const joinSessionSchema = Joi.object({
  participantClerkId: Joi.string().required(),
  teamType: Joi.string().valid('host', 'opponent').required()
});

class ArenaController {
  // Arena Session Management
  async createSession(req, res, next) {
    try {
      console.log('🎯 CreateSession called with:', { 
        body: req.body, 
        userId: req.userId,
        customProblemLinks: req.body.customProblemLinks,
        useCustomLinks: req.body.useCustomLinks,
        questionsLength: req.body.questions?.length || 0
      });
      
      console.log('🔗 Arena service received custom links:', {
        customProblemLinks: req.body.customProblemLinks,
        useCustomLinks: req.body.useCustomLinks,
        linksType: typeof req.body.customProblemLinks,
        linksLength: req.body.customProblemLinks?.length || 0
      });
      
      const { error, value } = createSessionSchema.validate(req.body);
      if (error) {
        console.error('❌ Session validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
      }

      const { roomId, questions, config, participants, customProblemLinks, useCustomLinks } = value;

      // Create arena session
      const sessionData = {
        room_id: roomId,
        questions: questions,
        config: config,
        session_status: 'active',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + (config.minutes * 60 * 1000)).toISOString(),
        created_by: req.userId,
        custom_problem_links: customProblemLinks,
        use_custom_links: useCustomLinks
      };

      console.log('🎯 Creating arena session with data:', {
        room_id: sessionData.room_id,
        questionsLength: sessionData.questions?.length || 0,
        questionsType: typeof sessionData.questions,
        custom_problem_links: sessionData.custom_problem_links,
        customLinksLength: sessionData.custom_problem_links?.length || 0,
        use_custom_links: sessionData.use_custom_links
      });
      
      console.log('📋 Full questions array:', sessionData.questions);
      console.log('🔗 Full custom links array:', sessionData.custom_problem_links);
      
      const session = await db.createArenaSession(sessionData);
      console.log('✅ Arena session created successfully:', session);

      // Create participant records
      const participantPromises = participants.map(participant => {
        return db.createParticipant({
          arena_session_id: session.id,
          participant_clerk_id: participant.clerk_id,
          team_type: participant.team_type,
          participant_handle: participant.codeforces_handle
        });
      });

      await Promise.all(participantPromises);
      console.log('Participants created successfully');
      
      res.json({ 
        success: true, 
        session: {
          ...session,
          participants: participants
        }
      });
    } catch (err) {
      console.error('CreateSession error:', { message: err.message, code: err.code, details: err.details });
      next(err);
    }
  }

  async getSession(req, res, next) {
    try {
      const { roomId } = req.params;
      
      if (!roomId) {
        return res.status(400).json({ error: 'Room ID is required' });
      }

      console.log('🔍 Getting arena session for room:', roomId);
      const session = await db.getArenaSessionByRoomId(roomId);
      
      console.log('📋 Arena session query result:', session);
      
      if (!session) {
        console.log('❌ No arena session found for room:', roomId);
        return res.status(404).json({ error: 'Arena session not found' });
      }
      
      console.log('✅ Arena session found:', {
        id: session.id,
        use_custom_links: session.use_custom_links,
        custom_problem_links: session.custom_problem_links?.length || 0
      });

      // Get participants for this session
      const participants = await db.getSessionParticipants(session.id);
      
      res.json({ 
        session: {
          ...session,
          participants: participants
        }
      });
    } catch (err) {
      console.error('GetSession error:', err);
      next(err);
    }
  }

  async updateSessionStatus(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;

      if (!['active', 'completed', 'paused'].includes(status)) {
        return res.status(400).json({ error: 'Invalid session status' });
      }

      const updatedSession = await db.updateSessionStatus(sessionId, status);
      res.json({ success: true, session: updatedSession });
    } catch (err) {
      next(err);
    }
  }

  // Participant Management
  async getParticipants(req, res, next) {
    try {
      const { sessionId } = req.params;
      const participants = await db.getSessionParticipants(sessionId);
      res.json({ participants });
    } catch (err) {
      next(err);
    }
  }

  async joinSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { error, value } = joinSessionSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { participantClerkId, teamType } = value;

      const participant = await db.createParticipant({
        arena_session_id: sessionId,
        participant_clerk_id: participantClerkId,
        team_type: teamType
      });

      res.json({ success: true, participant });
    } catch (err) {
      next(err);
    }
  }

  // Submission Management
  async submitSolution(req, res, next) {
    try {
      console.log('SubmitSolution called with:', { body: req.body, userId: req.userId });
      
      const { error, value } = submitSolutionSchema.validate(req.body);
      if (error) {
        console.error('Submission validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
      }

      const { sessionId, problemId, status, score, submissionTime } = value;

      // Get session info for timing calculations
      const session = await db.getArenaSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Arena session not found' });
      }

      const startTime = new Date(session.start_time);
      const currentTime = new Date(submissionTime || Date.now());
      const timeFromStartSeconds = Math.floor((currentTime - startTime) / 1000); // seconds from contest start
      const timeFromStartMinutes = Math.floor(timeFromStartSeconds / 60); // minutes from contest start

      console.log('Time calculations:', {
        startTime: startTime.toISOString(),
        currentTime: currentTime.toISOString(),
        timeFromStartSeconds,
        timeFromStartMinutes
      });

      const submissionData = {
        arena_session_id: sessionId,
        participant_clerk_id: req.userId,
        problem_id: problemId,
        status: status,
        score: score,
        submission_time: submissionTime || new Date().toISOString(),
        time_taken: timeFromStartSeconds // Store time from start in seconds
      };

      console.log('Creating submission with data:', submissionData);
      const submission = await db.createSubmission(submissionData);
      
      // Also create detailed submission record for rating calculations in problem_submissions table
      try {
        const pointsServiceUrl = process.env.POINTS_SERVICE_URL || 'http://localhost:3006';
        await fetch(`${pointsServiceUrl}/api/points/submission`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
          body: JSON.stringify({
            sessionId,
            userId: req.userId,
            problemId,
            status,
            score,
            timeFromStart: timeFromStartSeconds, // Pass time in seconds
            submissionTime: submissionTime || new Date().toISOString()
          })
        });
      } catch (pointsError) {
        console.error('Failed to record submission in points service:', pointsError);
        // Don't fail the main submission if points service is down
      }
      
      // Update participant progress with proper time tracking
      const currentProgress = await db.getParticipantProgress(sessionId, req.userId);
      const newFinalScore = (currentProgress?.final_score || 0) + (status === 'accepted' ? score : 0);
      
      await db.updateParticipantProgress(sessionId, req.userId, {
        last_activity: new Date().toISOString(),
        score_increment: status === 'accepted' ? score : 0,
        final_score: newFinalScore,
        final_score_time: status === 'accepted' ? currentTime.toISOString() : currentProgress?.final_score_time
      });

      console.log('Submission created successfully:', submission);
      res.json({ success: true, submission, timeFromStart: timeFromStartSeconds });
    } catch (err) {
      console.error('SubmitSolution error:', err);
      next(err);
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { participantId } = req.query;

      let submissions;
      if (participantId) {
        submissions = await db.getParticipantSubmissions(sessionId, participantId);
      } else {
        submissions = await db.getSessionSubmissions(sessionId);
      }

      res.json({ submissions });
    } catch (err) {
      next(err);
    }
  }

  // Leaderboard and Stats
  async getLeaderboard(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      console.log('Getting leaderboard for session:', sessionId);
      const leaderboard = await db.getSessionLeaderboard(sessionId);
      
      res.json({ leaderboard });
    } catch (err) {
      console.error('GetLeaderboard error:', err);
      next(err);
    }
  }

  async getTeamStats(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      console.log('Getting team stats for session:', sessionId);
      const teamStats = await db.getTeamStats(sessionId);
      
      res.json({ teamStats });
    } catch (err) {
      console.error('GetTeamStats error:', err);
      next(err);
    }
  }

  // Sync and Real-time
  async syncProgress(req, res, next) {
    try {
      const { sessionId, participantId, progressData } = req.body;

      if (!sessionId || !participantId) {
        return res.status(400).json({ error: 'Session ID and Participant ID are required' });
      }

      await db.updateParticipantProgress(sessionId, participantId, {
        ...progressData,
        last_activity: new Date().toISOString()
      });

      res.json({ success: true, message: 'Progress synced successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ArenaController();