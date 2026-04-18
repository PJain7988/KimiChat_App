const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { Strategy: DiscordStrategy } = require('passport-discord');
const User = require('../models/User');
const Chat = require('../models/Chat');


async function findOrCreateUser({ provider, providerId, name, email, avatar }) {
  try {
    // Validate required fields
    if (!provider || !providerId) {
      throw new Error('Provider and providerId are required');
    }

    const idField = `${provider}Id`; // 'googleId' | 'githubId' | 'discordId'

    // 1. Check if user already linked with this provider
    let user = await User.findOne({ [idField]: providerId });
    if (user) {
      console.log(`✅ Found existing user linked to ${provider}: ${user.email}`);
      return user;
    }

    // 2. Check if email exists but not linked to provider
    if (email) {
      const emailLower = email.toLowerCase();
      user = await User.findOne({ email: emailLower });

      if (user) {
        console.log(`✅ Found existing user by email, linking ${provider}: ${email}`);
        user[idField] = providerId;
        
        // Update avatar if user doesn't have one
        if (avatar && !user.avatar) {
          user.avatar = avatar;
        }
        
        await user.save();
        return user;
      }
    }

    // 3. Create completely new user
    console.log(`✅ Creating new user from ${provider}: ${email || providerId}`);

    // Generate unique username
    const base = (name || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 14);
    
    const randomSuffix = Date.now().toString(36).slice(-4);
    const username = `${base}_${randomSuffix}`;

    // Ensure unique username
    let existingUser = await User.findOne({ username });
    let finalUsername = username;
    let counter = 0;
    
    while (existingUser && counter < 5) {
      counter++;
      finalUsername = `${base}_${randomSuffix}_${counter}`;
      existingUser = await User.findOne({ username: finalUsername });
    }

    // Create user with password (for OAuth users, use provider ID)
    user = await User.create({
      name: name || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      email: email ? email.toLowerCase() : `${providerId}@${provider}.kimichat.app`,
      username: finalUsername,
      password: `oauth_${providerId}`, // Temporary password for OAuth users
      avatar: avatar || '',
      [idField]: providerId,
      isOnline: true,
      emailVerified: !!email, // Verify email from OAuth provider
    });

    console.log(`✅ New user created: ${user.email} (${user.username})`);

    // Create personal Kimi AI chat for new user
    try {
      await Chat.create({
        name: 'Kimi AI',
        isAI: true,
        participants: [user._id],
        description: 'Your personal AI assistant',
      });
      console.log(`✅ Kimi AI chat created for user: ${user._id}`);
    } catch (chatErr) {
      console.error(`⚠️  Failed to create Kimi AI chat: ${chatErr.message}`);
      // Don't throw - user is created, just chat creation failed
    }

    return user;
  } catch (err) {
    console.error(`❌ Error in findOrCreateUser: ${err.message}`);
    throw err;
  }
}

/* ═══════════════════════════════════════════════════════
   GOOGLE OAUTH 2.0 STRATEGY
   
   Setup:
   - Console: https://console.cloud.google.com
   - Create OAuth 2.0 Client ID (Web application)
   - Authorized redirect URIs:
     * http://localhost:5000/api/auth/google/callback (dev)
     * https://yourdomain.com/api/auth/google/callback (prod)
═══════════════════════════════════════════════════════ */

passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extract profile data
        const email = profile.emails?.[0]?.value || null;
        const avatar = profile.photos?.[0]?.value || null;
        const name = profile.displayName || profile.given_name || 'Google User';

        console.log(`🔐 Google OAuth Profile:`, {
          id: profile.id,
          email,
          name,
        });

        // Validate essential data
        if (!profile.id) {
          throw new Error('Google profile ID is missing');
        }

        // Find or create user
        const user = await findOrCreateUser({
          provider: 'google',
          providerId: profile.id,
          name,
          email,
          avatar,
        });

        return done(null, user);
      } catch (err) {
        console.error(`❌ Google OAuth Error: ${err.message}`);
        return done(err, null);
      }
    }
  )
);

