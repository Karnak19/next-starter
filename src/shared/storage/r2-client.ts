import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 / S3-compatible storage client
 * For direct file storage without PocketBase
 */
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const bucket = process.env.R2_BUCKET_NAME ?? "";

export const r2 = {
  /**
   * Upload a file directly to R2
   * @param key - The file path/key
   * @param file - The file buffer or Body
   * @param contentType - MIME type
   */
  upload(key: string, file: Buffer | Blob | Uint8Array, contentType?: string) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    return r2Client.send(command);
  },

  /**
   * Get a presigned URL for uploading (client-side upload)
   * @param key - The file path/key
   * @param contentType - MIME type
   * @param expiresIn - URL expiration in seconds (default: 300)
   */
  getUploadUrl(key: string, contentType?: string, expiresIn = 300) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
  },

  /**
   * Get a presigned URL for downloading
   * @param key - The file path/key
   * @param expiresIn - URL expiration in seconds (default: 3600)
   */
  getDownloadUrl(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
  },

  /**
   * Delete a file from R2
   * @param key - The file path/key
   */
  delete(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return r2Client.send(command);
  },

  /**
   * List files in a prefix
   * @param prefix - The folder prefix (optional)
   * @param maxKeys - Maximum number of keys to return (default: 1000)
   */
  list(prefix?: string, maxKeys = 1000) {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    return r2Client.send(command).then((res) => res.Contents ?? []);
  },

  /**
   * Get the public URL for a file (if bucket is public)
   * @param key - The file path/key
   */
  getPublicUrl(key: string) {
    const endpoint = process.env.R2_PUBLIC_URL ?? process.env.R2_ENDPOINT;
    return `${endpoint}/${bucket}/${key}`;
  },
};
