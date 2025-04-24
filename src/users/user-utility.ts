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
  idToken: string,
  clientId: string,
  secretKey: string,
  userId?: string,
): Promise<string | { status: number; message: string }> => {
  try {
    // Verify the token with LINE API
    let uid = userId;
    if (!uid) {
      const response = await axios.post<VerifyResponse>(
        'https://api.line.me/oauth2/v2.1/verify',
        new URLSearchParams({
          id_token: idToken,
          client_id: clientId,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { sub } = response.data;

      uid = sub;

      if (!uid) {
        console.error(
          'Error: `sub` field is missing in the response:',
          response.data,
        );
        return {
          status: 400,
          message: 'Please login again',
        };
      }
    }
    // Create a one-way HMAC hash of the LINE sub
    const derivedId = crypto
      .createHmac('sha256', secretKey)
      .update(uid)
      .digest('hex');

    return derivedId;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return {
      status: 400,
      message: 'Please login again',
    };
  }
};
