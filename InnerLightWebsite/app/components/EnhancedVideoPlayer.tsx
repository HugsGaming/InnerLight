import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileMetadata } from "../utils/encryption/fileservice";

interface VideoPlayerProps {
    url: string;
    fileMetadata: FileMetadata;
    onError?: (error: string) => void;
    isDecrypting: boolean;
}

// Cache for video URLs to prevent re-fetching
const videoURLCache = new Map<string, { url: string; lastAccessed: number}>();

// Cleanup old cache entries periodically
const cleanUpCache = () => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds
    for (const [key, value] of videoURLCache.entries()) {
        if (now - value.lastAccessed > maxAge) {
            URL.revokeObjectURL(value.url);
            videoURLCache.delete(key);
        }
    }
}

export default function EnhancedVideoPlayer({
    url,
    fileMetadata,
    onError,
    isDecrypting,
}: VideoPlayerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState(
        fileMetadata.videoMetadata?.width && fileMetadata.videoMetadata?.height
            ? `${fileMetadata.videoMetadata.width}/${fileMetadata.videoMetadata.height}`
            : "16/9",
    );
    const videoRef = useRef<HTMLVideoElement>(null);
    const loadingTimeoutRef = useRef<NodeJS.Timeout>();
    const [videoURL, setVideoURL] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    const cleanUp = useCallback(() => {
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
        }
    }, []);

    const loadVideo = useCallback(async () => {
        if (!url || isMountedRef.current) return;

        try {
            setIsLoading(true);
            setError(null);

            // Check cache first
            const cachedData = videoURLCache.get(url);
            if(cachedData) {
                cachedData.lastAccessed = Date.now();
                setVideoURL(cachedData.url);
                setIsLoading(false);
                return;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(
                    `HTTP error! status: ${response.statusText}`,
                );
            }

            const videoBlob = await response.blob();
            const videoWithType = new Blob([videoBlob], {
                type: fileMetadata.mimeType || "video/mp4",
            });

            const objectUrl = URL.createObjectURL(videoWithType);
            videoURLCache.set(url, { url: objectUrl, lastAccessed: Date.now() });

            if (isMountedRef.current) {
                setVideoURL(objectUrl);
                setIsLoading(false);
            }

            cleanUpCache();
        } catch (error) {
            if (!isMountedRef.current) return;
            const errorMessage = error instanceof Error ? error.message : "Failed to load video"
            console.error("Video loading error:", error);
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [url, fileMetadata.mimeType, onError]);

    useEffect(() => {
        isMountedRef.current = true;
        loadVideo();

        return () => {
            isMountedRef.current = false;
            cleanUp();
        }
    }, [loadVideo, cleanUp])

    const handleLoadedMetadata = () => {
        if (!videoRef.current || !isMountedRef.current) return;

        const video = videoRef.current;
        if(video.videoWidth !== 0 && video.videoHeight !== 0) {
            setAspectRatio(`${video.videoWidth}/${video.videoHeight}`);
        }
        setIsLoading(false);
        setError(null);
    };

    const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const video = e.currentTarget;
        const errorMessage = `Video loading error: ${video.error?.message || "Unknown error"} (${video.error?.code})`;
        console.error("Video error:", {
            error: video.error?.message || "Unknown error",
            code: video.error?.code,
            networkState: video.networkState,
            readyState: video.readyState,
        });
        setError(
            errorMessage
        );
        onError?.(
            errorMessage
        );
        setIsLoading(false);
    };

    if (isDecrypting) {
        return (
            <div className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }
    return (
        <div className="w-full">
            <div className="relative w-full" style={{ aspectRatio }}>
                <video
                    ref={videoRef}
                    className="rounded-lg w-full min-w-[320px] min-h-[180px] bg-black"
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={handleLoadedMetadata}
                    onError={handleError}
                    src={videoURL ?? url}
                >
                    Your browser does not support the video tag.
                </video>
                {isLoading && (
                    <div className="flex items-center justify-center mt-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
                    <p className="text-red-600 dark:text-red-200">
                        Error: {error}
                    </p>
                </div>
            )}

            {fileMetadata?.fileName && (
                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {fileMetadata.fileName}
                </div>
            )}
        </div>
    );
}
