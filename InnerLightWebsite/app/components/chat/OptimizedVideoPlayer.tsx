import React, { useEffect, useRef, useState, memo, useMemo } from "react";
import { SecureFileMetadata } from "../../utils/encryption/secureFileService";

interface OptimizedVideoPlayerProps {
    fileMetadata: SecureFileMetadata;
    onError?: (error: string) => void;
}

function OptimizedVideoPlayer({
    fileMetadata,
    onError,
}: OptimizedVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const signedUrlRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const loadAttempts = useRef(0);

    const initialAspectRatio = useMemo(
        () =>
            fileMetadata.videoMetadata?.width &&
            fileMetadata.videoMetadata?.height
                ? `${fileMetadata.videoMetadata.width}/${fileMetadata.videoMetadata.height}`
                : "16/9",
        [fileMetadata.videoMetadata?.width, fileMetadata.videoMetadata?.height],
    );

    const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);

    const loadVideo = async () => {
        try {
            if (!videoRef.current) return;

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

            setIsLoading(true);
            setError(null);
            // Get signed URL from backend
            const response = await fetch("/api/getSignedUrl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: fileMetadata.storageUrl,
                    bucket: "chat-files",
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error("Failed to get video URL");
            }

            const { signedUrl } = await response.json();

            // Only update if the component is still mounted and the URL is different
            if (videoRef.current && signedUrl !== signedUrlRef.current) {
                signedUrlRef.current = signedUrl;
                videoRef.current.src = signedUrl;
            }
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                return;
            }
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load video";
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (!videoRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loadVideo();
                        observer.unobserve(videoRef.current!);
                    }
                });
            },
            { threshold: 0.1 },
        );
        observer.observe(videoRef.current);

        // Cleanup
        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, [fileMetadata, onError]);

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        if (video.videoWidth && video.videoHeight) {
            setAspectRatio(`${video.videoWidth}/${video.videoHeight}`);
        }
    };

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (signedUrlRef.current) {
                URL.revokeObjectURL(signedUrlRef.current);
                signedUrlRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.src = "";
                videoRef.current.load();
            }
        };
    }, []);

    if (error) {
        return (
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
                <p className="text-red-600 dark:text-red-200">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="relative w-full" style={{ aspectRatio }}>
                <video
                    ref={videoRef}
                    className="rounded-lg w-full h-full bg-black"
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={handleLoadedMetadata}
                    disablePictureInPicture
                    onLoadStart={() => setIsLoading(true)}
                    onCanPlay={() => setIsLoading(false)}
                >
                    Your browser doesn&apos;t support video playback.
                </video>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                )}
            </div>

            {fileMetadata.fileName && (
                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {fileMetadata.fileName}
                </div>
            )}
        </div>
    );
}

export default memo(OptimizedVideoPlayer, (prevProps, nextProps) => {
    return (
        prevProps.fileMetadata.storageUrl === nextProps.fileMetadata.storageUrl
    );
});
