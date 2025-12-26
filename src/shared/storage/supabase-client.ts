import { createClient } from "@supabase/supabase-js";

// Supabase client for storage operations
// Uses self-hosted Supabase (Postgres + Storage via Kong gateway)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:8000";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common storage operations
export const storage = {
  /**
   * Upload a file to Supabase storage
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @param file - The file to upload
   * @param options - Additional upload options
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: {
      cacheControl?: string;
      upsert?: boolean;
      contentType?: string;
    }
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || "3600",
        upsert: options?.upsert,
        contentType: options?.contentType,
      });

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Get a public URL for a file
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   */
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Create a signed URL for private file access
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   * @param expiresIn - Expiration time in seconds (default: 60)
   */
  async createSignedUrl(bucket: string, path: string, expiresIn = 60) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Delete a file from storage
   * @param bucket - The bucket name
   * @param paths - Single path or array of paths to delete
   */
  async deleteFile(bucket: string, paths: string | string[]) {
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(pathsArray);

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * List files in a bucket
   * @param bucket - The bucket name
   * @param path - The folder path (optional)
   * @param options - Additional list options
   */
  async listFiles(
    bucket: string,
    path?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: "asc" | "desc" };
    }
  ) {
    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy,
    });

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Download a file from storage
   * @param bucket - The bucket name
   * @param path - The file path within the bucket
   */
  async downloadFile(bucket: string, path: string) {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      throw error;
    }
    return data;
  },
};
