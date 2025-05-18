export interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  username: string;
  attributes: Record<string, unknown>;
}

export interface Session {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
}

export interface SignInResult extends AuthResult<User> {
  user?: User;
}

export interface SignUpResult extends AuthResult {
  userSub?: string;
  userConfirmed?: boolean;
}

export interface CurrentUserResult extends AuthResult<User> {
  user?: User;
  idToken?: string;
  accessToken?: string;
}

export interface ConfirmSignUpResult extends AuthResult {
  confirmed?: boolean;
}

export interface ForgotPasswordResult extends AuthResult {
  codeDeliveryDetails?: unknown;
}

export interface ForgotPasswordSubmitResult extends AuthResult {
  confirmed?: boolean;
}