/* ═══════════════════════════════════════════════════════
   GITHUB OAUTH 2.0 STRATEGY
   
   Setup:
   - Dashboard: https://github.com/settings/developers
   - Create New OAuth App
   - Authorization callback URL:
     * http://localhost:5000/api/auth/github/callback (dev)
     * https://yourdomain.com/api/auth/github/callback (prod)
═══════════════════════════════════════════════════════ */

passport.use(
  'github',
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/github/callback`,
      scope: ['user:email', 'read:user'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // GitHub may hide email by default
        let email = profile.emails?.[0]?.value || null;

        // Fallback: try to get primary verified email from _json
        if (!email && Array.isArray(profile._json?.emails)) {
          const primaryEmail = profile._json.emails.find(
            (e) => e.primary && e.verified
          );
          if (primaryEmail) {
            email = primaryEmail.email;
          }
        }

        // If still no email, use first available
        if (!email && Array.isArray(profile._json?.emails)) {
          email = profile._json.emails[0]?.email || null;
        }

        // Get avatar
        const avatar =
          profile.photos?.[0]?.value || profile._json?.avatar_url || null;

        // Get name
        const name =
          profile.displayName ||
          profile._json?.name ||
          profile.username ||
          'GitHub User';

        console.log(`🔐 GitHub OAuth Profile:`, {
          id: profile.id,
          username: profile.username,
          email,
          name,
        });

        // Validate essential data
        if (!profile.id) {
          throw new Error('GitHub profile ID is missing');
        }

        // Find or create user
        const user = await findOrCreateUser({
          provider: 'github',
          providerId: String(profile.id),
          name,
          email,
          avatar,
        });

        return done(null, user);
      } catch (err) {
        console.error(`❌ GitHub OAuth Error: ${err.message}`);
        return done(err, null);
      }
    }
  )
);

/* ═══════════════════════════════════════════════════════
   DISCORD OAUTH 2.0 STRATEGY
   
   Setup:
   - Dev Portal: https://discord.com/developers/applications
   - Create New Application
   - OAuth2 → Redirects → Add:
     * http://localhost:5000/api/auth/discord/callback (dev)
     * https://yourdomain.com/api/auth/discord/callback (prod)
═══════════════════════════════════════════════════════ */

passport.use(
  'discord',
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/discord/callback`,
      scope: ['identify', 'email'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extract profile data
        const email = profile.email || null;
        const avatar = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : null;
        const name = profile.global_name || profile.username || 'Discord User';

        console.log(`🔐 Discord OAuth Profile:`, {
          id: profile.id,
          username: profile.username,
          email,
          name,
        });

        // Validate essential data
        if (!profile.id) {
          throw new Error('Discord profile ID is missing');
        }

        // Find or create user
        const user = await findOrCreateUser({
          provider: 'discord',
          providerId: profile.id,
          name,
          email,
          avatar,
        });

        return done(null, user);
      } catch (err) {
        console.error(`❌ Discord OAuth Error: ${err.message}`);
        return done(err, null);
      }
    }
  )
);

/* ═══════════════════════════════════════════════════════
   PASSPORT SERIALIZATION
   
   Required for session-based authentication.
   Even if using JWT, Passport needs these for OAuth flow.
═══════════════════════════════════════════════════════ */

// Serialize user to session
passport.serializeUser((user, done) => {
  try {
    if (!user || !user._id) {
      return done(new Error('User or user._id is missing'));
    }
    done(null, user._id.toString());
  } catch (err) {
    console.error('❌ Serialize User Error:', err);
    done(err, null);
  }
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    if (!id) {
      return done(new Error('User ID is missing'));
    }

    const user = await User.findById(id).lean(); // Use .lean() for performance

    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (err) {
    console.error('❌ Deserialize User Error:', err);
    done(err, null);
  }
});

module.exports = passport;