const DEFAULT_AUTH_REDIRECT = '/log'

export function sanitizeAuthRedirectPath(next: string | null | undefined) {
  if (!next || !next.startsWith('/')) {
    return DEFAULT_AUTH_REDIRECT
  }

  if (next.startsWith('//')) {
    return DEFAULT_AUTH_REDIRECT
  }

  if (next.startsWith('/login') || next.startsWith('/signup')) {
    return DEFAULT_AUTH_REDIRECT
  }

  return next
}

