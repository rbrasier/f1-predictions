import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db/database';
import { User } from '../types';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4001/api/auth/google/callback',
      passReqToCallback: true,
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const googleId = profile.id;
        const googleEmail = profile.emails?.[0]?.value || null;
        const displayName = profile.displayName || googleEmail?.split('@')[0] || 'User';

        // Check if user exists with this Google ID
        const existingGoogleUser = await db.query(
          'SELECT * FROM users WHERE google_id = $1',
          [googleId]
        );

        if (existingGoogleUser.rows.length > 0) {
          // User already linked with Google account
          return done(null, existingGoogleUser.rows[0]);
        }

        // Check if this is a linking request (user is logged in)
        if (req.user) {
          // Link Google account to existing user
          const updatedUser = await db.query(
            'UPDATE users SET google_id = $1, google_email = $2 WHERE id = $3 RETURNING *',
            [googleId, googleEmail, req.user.id]
          );
          return done(null, updatedUser.rows[0]);
        }

        // Check if user exists with this email
        if (googleEmail) {
          const existingEmailUser = await db.query(
            'SELECT * FROM users WHERE google_email = $1 OR username = $2',
            [googleEmail, googleEmail]
          );

          if (existingEmailUser.rows.length > 0) {
            // Email exists but not linked - return for manual linking
            return done(null, false, {
              message: 'account_exists',
              email: googleEmail,
              userId: existingEmailUser.rows[0].id
            });
          }
        }

        // Create new user with Google account
        // Generate username from email or use google id
        const username = googleEmail?.split('@')[0] || `google_${googleId.substring(0, 10)}`;

        // Use temporary display name that will be updated later
        const tempDisplayName = `${googleEmail?.split('@')[0] || 'User'}_temp`;

        const newUser = await db.query(
          `INSERT INTO users (username, display_name, google_id, google_email, password_hash, is_admin)
           VALUES ($1, $2, $3, $4, NULL, FALSE)
           RETURNING *`,
          [username, tempDisplayName, googleId, googleEmail]
        );

        // Handle invite code if present in session/state
        const inviteCode = req.session?.inviteCode || req.query?.state;
        if (inviteCode && typeof inviteCode === 'string') {
          try {
            const league = await db.query(
              'SELECT id FROM leagues WHERE invite_code = $1',
              [inviteCode.toUpperCase()]
            );

            if (league.rows.length > 0) {
              await db.query(
                'INSERT INTO user_leagues (user_id, league_id, is_default) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
                [newUser.rows[0].id, league.rows[0].id]
              );
            }
          } catch (error) {
            console.error('Error joining league during OAuth:', error);
            // Don't fail OAuth if league join fails
          }
        }

        return done(null, newUser.rows[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
