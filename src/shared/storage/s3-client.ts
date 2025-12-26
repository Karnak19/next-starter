// Bun's built-in S3 client configuration
const s3Config = {
	endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
	accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
	region: process.env.S3_REGION || "us-east-1",
};

const defaultBucket = process.env.S3_BUCKET || "uploads";

/**
 * Create a presigned URL for S3 operations
 */
async function createPresignedUrl(
	method: string,
	bucket: string,
	key: string,
	expiresIn = 3600,
): Promise<string> {
	const url = new URL(`${s3Config.endpoint}/${bucket}/${key}`);
	const date = new Date();
	const timestamp = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
	const dateStamp = timestamp.slice(0, 8);

	// AWS Signature Version 4
	const credential = `${s3Config.accessKeyId}/${dateStamp}/${s3Config.region}/s3/aws4_request`;

	url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
	url.searchParams.set("X-Amz-Credential", credential);
	url.searchParams.set("X-Amz-Date", timestamp);
	url.searchParams.set("X-Amz-Expires", expiresIn.toString());
	url.searchParams.set("X-Amz-SignedHeaders", "host");

	// Create signature
	const canonicalRequest = `${method}\n/${bucket}/${key}\n${url.searchParams.toString()}\nhost:${url.host}\n\nhost\nUNSIGNED-PAYLOAD`;

	const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${dateStamp}/${s3Config.region}/s3/aws4_request\n${await hash(canonicalRequest)}`;

	const signingKey = await getSignatureKey(
		s3Config.secretAccessKey,
		dateStamp,
		s3Config.region,
		"s3",
	);
	const signature = await hmac(signingKey, stringToSign);

	url.searchParams.set("X-Amz-Signature", signature);
	return url.toString();
}

async function hash(data: string): Promise<string> {
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(data);
	return hasher.digest("hex");
}

async function hmac(key: ArrayBuffer | string, data: string): Promise<string> {
	const keyBuffer =
		typeof key === "string" ? new TextEncoder().encode(key) : key;
	const dataBuffer = new TextEncoder().encode(data);

	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBuffer,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function getSignatureKey(
	key: string,
	dateStamp: string,
	regionName: string,
	serviceName: string,
): Promise<ArrayBuffer> {
	const kDate = await hmacBuffer(`AWS4${key}`, dateStamp);
	const kRegion = await hmacBuffer(kDate, regionName);
	const kService = await hmacBuffer(kRegion, serviceName);
	const kSigning = await hmacBuffer(kService, "aws4_request");
	return kSigning;
}

async function hmacBuffer(
	key: ArrayBuffer | string,
	data: string,
): Promise<ArrayBuffer> {
	const keyBuffer =
		typeof key === "string" ? new TextEncoder().encode(key) : key;
	const dataBuffer = new TextEncoder().encode(data);

	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyBuffer,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	return await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
}

// Helper functions for common storage operations
export const storage = {
	/**
	 * Upload a file to S3/MinIO
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
			throw new Error("File is required");
		}

		if (typeof keyOrFile === "string") {
			bucket = bucketOrKey;
			key = keyOrFile;
			file = fileOrOptions as File | Blob | Buffer;
			contentType = options?.contentType;
		} else {
			bucket = defaultBucket;
			key = bucketOrKey;
			file = keyOrFile;
			contentType =
				typeof fileOrOptions === "object" && "contentType" in fileOrOptions
					? fileOrOptions.contentType
					: undefined;
		}

		const url = `${s3Config.endpoint}/${bucket}/${key}`;
		const body =
			file instanceof Blob ? await file.arrayBuffer() : Buffer.from(file);

		const response = await fetch(url, {
			method: "PUT",
			headers: {
				"Content-Type":
					contentType || (file instanceof File ? file.type : "application/octet-stream"),
				"x-amz-acl": "public-read",
			},
			body,
		});

		if (!response.ok) {
			throw new Error(`Upload failed: ${response.statusText}`);
		}

		return {
			key,
			bucket,
			etag: response.headers.get("etag"),
		};
	},

	/**
	 * Get a public URL for a file
	 */
	getPublicUrl(bucketOrKey: string, key?: string) {
		const bucket = key ? bucketOrKey : defaultBucket;
		const actualKey = key || bucketOrKey;
		return `${s3Config.endpoint}/${bucket}/${actualKey}`;
	},

	/**
	 * Create a signed URL for private file access
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

		const signedUrl = await createPresignedUrl("GET", bucket, key, expires);
		return { signedUrl };
	},

	/**
	 * Delete a file from storage
	 */
	async deleteFile(
		bucketOrKeys: string,
		keys?: string | string[],
	): Promise<void> {
		const bucket = keys ? bucketOrKeys : defaultBucket;
		const actualKeys = keys || bucketOrKeys;
		const keysArray = Array.isArray(actualKeys) ? actualKeys : [actualKeys];

		await Promise.all(
			keysArray.map(async (key) => {
				const url = `${s3Config.endpoint}/${bucket}/${key}`;
				const response = await fetch(url, { method: "DELETE" });

				if (!response.ok && response.status !== 404) {
					throw new Error(`Delete failed: ${response.statusText}`);
				}
			}),
		);
	},

	/**
	 * List files in a bucket
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
			bucket = bucketOrPrefix;
			prefix = prefixOrOptions;
			maxKeys = options?.maxKeys;
			continuationToken = options?.continuationToken;
		} else if (typeof prefixOrOptions === "object") {
			bucket = bucketOrPrefix;
			maxKeys = prefixOrOptions?.maxKeys;
			continuationToken = prefixOrOptions?.continuationToken;
		} else {
			bucket = defaultBucket;
			prefix = bucketOrPrefix;
		}

		const url = new URL(`${s3Config.endpoint}/${bucket}/`);
		url.searchParams.set("list-type", "2");
		if (prefix) url.searchParams.set("prefix", prefix);
		if (maxKeys) url.searchParams.set("max-keys", maxKeys.toString());
		if (continuationToken)
			url.searchParams.set("continuation-token", continuationToken);

		const response = await fetch(url.toString());

		if (!response.ok) {
			throw new Error(`List failed: ${response.statusText}`);
		}

		const text = await response.text();
		const parser = new DOMParser();
		const xml = parser.parseFromString(text, "text/xml");

		const files = Array.from(xml.querySelectorAll("Contents")).map(
			(content) => ({
				Key: content.querySelector("Key")?.textContent || "",
				LastModified: content.querySelector("LastModified")?.textContent || "",
				Size: Number.parseInt(
					content.querySelector("Size")?.textContent || "0",
					10,
				),
				ETag: content.querySelector("ETag")?.textContent || "",
			}),
		);

		const nextToken =
			xml.querySelector("NextContinuationToken")?.textContent || undefined;
		const isTruncated =
			xml.querySelector("IsTruncated")?.textContent === "true";

		return {
			files,
			nextToken,
			isTruncated,
		};
	},

	/**
	 * Download a file from storage
	 */
	async downloadFile(bucketOrKey: string, key?: string) {
		const bucket = key ? bucketOrKey : defaultBucket;
		const actualKey = key || bucketOrKey;
		const url = `${s3Config.endpoint}/${bucket}/${actualKey}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Download failed: ${response.statusText}`);
		}

		return await response.blob();
	},
};

export { s3Config };
