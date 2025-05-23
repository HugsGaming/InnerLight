import { current } from "immer";
import { EncryptedMessage, EncryptionManager } from "./client";
import { Buffer } from "buffer";
import { error } from "console";

export interface FileMetadata {
    fileName: string;
    fileType: string;
    fileSize: number;
    encyptedUrl?: string;
    thumbnailUrl?: string;
    iv?: string;
    key?: string;
    mimeType?: string;
    videoMetadata?: {
        width?: number;
        height?: number;
        duration?: number;
    };
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

    private async extractVideoMetadata(
        file: File,
    ): Promise<FileMetadata["videoMetadata"]> {
        let objectURL: string | null = null;
        const video = document.createElement("video");

        try {
            objectURL = URL.createObjectURL(file);

            const metadata = await new Promise<FileMetadata["videoMetadata"]>(
                (resolve, reject) => {
                    const timeOutId = setTimeout(() => {
                        cleanup();
                        resolve({});
                    }, 5000);

                    const cleanup = () => {
                        video.removeEventListener(
                            "loadedmetadata",
                            handleMetadata,
                        );
                        video.removeEventListener(
                            "loadeddata",
                            handleLoadedData,
                        );
                        video.removeEventListener("error", handleError);
                        clearTimeout(timeOutId);
                        if (objectURL) URL.revokeObjectURL(objectURL);
                    };

                    const handleMetadata = () => {
                        if (video.videoWidth && video.videoHeight) {
                            cleanup();
                            resolve({
                                width: video.videoWidth,
                                height: video.videoHeight,
                                duration: video.duration,
                            });
                        }
                    };

                    const handleLoadedData = () => {
                        cleanup();
                        resolve({
                            width: video.videoWidth,
                            height: video.videoHeight,
                            duration: video.duration,
                        });
                    };

                    const handleError = () => {
                        cleanup();
                        reject(new Error("Failed to extract video metadata"));
                    };

                    video.preload = "metadata";
                    video.addEventListener("loadedmetadata", handleMetadata);
                    video.addEventListener("loadeddata", handleLoadedData);
                    video.addEventListener("error", handleError);
                    video.src = objectURL!;
                },
            );

            return metadata;
        } catch (error) {
            console.warn("Failed to extract video metadata", error);
            return {};
        } finally {
            if (objectURL) URL.revokeObjectURL(objectURL);
        }
    }

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
            console.log("Original array buffer size: ", arrayBuffer.byteLength);

            // For video files, we need to preserve the original MIME type
            const isVideo = file.type.startsWith("video/");
            let videoMetadata: FileMetadata["videoMetadata"] | undefined;

            if (isVideo) {
                //Extract video metadata before encryption
                videoMetadata = await this.extractVideoMetadata(file);
                console.log("Extracted video metadata:", videoMetadata);

                // Verify we go valid metadata
                if (!videoMetadata?.width || !videoMetadata?.height) {
                    console.warn(
                        "Failed to extract video dimensions, will try again during playback",
                    );
                }
            }

