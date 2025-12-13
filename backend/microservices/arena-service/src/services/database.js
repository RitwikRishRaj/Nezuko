const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Arena Session Operations
  async createArenaSession(sessionData) {
    console.log('Database: Creating arena session with data:', sessionData);
    console.log('Database: Custom links data:', {
      custom_problem_links: sessionData.custom_problem_links,
      use_custom_links: sessionData.use_custom_links
    });
    
    const { data, error } = await this.supabase
      .from('arena_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database: Arena session creation error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('✅ Database: Arena session created successfully:', {
      id: data.id,
      room_id: data.room_id,
      questionsLength: data.questions?.length || 0,
      questionsType: typeof data.questions,
      use_custom_links: data.use_custom_links,
      custom_problem_links_length: data.custom_problem_links?.length || 0
    });
    
    console.log('💾 Stored questions data:', data.questions);
    console.log('💾 Stored custom links data:', data.custom_problem_links);
    return data;
  }

  async getArenaSessionByRoomId(roomId) {
    console.log('🔍 Database: Querying arena session for room:', roomId);
    
    const { data, error } = await this.supabase
      .from('arena_sessions')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database: Arena session query error:', error);
      throw error;
    }
    
    console.log('📋 Database: Arena session query result:', {
      found: !!data,
      use_custom_links: data?.use_custom_links,
      custom_problem_links_length: data?.custom_problem_links?.length || 0,
      session_id: data?.id
    });
    
    return data;
  }

  async getArenaSession(sessionId) {
    const { data, error } = await this.supabase
      .from('arena_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateSessionStatus(sessionId, status) {
    const updateData = {
      session_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.end_time = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('arena_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Participant Operations
  async createParticipant(participantData) {
    console.log('Database: Creating participant with data:', participantData);
    
    const { data, error } = await this.supabase
      .from('participant_progress')
      .insert({
        ...participantData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database: Participant creation error:', error);
      throw error;
    }
    
    console.log('Database: Participant created successfully:', data);
    return data;
  }

  async getSessionParticipants(sessionId) {
    const { data, error } = await this.supabase
      .from('participant_progress')
      .select('*')
      .eq('arena_session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getParticipantProgress(sessionId, participantClerkId) {
    const { data, error } = await this.supabase
      .from('participant_progress')
      .select('*')
      .eq('arena_session_id', sessionId)
      .eq('participant_clerk_id', participantClerkId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateParticipantProgress(sessionId, participantClerkId, progressData) {
    console.log('Database: Updating participant progress:', { sessionId, participantClerkId, progressData });
    
    // If score_increment is provided, we need to add it to existing score
    if (progressData.score_increment !== undefined) {
      const { data: currentData } = await this.supabase
        .from('participant_progress')
        .select('score')
        .eq('arena_session_id', sessionId)
        .eq('participant_clerk_id', participantClerkId)
        .single();

      const currentScore = currentData?.score || 0;
      progressData.score = currentScore + progressData.score_increment;
      delete progressData.score_increment;
    }

    const { data, error } = await this.supabase
      .from('participant_progress')
      .update({
        ...progressData,
        updated_at: new Date().toISOString()
      })
      .eq('arena_session_id', sessionId)
      .eq('participant_clerk_id', participantClerkId)
      .select()
      .single();

    if (error) {
      console.error('Database: Participant progress update error:', error);
      throw error;
    }
    
    console.log('Database: Participant progress updated successfully:', data);
    return data;
  }

  // Submission Operations
  async createSubmission(submissionData) {
    console.log('Database: Creating submission with data:', submissionData);
    
    const { data, error } = await this.supabase
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();

    if (error) {
      console.error('Database: Submission creation error:', error);
      throw error;
    }
    
    console.log('Database: Submission created successfully:', data);
    return data;
  }

  async getSessionSubmissions(sessionId) {
    const { data, error } = await this.supabase
      .from('submissions')
      .select('*')
      .eq('arena_session_id', sessionId)
      .order('submission_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getParticipantSubmissions(sessionId, participantClerkId) {
    const { data, error } = await this.supabase
      .from('submissions')
      .select('*')
      .eq('arena_session_id', sessionId)
      .eq('participant_clerk_id', participantClerkId)
      .order('submission_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Leaderboard and Stats Operations
  async getSessionLeaderboard(sessionId) {
    console.log('Database: Getting leaderboard for session:', sessionId);
    
    const { data, error } = await this.supabase
      .from('participant_progress')
      .select(`
        participant_clerk_id,
        participant_handle,
        team_type,
        score,
        last_activity,
        problem_submissions
      `)
      .eq('arena_session_id', sessionId)
      .order('score', { ascending: false });

    if (error) {
      console.error('Database: Leaderboard query error:', error);
      throw error;
    }
    
    console.log('Database: Leaderboard retrieved successfully:', data);
    return data || [];
  }

  async getTeamStats(sessionId) {
    console.log('Database: Getting team stats for session:', sessionId);
    
    const { data, error } = await this.supabase
      .from('participant_progress')
      .select(`
        team_type,
        score,
        participant_clerk_id
      `)
      .eq('arena_session_id', sessionId);

    if (error) {
      console.error('Database: Team stats query error:', error);
      throw error;
    }

    // Calculate team totals
    const teamStats = {
      host: {
        totalScore: 0,
        participantCount: 0,
        participants: []
      },
      opponent: {
        totalScore: 0,
        participantCount: 0,
        participants: []
      }
    };

    data?.forEach(participant => {
      const team = teamStats[participant.team_type];
      if (team) {
        team.totalScore += participant.score || 0;
        team.participantCount += 1;
        team.participants.push(participant);
      }
    });

    console.log('Database: Team stats calculated successfully:', teamStats);
    return teamStats;
  }
}

module.exports = new DatabaseService();