const { createClient } = require('@supabase/supabase-js');

class UserDatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // User Operations
  async createUser(userData) {
    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByClerkId(clerkId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateUser(clerkId, userData) {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerkId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async searchUsersByHandle(handle) {
    const { data, error } = await this.supabase
      .from('users')
      .select('clerk_id, codeforces_handle, codeforces_rating')
      .ilike('codeforces_handle', `%${handle}%`)
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  async updateUserRating(clerkId, rating) {
    console.log('Database: Updating rating for user:', clerkId, 'to rating:', rating);
    
    const { data, error } = await this.supabase
      .from('users')
      .update({
        codeforces_rating: rating,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', clerkId)
      .select()
      .single();

    if (error) {
      console.error('Database error in updateUserRating:', error);
      throw new Error(`Database update failed: ${error.message}`);
    }
    
    console.log('Database: Rating updated successfully:', data);
    return data;
  }

  async checkUserExists(clerkId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('clerk_id')
      .eq('clerk_id', clerkId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }
}

module.exports = new UserDatabaseService();