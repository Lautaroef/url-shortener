import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    // For now, we'll use the anon key for authentication
    // In production, you'd want to use the service role key
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_ANON_KEY') || '', // We'll need to add this to backend .env
    );
  }

  async signUp(email: string, password: string) {
    // For backend, we'll just validate the request
    // The actual signup should happen on the frontend
    return {
      message: 'Please use the frontend to sign up',
    };
  }

  async signIn(email: string, password: string) {
    // For backend, we'll just validate the request
    // The actual signin should happen on the frontend
    return {
      message: 'Please use the frontend to sign in',
    };
  }

  async validateUser(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      userId: data.user.id,
      email: data.user.email,
    };
  }
}