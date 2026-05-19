export interface AuthUser {
  id: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface RegisterResult {
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
}

export interface LoginResult extends TokenPair {
  user: AuthUser;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
}

// Augment Express Request so handlers can access req.user after authenticate middleware
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
