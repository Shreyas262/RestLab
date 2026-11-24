// RFC 9110 §5.6.2: a field name is a token of one or more tchar.
const TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
// Fetch rejects values containing CR, LF, or NUL.
const INVALID_VALUE_CHAR = /[\r\n\0]/;

export function isValidHeaderName(name: string): boolean {
  return TOKEN.test(name);
}

export function isValidHeaderValue(value: string): boolean {
  return !INVALID_VALUE_CHAR.test(value);
}
