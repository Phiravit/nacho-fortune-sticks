// localStorage can throw (private mode, blocked site data); every caller
// must still work when it does.

export function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preference just won't be remembered.
  }
}
