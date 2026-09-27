import crypto from 'node:crypto';

/** Tiny nanoid stand-in so the backend stays dependency-light. */
export function customAlphabet(alphabet, size) {
  return () => {
    const bytes = crypto.randomBytes(size);
    let out = '';
    for (let i = 0; i < size; i += 1) out += alphabet[bytes[i] % alphabet.length];
    return out;
  };
}
