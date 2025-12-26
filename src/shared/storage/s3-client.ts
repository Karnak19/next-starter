import {
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3-compatible storage client for MinIO
const s3Client = new S3Client({
	endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
	region: process.env.S3_REGION || "us-east-1", // MinIO doesn't care about region, but SDK requires it
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
	},
	forcePathStyle: true, // Required for MinIO
});

const defaultBucket = process.env.S3_BUCKET || "uploads";

// Helper functions for common storage operations
export const storage = {
	/**
	 * Upload a file to S3/MinIO
	 * @param bucket - The bucket name (optional, uses default if not provided)
	 * @param key - The file path/key
	 * @param file - The file to upload (File, Blob, or Buffer)
	 * @param options - Additional upload options
	 */
	async uploadFile(
		bucketOrKey: string,
		keyOrFile?: string | File | Blob | Buffer,
		fileOrOptions?: File | Blob | Buffer | { contentType?: string },
		options?: { contentType?: string },
	) {
		// Handle overloaded parameters
		let bucket: string;
		let key: string;
		let file: File | Blob | Buffer;
		let contentType: string | undefined;

		if (keyOrFile === undefined) {
			// Single param: uploadFile(key)
			throw new Error("File is required");
		}

		if (typeof keyOrFile === "string") {
			// Three params: uploadFile(bucket, key, file, options?)
			bucket = bucketOrKey;
			key = keyOrFile;
			file = fileOrOptions as File | Blob | Buffer;
			contentType = options?.contentType;
		} else {
			// Two params: uploadFile(key, file)
			bucket = defaultBucket;
			key = bucketOrKey;
			file = keyOrFile;
			contentType =
				typeof fileOrOptions === "object" && "contentType" in fileOrOptions
					? fileOrOptions.contentType
					: undefined;
		}

		// Convert File/Blob to Buffer for Node.js environments
		const body =
			file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

		const command = new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: contentType || (file instanceof File ? file.type : undefined),
		});

		const result = await s3Client.send(command);
		return {
			key,
			bucket,
			etag: result.ETag,
		};
	},

	/**
	 * Get a public URL for a file
	 * Note: In MinIO, bucket must be public for this to work
	 * @param bucket - The bucket name (optional)
	 * @param key - The file key
	 */
	getPublicUrl(bucketOrKey: string, key?: string) {
		const bucket = key ? bucketOrKey : defaultBucket;
		const actualKey = key || bucketOrKey;
		const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
		return `${endpoint}/${bucket}/${actualKey}`;
	},

	/**
	 * Create a signed URL for private file access
	 * @param bucket - The bucket name (optional)
	 * @param key - The file key
	 * @param expiresIn - Expiration time in seconds (default: 3600)
	 */
	async createSignedUrl(
		bucketOrKey: string,
		keyOrExpires?: string | number,
		expiresIn = 3600,
	) {
		const bucket =
			typeof keyOrExpires === "string" ? bucketOrKey : defaultBucket;
		const key =
			typeof keyOrExpires === "string" ? keyOrExpires : bucketOrKey;
		const expires =
			typeof keyOrExpires === "number" ? keyOrExpires : expiresIn;

		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

		const signedUrl = await getSignedUrl(s3Client, command, {
			expiresIn: expires,
		});

		return { signedUrl };
	},

	/**
	 * Delete a file from storage
	 * @param bucket - The bucket name (optional)
	 * @param keys - Single key or array of keys to delete
	 */
	async deleteFile(
		bucketOrKeys: string,
		keys?: string | string[],
	): Promise<void> {
		const bucket = keys ? bucketOrKeys : defaultBucket;
		const actualKeys = keys || bucketOrKeys;
		const keysArray = Array.isArray(actualKeys) ? actualKeys : [actualKeys];

		await Promise.all(
			keysArray.map((key) =>
				s3Client.send(
					new DeleteObjectCommand({
						Bucket: bucket,
						Key: key,
					}),
				),
			),
		);
	},

	/**
	 * List files in a bucket
	 * @param bucket - The bucket name (optional)
	 * @param prefix - The prefix/folder path (optional)
	 * @param options - Additional list options
	 */
	async listFiles(
		bucketOrPrefix?: string,
		prefixOrOptions?:
			| string
			| { maxKeys?: number; continuationToken?: string },
		options?: { maxKeys?: number; continuationToken?: string },
	) {
		let bucket: string;
		let prefix: string | undefined;
		let maxKeys: number | undefined;
		let continuationToken: string | undefined;

		if (!bucketOrPrefix) {
			bucket = defaultBucket;
		} else if (typeof prefixOrOptions === "string") {
			// listFiles(bucket, prefix, options)
			bucket = bucketOrPrefix;
			prefix = prefixOrOptions;
			maxKeys = options?.maxKeys;
			continuationToken = options?.continuationToken;
		} else if (typeof prefixOrOptions === "object") {
			// listFiles(bucket, options)
			bucket = bucketOrPrefix;
			maxKeys = prefixOrOptions?.maxKeys;
			continuationToken = prefixOrOptions?.continuationToken;
		} else {
			// listFiles(prefix)
			bucket = defaultBucket;
			prefix = bucketOrPrefix;
		}

		const command = new ListObjectsV2Command({
			Bucket: bucket,
			Prefix: prefix,
			MaxKeys: maxKeys,
			ContinuationToken: continuationToken,
		});

		const result = await s3Client.send(command);
		return {
			files: result.Contents || [],
			nextToken: result.NextContinuationToken,
			isTruncated: result.IsTruncated,
		};
	},

	/**
	 * Download a file from storage
	 * @param bucket - The bucket name (optional)
	 * @param key - The file key
	 */
	async downloadFile(bucketOrKey: string, key?: string) {
		const bucket = key ? bucketOrKey : defaultBucket;
		const actualKey = key || bucketOrKey;

		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: actualKey,
		});

		const result = await s3Client.send(command);

		// Convert stream to blob
		if (!result.Body) {
			throw new Error("No body in response");
		}

		const chunks: Uint8Array[] = [];
		for await (const chunk of result.Body as any) {
			chunks.push(chunk);
		}

		return new Blob(chunks, {
			type: result.ContentType,
		});
	},
};

export { s3Client };
