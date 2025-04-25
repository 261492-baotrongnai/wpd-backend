import axios from 'axios';
import * as crypto from 'crypto';

interface VerifyResponse {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
}

/**
 * Retrieves an internal ID by verifying an ID token with the LINE API and generating
 * a one-way HMAC hash of the `sub` field from the response.
 *
 * @param idToken - The ID token to be verified with the LINE API.
 * @param clientId - The client ID associated with the LINE API.
 * @param secretKey - The secret key used to generate the HMAC hash.
 * @returns A promise that resolves to either:
 *          - A string representing the derived internal ID, or
 *          - An object containing a status code and an error message if verification fails.
 *
 * @example
 * ```typescript
 * const internalId = await getInternalId(idToken, clientId, secretKey);
 * if (typeof internalId === 'string') {
 *   console.log('Derived internal ID:', internalId);
 * } else {
 *   console.error('Error:', internalId.message);
 * }
 * ```
 */
export const getInternalId = async (
  idToken?: string,
  userId?: string,
): Promise<string | { statusCode: number; message: string }> => {
  try {
    const clientId: string = process.env.LINE_CLIENT_ID || '';
    const secretKey: string = process.env.INTERNAL_ID_SECRET || '';
    // Verify the token with LINE API
    let uid = userId;
    if (!uid) {
      console.log('no userId, verifying ID token');
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

      uid = sub;

      if (!uid) {
        throw new Error('User ID is missing in the response');
      }
    }
    // Create a one-way HMAC hash of the LINE sub
    const derivedId = crypto
      .createHmac('sha256', secretKey)
      .update(uid)
      .digest('hex');

    return derivedId;
  } catch (error) {
    return {
      statusCode: 500,
      message:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
};
