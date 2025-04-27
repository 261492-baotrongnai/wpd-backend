import axios from 'axios';
import * as crypto from 'crypto';

interface VerifyResponse {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
}

export const verifyIdToken = async (idToken: string) => {
  const clientId: string = process.env.LINE_CLIENT_ID || '';
  if (!clientId) {
    throw new Error('LINE_CLIENT_ID environment variable is not set');
  }
  try {
    const response = await axios.post<VerifyResponse>(
      'https://api.line.me/oauth2/v2.1/verify',
      new URLSearchParams(
        idToken && clientId ? { id_token: idToken, client_id: clientId } : {},
      ).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    const { sub } = response.data;
    if (!sub) {
      throw new Error('User ID is missing in the response');
    }
    return sub;
  } catch (error) {
    console.error('Error verifying LINE ID token:', error);
    throw new Error(
      error instanceof Error ? error.message : 'An unknown error occurred',
    );
  }
};

export const getInternalId = async (idToken?: string, userId?: string) => {
  const secretKey: string = process.env.INTERNAL_ID_SECRET || '';
  // Verify the token with LINE API
  let uid = userId;
  if (!uid) {
    if (!idToken) {
      throw new Error('idToken is required but was not provided');
    }

    // Verify the ID token and get the LINE user ID
    uid = await verifyIdToken(idToken);
  }
  // Create a one-way HMAC hash of the LINE sub
  const derivedId = crypto
    .createHmac('sha256', secretKey)
    .update(uid)
    .digest('hex');

  return derivedId;
};
