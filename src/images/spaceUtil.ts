import { S3 } from '@aws-sdk/client-s3';

export const createS3Client = () => {
  const spacesKey = process.env.SPACES_KEY;
  const spacesSecret = process.env.SPACES_SECRET;

  if (!spacesKey) {
    throw new Error('SPACES_KEY is not defined');
  }
  if (!spacesSecret) {
    throw new Error('SPACES_SECRET is not defined');
  }

  return new S3({
    forcePathStyle: false, // Configures to use subdomain/virtual calling format.
    endpoint: 'https://sgp1.digitaloceanspaces.com',
    region: 'sgp1',
    credentials: {
      accessKeyId: spacesKey,
      secretAccessKey: spacesSecret,
    },
  });
};
