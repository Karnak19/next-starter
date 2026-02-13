import type { RecordModel } from "pocketbase";
import { pbServer } from "@/shared/db/server";

/**
 * Storage helpers using PocketBase file storage
 * Files are stored in PocketBase collections with file fields
 */
export const storage = {
  /**
   * Upload a file to a PocketBase collection
   * @param collection - The collection name
   * @param recordId - The record ID (use "new" to create a new record)
   * @param fileField - The file field name in the collection
   * @param file - The file to upload
   */
  uploadFile(
    collection: string,
    recordId: string,
    fileField: string,
    file: File
  ) {
    const formData = new FormData();
    formData.append(fileField, file);

    if (recordId === "new") {
      return pbServer.collection(collection).create(formData);
    }
    return pbServer.collection(collection).update(recordId, formData);
  },

  /**
   * Get the public URL for a file
   * @param collection - The collection name
   * @param recordId - The record ID
   * @param fileField - The file field name
   * @param filename - The filename
   */
  getFileUrl(
    collection: string,
    recordId: string,
    fileField: string,
    filename: string
  ) {
    return pbServer.files.getUrl(
      { id: recordId, collectionName: collection } as RecordModel,
      `${fileField}/${filename}`
    );
  },

  /**
   * Get a private file URL (requires authentication)
   * @param collection - The collection name
   * @param recordId - The record ID
   * @param fileField - The file field name
   * @param filename - The filename
   */
  getPrivateFileUrl(
    collection: string,
    recordId: string,
    fileField: string,
    filename: string,
    options?: { token?: string; thumb?: string }
  ) {
    return pbServer.files.getUrl(
      { id: recordId, collectionName: collection } as RecordModel,
      `${fileField}/${filename}`,
      options
    );
  },

  /**
   * Delete a file by clearing the file field
   * @param collection - The collection name
   * @param recordId - The record ID
   * @param fileField - The file field name
   */
  deleteFile(collection: string, recordId: string, fileField: string) {
    return pbServer.collection(collection).update(recordId, {
      [fileField]: null,
    });
  },
};

export { r2 } from "./r2-client";
