const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // User Ratings Operations
  async getUserRating(userId) {
    // Try user_ratings table first, fallback to users table
    let { data, error } = await this.supabase
      .from('user_ratings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // If not found in user_ratings, check users table
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('clerk_id, current_rating, peak_rating, contests_participated, codeforces_rating')
        .eq('clerk_id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;
      
      if (userData) {
        // Create user_ratings record from users table data
        const ratingData = {
          user_id: userData.clerk_id,
          current_rating: userData.current_rating || 1200,
          peak_rating: userData.peak_rating || 1200,
          codeforces_rating: userData.codeforces_rating || 0,
          contests_participated: userData.contests_participated || 0
        };
        
        data = await this.createOrUpdateUserRating(ratingData);
      }
    } else if (error) {
      throw error;
    }

    return data;
  }

  async createOrUpdateUserRating(ratingData) {
    const { data, error } = await this.supabase
      .from('user_ratings')
      .upsert(ratingData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserRating(userId, newRating, ratingChange) {
    // Get current rating
    const currentRating = await this.getUserRating(userId);
    
    const updateData = {
      user_id: userId,
      current_rating: newRating,
      peak_rating: Math.max(currentRating?.peak_rating || 1200, newRating),
      contests_participated: (currentRating?.contests_participated || 0) + 1,
      updated_at: new Date().toISOString()
    };

    return await this.createOrUpdateUserRating(updateData);
  }

  // User Points Operations
  async getUserPoints(userId) {
    const { data, error } = await this.supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createOrUpdateUserPoints(pointsData) {
    const { data, error } = await this.supabase
      .from('user_points')
      .upsert(pointsData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addPoints(userId, points, reason, metadata = {}) {
    // Start transaction-like operation
    const { data: currentPoints } = await this.supabase
      .from('user_points')
      .select('total_points, arena_points, practice_points')
      .eq('user_id', userId)
      .single();

    const newTotalPoints = (currentPoints?.total_points || 0) + points;
    const newArenaPoints = reason.includes('arena') ? 
      (currentPoints?.arena_points || 0) + points : 
      (currentPoints?.arena_points || 0);
    const newPracticePoints = reason.includes('practice') ? 
      (currentPoints?.practice_points || 0) + points : 
      (currentPoints?.practice_points || 0);

    // Update user points
    const { data: updatedPoints, error: pointsError } = await this.supabase
      .from('user_points')
      .upsert({
        user_id: userId,
        total_points: newTotalPoints,
        arena_points: newArenaPoints,
        practice_points: newPracticePoints,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (pointsError) throw pointsError;

    // Create points transaction record
    const { data: transaction, error: transactionError } = await this.supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        points: points,
        reason: reason,
        metadata: metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    return { updatedPoints, transaction };
  }

  // Points Transactions
  async getPointsHistory(userId, limit = 50) {
    const { data, error } = await this.supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Rating History Operations
  async createRatingHistory(historyData) {
    const { data, error } = await this.supabase
      .from('rating_history')
      .insert(historyData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRatingHistory(userId, limit = 50) {
    const { data, error } = await this.supabase
      .from('rating_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Leaderboard Operations
  async getRatingLeaderboard(limit = 100) {
    const { data, error } = await this.supabase
      .from('user_ratings')
      .select(`
        user_id,
        current_rating,
        peak_rating,
        contests_participated,
        updated_at
      `)
      .order('current_rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getGlobalLeaderboard(limit = 100) {
    const { data, error } = await this.supabase
      .from('user_points')
      .select(`
        user_id,
        total_points,
        arena_points,
        practice_points,
        updated_at
      `)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getArenaLeaderboard(limit = 100) {
    const { data, error } = await this.supabase
      .from('user_points')
      .select(`
        user_id,
        arena_points,
        total_points,
        updated_at
      `)
      .order('arena_points', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Session Results Operations
  async createSessionResult(resultData) {
    const { data, error } = await this.supabase
      .from('session_results')
      .insert(resultData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessionResults(sessionId) {
    const { data, error } = await this.supabase
      .from('session_results')
      .select('*')
      .eq('session_id', sessionId)
      .order('final_rank', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Problem Submissions Operations
  async createProblemSubmission(submissionData) {
    const { data, error } = await this.supabase
      .from('problem_submissions')
      .insert(submissionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessionSubmissions(sessionId, userId = null) {
    let query = this.supabase
      .from('problem_submissions')
      .select('*')
      .eq('session_id', sessionId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .order('submission_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getProblemSubmissions(sessionId, userId, problemId) {
    const { data, error } = await this.supabase
      .from('problem_submissions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .order('submission_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Team Performance Operations
  async createTeamPerformance(teamData) {
    const { data, error } = await this.supabase
      .from('team_performance')
      .insert(teamData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTeamPerformance(sessionId) {
    const { data, error } = await this.supabase
      .from('team_performance')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data || [];
  }

  // Arena Session Points (backward compatibility)
  async getSessionPoints(sessionId) {
    // Use new session_results table
    return await this.getSessionResults(sessionId);
  }

  async createSessionPoints(sessionPointsData) {
    // Convert to new session_results format
    const resultData = {
      session_id: sessionPointsData.session_id,
      user_id: sessionPointsData.user_id,
      final_score: sessionPointsData.points,
      problems_solved: sessionPointsData.problems_solved,
      final_rank: sessionPointsData.rank,
      old_rating: sessionPointsData.old_rating,
      new_rating: sessionPointsData.new_rating,
      rating_change: sessionPointsData.rating_change
    };

    return await this.createSessionResult(resultData);
  }

  // Statistics
  async getUserStats(userId) {
    const [pointsData, transactionsData] = await Promise.all([
      this.getUserPoints(userId),
      this.getPointsHistory(userId, 10)
    ]);

    return {
      points: pointsData,
      recentTransactions: transactionsData
    };
  }
}

module.exports = new DatabaseService();