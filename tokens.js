import jwt from 'jsonwebtoken';

// Builds the JWT payload from a full user row (as returned by SELECT * FROM users).
export function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, isPremium: !!user.is_premium },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isPremium: !!user.is_premium,
    streakCount: user.streak_count,
  };
}
