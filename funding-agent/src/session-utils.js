export function shouldClearCachedWorkspace(session, cachedUser) {
  return Boolean(cachedUser && session && !session.authenticated);
}
