import { v4 as uuidv4 } from "uuid";
import { EncryptionManager } from "./client";

export interface SecureFileMetadata {
    fileName: string;
    fileType: string;
    fileSize: number;
    storageUrl?: string;
    thumbnailUrl?: string;
    originalName: string;
    accessToken: string;
    videoMetadata?: {
        width?: number;
        height?: number;
        duration?: number;
    };
}

export class SecureFileService {
    constructor(public encryptionManager: EncryptionManager) {}

    private async extractVideoMetadata(
        file: File,
    ): Promise<SecureFileMetadata["videoMetadata"]> {
        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.preload = "metadata";

            video.onloadedmetadata = () => {
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration,
                });
            };

            video.onerror = () => {
                console.warn("Failed to extract video metadata");
                resolve({});
            };

            video.src = URL.createObjectURL(file);
        });
    }

    async processFile(
        file: File,
    ): Promise<{ processedFile: File; metadata: SecureFileMetadata }> {
        // Generate a secure random file name
        const fileExt = file.name.split(".").pop();
        const secureFileName = `${uuidv4()}.${fileExt}`;

        // Create a new file with the secure name
        const processedFile = new File([file], secureFileName, {
            type: file.type,
        });

        // Extract video metadata if it's a video
        let videoMetadata;
        if (file.type.startsWith("video/")) {
            videoMetadata = await this.extractVideoMetadata(file);
        }

        // Encrypt sensitive metadata
        const encryptedOriginalName = await this.encryptionManager.encrypt(
            file.name,
        );

        // Generate access token (could be used for additional validation)
        const accessToken = uuidv4();

        const metadata: SecureFileMetadata = {
            fileName: secureFileName,
            fileType: file.type,
            fileSize: file.size,
            originalName: JSON.stringify(encryptedOriginalName),
            accessToken,
            videoMetadata,
        };

        return { processedFile, metadata };
    }

    async validateAccess(metadata: SecureFileMetadata): Promise<string> {
        try {
            console.log("Validating access:", metadata);

            const finalMetadata: SecureFileMetadata = JSON.parse(
                metadata as unknown as string,
            );

            console.log("Decrypted metadata:", finalMetadata);

            // Verify file metadata
            if (
                !finalMetadata.fileName ||
                !finalMetadata.originalName ||
                !finalMetadata.storageUrl
            ) {
                console.error("Missing Required Metadata", {
                    hasFileName: Boolean(metadata.fileName),
                    hasOriginalName: Boolean(metadata.originalName),
                    hasStorageUrl: Boolean(metadata.storageUrl),
                });
                throw new Error("Invalid file metadata");
            }

            // Get signed URL
            const response = await fetch("/api/getSignedUrl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: finalMetadata.storageUrl,
                    bucket: "chat-files",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get signed URL");
            }

            const { signedUrl } = await response.json();
            return signedUrl;
        } catch (error) {
            console.error("Access validation error:", error);
            throw new Error("Access validation failed");
        }
    }

    async generateThumbnail(file: File): Promise<string | null> {
        if (!file.type.startsWith("image/")) return null;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        resolve(null);
                        return;
                    }

                    // Calculate thumbnail dimensions
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
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}
