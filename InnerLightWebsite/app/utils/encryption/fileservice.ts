import { EncryptedMessage, EncryptionManager } from "./client";
import { Buffer } from "buffer";

export interface FileMetadata {
    fileName: string;
    fileType: string;
    fileSize: number;
    encyptedUrl?: string;
    thumbnailUrl?: string;
    iv?: string;
    key?: string;
}

export interface EncryptedFile {
    encryptedBlob: Blob;
    metadata: FileMetadata;
}

interface EncryptionParams {
    iv: string;
}

export class FileService {
    constructor(private encryptionManager: EncryptionManager) {}

    /**
     * Encrypts a given file and returns an object containing the encrypted file blob and its metadata.
     * The file is read as an array buffer, converted to a base64 string, and then encrypted using
     * AES-GCM. A thumbnail is generated if the file is an image.
     *
     * @param {File} file - The file to encrypt.
     * @returns {Promise<EncryptedFile>} A promise that resolves with the encrypted file object, which
     * includes the encrypted Blob and file metadata such as fileName, fileType, fileSize, and optional
     * thumbnailUrl for image files.
     *
     * @throws {Error} If the file encryption fails.
     */

    async encryptFile(
        file: File,
        encryptionParams: EncryptionParams,
    ): Promise<EncryptedFile> {
        try {
            //Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();
            const fileData = new Uint8Array(arrayBuffer);

            //Convert file data to base64 string for encryption
            const base64Data = Buffer.from(fileData).toString("base64");

            // Encrypt the base64 string
            const encryptedData =
                await this.encryptionManager.encrypt(base64Data);

            // Create encrypted blob
            const encryptedBlob = new Blob(
                [
                    JSON.stringify({
                        iv: encryptionParams.iv,
                        content: encryptedData.content,
                    }),
                ],
                { type: "application/encrypted" },
            );

            // Gennerate thumbnail for images if needed
            let thumbnailUrl: string | undefined;
            if (file.type.startsWith("image/")) {
                thumbnailUrl = await this.generateThubnail(file);
            }

            const metadata: FileMetadata = {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                thumbnailUrl,
            };

            return {
                encryptedBlob,
                metadata,
            };
        } catch (error) {
            console.error(error);
            throw new Error("Failed to encrypt file!");
        }
    }

    /**
     * Decrypts an encrypted file Blob and returns the decrypted file Blob.
     * The encrypted Blob is read as text, parsed into an EncryptedMessage object,
     * and decrypted using the EncryptionManager. The decrypted base64 string is
     * then converted back to binary data and returned as a Blob of the specified file type.
     *
     * @param {Blob} encryptedBlob - The encrypted file Blob to decrypt.
     * @param {string} fileType - The MIME type of the decrypted file.
     * @returns {Promise<Blob>} - A promise that resolves with the decrypted file Blob.
     * @throws {Error} - If the decryption process fails.
     */

    async decryptFile(
        encryptedBlob: Blob,
        fileType: string,
        encryptedData: EncryptedMessage,
    ): Promise<Blob> {
        try {
            // Decrypt the content
            const decryptedBase64 =
                await this.encryptionManager.decrypt(encryptedData);

            // Convert base64 back to binary data
            const binaryData = Buffer.from(decryptedBase64, "base64");

            // Create blob from binary data
            return new Blob([binaryData], { type: fileType });
        } catch (error) {
            console.error("Error decrypting file:", error);
            throw new Error("Failed to decrypt file!");
        }
    }

    /**
     * Generates a thumbnail of a given file.
     * The file is read by a FileReader, and the resulting data URL is used to create an image.
     * The image is then resized to a maximum size of 200x200 (maintaining aspect ratio) and drawn onto a canvas.
     * The canvas is then converted into a data URL, which is returned as a promise.
     * @param {File} file - The file to generate a thumbnail for.
     * @returns {Promise<string>} - A promise that resolves with the thumbnail as a data URL.
     */
    private async generateThubnail(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    if (ctx) {
                        //Calculate thumbnail size
                        const maxSize = 200;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > maxSize) {
                                height *= maxSize / width;
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width *= maxSize / height;
                                height = maxSize;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        // Draw thumbnail
                        ctx.drawImage(img, 0, 0, width, height);

                        // Get thumbnail as data URL
                        resolve(canvas.toDataURL("image/jpeg", 0.7));
                    }
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async createPreviewUrl(
        encryptedBlob: Blob,
        fileType: string,
        encryptedData: EncryptedMessage,
    ): Promise<string> {
        try {
            const decryptedBlob = await this.decryptFile(
                encryptedBlob,
                fileType,
                encryptedData,
            );
            return URL.createObjectURL(decryptedBlob);
        } catch (error) {
            console.error("Preview Creation Error:", error);
            throw new Error("Failed to create preview URL!");
        }
    }

    validateFile(file: File) {
        const maxSize = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > maxSize) {
            throw new Error("File size is too large!");
        }

        const allowedTypes = [
            "image/",
            "video/",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/",
        ];

        if (!allowedTypes.some((type) => file.type.startsWith(type))) {
            throw new Error("Invalid file type!");
        }
    }

    revokePreviewUrl(url: string) {
        if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
        }
    }
}
