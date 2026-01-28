import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { AuthUser } from '@/types';

class AuthService {
  mapUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email!,
      username: user.user_metadata?.username || user.user_metadata?.full_name || user.email!.split('@')[0],
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    };
  }

  async sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }

  async verifyOtpAndSetPassword(email: string, token: string, password: string, username: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { username },
    });
    if (updateError) throw updateError;

    return data.user;
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  }
}

export const authService = new AuthService();