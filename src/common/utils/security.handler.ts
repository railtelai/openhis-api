/* eslint-disable @typescript-eslint/no-explicit-any */
import * as jose from 'jose';
import * as fs from 'fs';

const appPublicKeyPem = fs.readFileSync('encryptionkeys/public.pem', 'utf8');
const appPrivateKeyPem = fs.readFileSync('encryptionkeys/private.pem', 'utf8');
const keycloakPublicKeyPem = fs.readFileSync('encryptionkeys/keycloak-public.pem', 'utf8');
const requestPrivateKeyPem = fs.readFileSync('encryptionkeys/request-private.pem', 'utf8');
const responsePublicKeyPem = fs.readFileSync('encryptionkeys/response-public.pem', 'utf8');

export async function decryptRequestBody(encrypted: any): Promise<any> {
  if (!encrypted) {
    throw new Error('Missing token');
  }

  const privateKey = await jose.importPKCS8(requestPrivateKeyPem, 'RSA-OAEP-256');
  const { plaintext } = await jose.compactDecrypt(encrypted as never, privateKey);
  const decoded = new TextDecoder().decode(plaintext);

  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

export async function encryptResponseBody(data: any): Promise<string> {
  return jose.importSPKI(responsePublicKeyPem, 'RSA-OAEP-256').then((pub) => new jose.CompactEncrypt(new TextEncoder().encode(JSON.stringify(data))).setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' }).encrypt(pub));
}

export async function encryptString(payload: any): Promise<string> {
  const publicKey = await jose.importSPKI(appPublicKeyPem, 'RSA-OAEP-256');
  const enc = new TextEncoder().encode(typeof payload === 'string' ? payload : JSON.stringify(payload));
  return await new jose.CompactEncrypt(enc).setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' }).encrypt(publicKey);
}

export async function decryptString(token: string): Promise<any> {
  if (!token) {
    throw new Error('Missing token');
  }
  const privateKey = await jose.importPKCS8(appPrivateKeyPem, 'RSA-OAEP-256');
  const { plaintext } = await jose.compactDecrypt(token as never, privateKey);
  const decoded = new TextDecoder().decode(plaintext);
  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}
export async function decryptKeycloakToken(token: any): Promise<any> {
  if (!token) {
    throw new Error('Missing token');
  }
  const keycloakKey = await jose.importSPKI(keycloakPublicKeyPem, 'RS256');
  const { payload } = await jose.jwtVerify(token as never, keycloakKey);
  return payload;
}
