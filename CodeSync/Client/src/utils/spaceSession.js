const sessionKey = (spaceId) => `codesync-session-${spaceId}`;

export function saveSpaceSession(spaceId, { name, email }) {
  if (!spaceId || !name) return;
  sessionStorage.setItem(
    sessionKey(spaceId),
    JSON.stringify({ name, email: email ?? null })
  );
}

export function getSpaceSession(spaceId) {
  try {
    const raw = sessionStorage.getItem(sessionKey(spaceId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSpaceSession(spaceId) {
  sessionStorage.removeItem(sessionKey(spaceId));
}
