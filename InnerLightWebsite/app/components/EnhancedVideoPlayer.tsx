import React, { useEffect, useRef, useState } from 'react'
import { FileMetadata } from '../utils/encryption/fileservice'

interface VideoPlayerProps {
    url: string;
    fileMetadata: FileMetadata;
    onError?: (error: string) => void;
    isDecrypting: boolean;
}

export default function EnhancedVideoPlayer({
    url,
    fileMetadata,
    onError,
    isDecrypting
}: VideoPlayerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState(
        fileMetadata.videoMetadata?.width && fileMetadata.videoMetadata?.height
            ? `${fileMetadata.videoMetadata.width}/${fileMetadata.videoMetadata.height}`
            : '16/9'
    );
    const videoRef = useRef<HTMLVideoElement>(null);
    const loadingTimeoutRef = useRef<NodeJS.Timeout>();
    const [videoURL, setVideoURL] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        let objectUrl : string | null = null;

        const loadvideo = async () => {
            if(!url) return;

            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(url);
                if(!response.ok) {
                    throw new Error(`HTTP error! status: ${response.statusText}`);
                }

                const videoBlob = await response.blob();
                console.log('Video blob:', {
                    size: videoBlob.size,
                    type: videoBlob.type
                });

                // Create a new blob with explicit video type
                const videoWithType = new Blob(
                    [videoBlob],
                    { type: fileMetadata.mimeType || 'video/mp4' }
                )

                


                objectUrl = URL.createObjectURL(videoBlob);


                if(mounted) {
                    setVideoURL(objectUrl);
                    setIsLoading(false);
                }

            } catch (error : any) {
                if(!mounted) return;
                const errorMessage = error.message || 'Failed to load video';
                console.error('Video loading error:', error);
                setError(errorMessage);
                onError?.(errorMessage);
                console.error('Detailed video loading error:', {
                    error,
                    message: error.message,
                    stack: error.stack
                });``
            } finally {
                if(mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadvideo();

        return () => {
            mounted = false;
            if(videoURL) {
                URL.revokeObjectURL(videoURL);
            }
        }
    }, [url, onError, isDecrypting, fileMetadata.mimeType]);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }

            if(video.videoWidth && video.videoHeight) {
                setAspectRatio(`${video.videoWidth}/${video.videoHeight}`);
            }
            setIsLoading(false);
            setError(null);
        }
    }

    const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const video = e.currentTarget;
        console.error('Video error:', {
            error: video.error?.message || 'Unknown error',
            code: video.error?.code,
            networkState: video.networkState,
            readyState: video.readyState,
        });
        setError(`Failed to load video: ${video.error?.message || 'Unknown error'}`);
        onError?.(`Video loading failed: ${video.error?.message || 'Unknown error'}`);
        setIsLoading(false);
    }

    if(isDecrypting) {
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
                    <p className="text-red-600 dark:text-red-200">Error: {error}</p>
                </div>
            )}
            
            {fileMetadata?.fileName && (
                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {fileMetadata.fileName}
                </div>
            )}
        </div>
  )
}