            //Encrypt the binary data directly
            const iv = new Uint8Array(
                Buffer.from(encryptionParams.iv, "base64"),
            );
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv,
                },
                await this.encryptionManager.getKey(),
                arrayBuffer,
            );

            // Create encrypted blob
            const encryptedBlob = new Blob([encryptedData], {
                type: isVideo ? "video/encrypted" : "application/encrypted",
            });

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
                iv: encryptionParams.iv,
                mimeType: file.type,
                videoMetadata,
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
        metadata: FileMetadata,
    ): Promise<Blob> {
        try {
            if (!metadata.iv) {
                throw new Error("No IV found in metadata");
            }

            // Read encrypted data as ArrayBuffer
            const encryptedData = await encryptedBlob.arrayBuffer();
            console.log("Decrypting data: ", {
                size: encryptedData.byteLength,
                fileType,
                metadata,
            });

            // Convert IV from base64
            const iv = new Uint8Array(Buffer.from(metadata.iv, "base64"));

            // Decrypt the binary data directly
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv,
                },
                await this.encryptionManager.getKey(),
                encryptedData,
            );

            // Use the stored MIME for video, otherwise use the provided file type
            const finalType = metadata.mimeType || fileType;
            console.log("Creating video blob with type: ", finalType);

            // Create blob from binary data with proper type
            return new Blob([decryptedData], { type: finalType });
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

    private isValidJSON(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Creates a preview URL for a given encrypted blob, file type, and metadata.
     *
     * @param encryptedBlob The encrypted blob to decrypt and generate a preview URL for.
     * @param fileType The type of file the blob is (e.g. "image/jpeg", "video/mp4", etc.).
     * @param metadata The FileMetadata object containing the IV and other encryption-related data.
     * @returns A string representing the preview URL.
     * @throws {Error} If the decryption process fails.
     */
    async createPreviewUrl(
        encryptedBlob: Blob,
        fileType: string,
        metadata: FileMetadata,
    ): Promise<string> {
        try {
            const decryptedBlob = await this.decryptFile(
                encryptedBlob,
                fileType,
                metadata,
            );
            console.log(
                "Decryption successful, blob size:",
                decryptedBlob.size,
            );
            console.log("Decrypted blob type:", decryptedBlob.type);

            // Create and return the object URL
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

    async encryptVideo(
        file: File,
        encryptionParams: EncryptionParams,
    ): Promise<EncryptedFile> {
        try {
            // Extract video metadata
            const videoMetadata = await this.extractVideoMetadata(file);
            console.log("Extracted video metadata:", videoMetadata);

            // Read file as ArrayBuffer for encryption
            const arrayBuffer = await file.arrayBuffer();

            // Use Web Crypto API for encryption with AES-GCM
            const iv = new Uint8Array(
                Buffer.from(encryptionParams.iv, "base64"),
            );
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv,
                    tagLength: 128,
                },
                await this.encryptionManager.getKey(),
                arrayBuffer,
            );

            // Create blob with custom type
            const encryptedBlob = new Blob([encryptedData], {
                type: "video/encrypted",
            });

            // Generate video metadata with additional security information
            const metadata: FileMetadata = {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                iv: encryptionParams.iv,
                mimeType: file.type,
                videoMetadata: videoMetadata,
            };

            return { encryptedBlob, metadata };
        } catch (error) {
            console.error("Error encrypting video:", error);
            throw new Error("Failed to encrypt video!");
        }
    }

    async decryptVideo(
        encryptedBlob: Blob,
        metadata: FileMetadata,
    ): Promise<Blob> {
        try {
            console.log("Starting video decryption:", {
                encryptedSize: encryptedBlob.size,
                encryptedType: encryptedBlob.type,
                metadataType: metadata.fileType,
                mimeType: metadata.mimeType,
            });

            if (!metadata.iv) throw new Error("Missing IV in metadata");

            // Read encrypted data as ArrayBuffer
            const encryptedData = await encryptedBlob.arrayBuffer();
            console.log("Read encrypted data:", {
                arrayBufferSize: encryptedData.byteLength,
            });

            // Prepare iv for decryption
            const iv = new Uint8Array(Buffer.from(metadata.iv, "base64"));
            console.log("Prepared IV:", {
                ivLength: iv.length,
                ivBase64Length: metadata.iv.length,
            });

            // Use Web Crypto API for decryption with AES-GCM
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv,
                    tagLength: 128,
                },
                await this.encryptionManager.getKey(),
                encryptedData,
            );

            console.log("Decryption completed:", {
                decryptedSize: decryptedData.byteLength,
                expectedSize: metadata.fileSize,
            });

            const finalType =
                metadata.mimeType || metadata.fileType || "video/mp4";

            const decryptedBlob = new Blob([decryptedData], {
                type: finalType,
            });

            console.log("Created decrypted blob:", {
                blobSize: decryptedBlob.size,
                blobType: decryptedBlob.type,
                originalType: metadata.fileType,
            });

            // Create blob with original MIME type
            return decryptedBlob;
        } catch (error: any) {
            console.error("Video decryption error:", {
                error,
                errorMessage: error.message,
                errorStack: error.stack,
            });
            throw new Error("Failed to decrypt video!");
        }
    }

    async createVideoPreviewUrl(
        encryptedBlob: Blob,
        metadata: FileMetadata,
    ): Promise<string> {
        try {
            console.log("Starting video preview creation:", {
                encryptedBlobSize: encryptedBlob.size,
                encryptedBlobType: encryptedBlob.type,
                metadata: {
                    fileType: metadata.fileType,
                    mimeType: metadata.mimeType,
                    fileSize: metadata.fileSize,
                },
            });

            // Decrypt the video
            const decryptedBlob = await this.decryptVideo(
                encryptedBlob,
                metadata,
            );

            console.log("Decrypted blob details:", {
                size: decryptedBlob.size,
                type: decryptedBlob.type,
                validSize: decryptedBlob.size > 0,
                expectedType: metadata.mimeType || metadata.fileType,
            });

            // Validate the decrypted contnent
            if (decryptedBlob.size === 0) {
                throw new Error("Decryption resulted in empty content");
            }

            // Create a new blob with explicit video type
            const videoBlob = new Blob([decryptedBlob], {
                type: metadata.fileType || "video/mp4",
            });

            console.log("Video blob created: ", {
                size: videoBlob.size,
                type: videoBlob.type,
                originalMimeType: metadata.fileType,
            });

            // Create object URL
            const objectURL = URL.createObjectURL(videoBlob);

            console.log("Created object URL:", {
                urlType: objectURL.startsWith("blob:") ? "blob" : "other",
                urlLength: objectURL.length,
            });

            try {
                // Validate video URL
                await this.validateVideoUrl(objectURL);
                console.log("Video URL validated successfully");
                return objectURL;
            } catch (validationError) {
                console.error("Video validation failed:", validationError);
                // Cleanup the object URL if validation fails
                URL.revokeObjectURL(objectURL);
                throw validationError;
            }
        } catch (error: any) {
            console.error("Preview URL Creation Error:", {
                error,
                errorMessage: error.message,
                errorStack: error.stack,
            });
            throw new Error("Failed to create preview URL!");
        }
    }

    private async validateVideoUrl(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");

            // Add all possible event listeners for debugging
            const logEvent = (event: Event) => {
                console.log(`Video event triggered: ${event.type}`, {
                    currentTime: video.currentTime,
                    readyState: video.readyState,
                    networkState: video.networkState,
                    error: video.error,
                    src: video.src.substring(0, 100),
                });
            };

            const events = [
                "loadstart",
                "durationchange",
                "loadedmetadata",
                "loadeddata",
                "canplay",
                "canplaythrough",
                "progress",
            ];

            events.forEach((eventName) => {
                video.addEventListener(eventName, logEvent);
            });

            const timeoutId = setTimeout(() => {
                cleanup();
                console.error("Video validation timeout. Final state:", {
                    readyState: video.readyState,
                    networkState: video.networkState,
                    error: video.error,
                    duration: video.duration,
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                });
                reject(new Error("Video URL validation timeout"));
            }, 10000);

            const cleanup = () => {
                events.forEach((eventName) => {
                    video.removeEventListener(eventName, logEvent);
                });
                video.removeEventListener("loadedmetadata", handleLoad);
                video.removeEventListener("error", handleError);
                clearTimeout(timeoutId);
            };

            const handleLoad = () => {
                console.log("Video metadata loaded successfully:", {
                    duration: video.duration,
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight,
                    readyState: video.readyState,
                    networkState: video.networkState,
                });
                cleanup();
                resolve();
            };

            const handleError = () => {
                cleanup();
                console.error("Video loading error:", {
                    errorCode: video.error?.code,
                    errorMessage: video.error?.message,
                    networkState: video.networkState,
                    readyState: video.readyState,
                });
                reject(new Error("Failed to validate video URL"));
            };

            video.addEventListener("loadedmetadata", handleLoad);
            video.addEventListener("error", handleError);

            video.preload = "metadata";

            console.log("Attempting to validate video URL:", {
                urlType: url.startsWith("blob:") ? "blob" : "other",
                urlLength: url.length,
            });

            video.src = url;
        });
    }
}
