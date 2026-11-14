export function esUsernameTelegramValido(username: unknown): username is string {
  return typeof username === 'string'
    && username.length >= 5
    && username.length <= 32
    && !/[^A-Za-z0-9_]/.test(username);
}
