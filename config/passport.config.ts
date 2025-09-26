
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { User } from '../models/User.model'; 
import { IJwtPayload } from '../middleware/auth.middleware';

// --- Estrategia de Google ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: (error: any, user?: any) => void) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          const payload: IJwtPayload = { id: (user._id as any).toString(), name: user.name };
          return done(null, payload);
        }

        user = await User.findOne({ email: profile.emails?.[0].value });
        if (user) {
          user.googleId = profile.id;
          await user.save();
          const payload: IJwtPayload = { id: (user._id as any).toString(), name: user.name };
          return done(null, payload);
        }
        
        const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0].value,
            avatarUrl: profile.photos?.[0].value,
        });
        await newUser.save();
        const payload: IJwtPayload = { id: (newUser._id as any).toString(), name: newUser.name };
        return done(null, payload);

      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// --- Estrategia de GitHub ---
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: '/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: (error: any, user?: any) => void) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        if (user) {
          const payload: IJwtPayload = { id: (user._id as any).toString(), name: user.name };
          return done(null, payload);
        }

        const userEmail = profile.emails?.[0].value;
        if (userEmail) {
            user = await User.findOne({ email: userEmail });
            if (user) {
                user.githubId = profile.id;
                await user.save();
                const payload: IJwtPayload = { id: (user._id as any).toString(), name: user.name };
                return done(null, payload);
            }
        }

        const newUser = new User({
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: userEmail,
          avatarUrl: profile.photos?.[0].value,
        });
        await newUser.save();
        const payload: IJwtPayload = { id: (newUser._id as any).toString(), name: newUser.name };
        return done(null, payload);

      } catch (error) {
        return done(error as any, false);
      }
    }
  )
);