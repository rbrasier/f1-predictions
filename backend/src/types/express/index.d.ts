import { JWTPayload } from '../../middleware/auth';

declare global {
  namespace Express {
    interface User extends JWTPayload {
      // Express.User can be either the JWT payload OR the full User from database
      // Adding optional fields to make it compatible with both
      password_hash?: string | null;
      display_name?: string;
      email?: string | null;
      created_at?: string;
      google_id?: string | null;
      google_email?: string | null;
      oauth_snooze_until?: string | null;
    }
  }
}

export {};
