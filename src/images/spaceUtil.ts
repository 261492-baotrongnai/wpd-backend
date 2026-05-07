import { S3 } from '@aws-sdk/client-s3';

export const createS3Client = () => {
  const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const minioAccessKey = process.env.MINIO_ACCESS_KEY;
  const minioSecretKey = process.env.MINIO_SECRET_KEY;

  if (!minioAccessKey) throw new Error('MINIO_ACCESS_KEY is not defined');
  if (!minioSecretKey) throw new Error('MINIO_SECRET_KEY is not defined');

  return new S3({
    forcePathStyle: true,
    endpoint: minioEndpoint,
    region: 'us-east-1', // ← Arbitrary but required by the SDK; MinIO ignores it
    credentials: {
      accessKeyId: minioAccessKey,
      secretAccessKey: minioSecretKey,
    },
  });
};
