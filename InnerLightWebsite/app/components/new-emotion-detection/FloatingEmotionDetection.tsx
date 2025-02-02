"use client";

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { Camera, X, Minimize2, Maximize2 } from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { createClient } from "../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";
import { toast } from "react-toastify";

class L2 {
    static className = "L2";

    constructor(config: any) {
        return tf.regularizers.l2(config);
    }
}
// @ts-ignore
tf.serialization.registerClass(L2);

const EMOTIONS = [
    "angry",
    "disgust",
    "fear",
    "happy",
    "sad",
    "surprise",
    "neutral",
] as const;
type Emotion = (typeof EMOTIONS)[number];
const VIDEO_WIDTH = 480;
const VIDEO_HEIGHT = 360;

type Landmark = {
    x: number;
    y: number;
    z: number;
};

interface EmotionLog {
    user_id: string;
    emotion: Emotion;
    confidence: number;
    timestamp: string;
    session_id: string;
    page_path: string;
}

interface EmotionLogger {
    logEmotion: (emotionLog: EmotionLog) => Promise<void>;
}

// Define face mesh connections
const FACE_MESH_CONNECTIONS = [
    // Face oval
    [10, 338],
    [338, 297],
    [297, 332],
    [332, 284],
    [284, 251],
    [251, 389],
    [389, 356],
    [356, 454],
    [454, 323],
    [323, 361],
    [361, 288],
    [288, 397],
    [397, 365],
    [365, 379],
    [379, 378],
    [378, 400],
    [400, 377],
    [377, 152],
    [152, 148],
    [148, 176],
    [176, 149],
    [149, 150],
    [150, 136],
    [136, 172],
    [172, 58],
    [58, 132],
    [132, 93],
    [93, 234],
    [234, 127],
    [127, 162],
    [162, 21],
    [21, 54],
    [54, 103],
    [103, 67],
    [67, 109],
    [109, 10],
];

// Improved face preprocessing
const extractFaceRegion = (video: HTMLVideoElement, landmarks: Landmark[]) => {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Calculate face bounding box with padding
    const minX = Math.min(...landmarks.map((l) => l.x));
    const minY = Math.min(...landmarks.map((l) => l.y));
    const maxX = Math.max(...landmarks.map((l) => l.x));
    const maxY = Math.max(...landmarks.map((l) => l.y));

    const padding = 0.1;
    const width = (maxX - minX) * (1 + padding);
    const height = (maxY - minY) * (1 + padding);
    const x = minX - width * padding * 0.5;
    const y = minY - height * padding * 0.5;

    // Extract and normalize face region
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
        video,
        x * VIDEO_WIDTH,
        y * VIDEO_HEIGHT,
        width * VIDEO_WIDTH,
        height * VIDEO_HEIGHT,
        0,
        0,
        48,
        48,
    );

    return canvas;
};

const drawConnectors = (
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    connections: number[][],
    color: string,
) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (const [start, end] of connections) {
        const startLandmark = landmarks[start];
        const endLandmark = landmarks[end];

        if (startLandmark && endLandmark) {
            ctx.beginPath();
            ctx.moveTo(
                startLandmark.x * VIDEO_WIDTH,
                startLandmark.y * VIDEO_HEIGHT,
            );
            ctx.lineTo(
                endLandmark.x * VIDEO_WIDTH,
                endLandmark.y * VIDEO_HEIGHT,
            );
            ctx.stroke();
        }
    }
};

const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    color: string,
) => {
    ctx.fillStyle = color;

    for (const landmark of landmarks) {
        ctx.beginPath();
        ctx.arc(
            landmark.x * VIDEO_WIDTH,
            landmark.y * VIDEO_HEIGHT,
            1, // smaller radius
            0,
            2 * Math.PI,
        );
        ctx.fill();
    }
};

const createEmotionLogger = (
    supabase: SupabaseClient<Database>,
): EmotionLogger => {
    const queue: EmotionLog[] = [];

    let isProcesing = false;
    const batch = queue.splice(0, 10);

    const processFinalBatch = async () => {
        if (queue.length === 0) return;

        try {
            const { error } = await supabase.from("emotion_logs").insert(queue);

            if (error) {
                console.error("Error in final emotion log batch:", error);
            }
        } catch (error) {
            console.error("Error in final emotion logging:", error);
        }
    };

    window.addEventListener("beforeunload", (event) => {
        if (queue.length > 0) {
            processFinalBatch();
        }
    });

    const processQueue = async () => {
        if (isProcesing || queue.length === 0) return;

        try {
            const { error } = await supabase.from("emotion_logs").insert(batch);

            if (error) {
                console.error("Error batch logging emotions:", error);
                queue.unshift(...batch);
            }

            console.log("Batched Log: ", batch);
        } catch (error) {
            console.error("Error in emotion logging:", error);
            queue.unshift(...batch);
        } finally {
            isProcesing = false;
            if (queue.length > 0) {
                setTimeout(processQueue, 100);
            }
        }
    };

    return {
        logEmotion: async (emotionLog: EmotionLog) => {
            queue.push(emotionLog);
            if (queue.length === 1) {
                setTimeout(processQueue, 100);
            }
        },
    };
};

const EmotionDetector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [status, setStatus] = useState("Click to start");
    const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
    const [confidence, setConfidence] = useState<number>(0);
    const [error, setError] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);

    const router = useRouter();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const faceLandmarkerRef = useRef<any>(null);
    const modelRef = useRef<tf.LayersModel | null>(null);
    const emotionBufferRef = useRef<
        Array<{ emotion: Emotion; confidence: number }>
    >([]);
    const animationFrameRef = useRef<number | null>(null);
    const lastProcessTimeRef = useRef<number>(0);
    const userIdRef = useRef<string | null>(null);

    const [sessionId, setSessionId] = useState<string>(uuidv4());
    const lastLogTimeRef = useRef<number>(0);
    const supabase = useMemo(() => createClient(), []);

    const emotionLogger = createEmotionLogger(supabase);

    const logEmotion = async (emotion: Emotion, confidence: number) => {
        try {
            const now = Date.now();
            if (now - lastLogTimeRef.current < 1000) return;
            lastLogTimeRef.current = now;

            const currentPath = window.location.pathname;

            const emotionLog: EmotionLog = {
                user_id: userIdRef.current!,
                emotion,
                confidence,
                timestamp: new Date().toISOString(),
                session_id: sessionId,
                page_path: currentPath,
            };

            console.log("Attepting to log: ", emotionLog);

            await emotionLogger.logEmotion(emotionLog);
        } catch (error) {
            console.error("Error logging emotion:", error);
        }
    };

    useEffect(() => {
        const initializeModels = async () => {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if(userError || !user) {
                    toast.error("Error Getting user: " + userError?.message);
                    router.replace("/auth/login");
                    return;
                }
                userIdRef.current = user.id;

                setStatus("Loading models...");

                const model = await tf.loadLayersModel(
                    "/emotion_model_js/model.json",
                );
                modelRef.current = model;

                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
                );

                const faceLandmarker = await FaceLandmarker.createFromOptions(
                    filesetResolver,
                    {
                        baseOptions: {
                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                            delegate: "GPU",
                        },
                        outputFaceBlendshapes: true,
                        runningMode: "VIDEO",
                        numFaces: 1,
                    },
                );

                faceLandmarkerRef.current = faceLandmarker;
                setIsInitialized(true);
                setStatus("Ready");
            } catch (err: any) {
                console.error("Initialization error:", err);
                setError("Failed to load models: " + err.message);
                setStatus("Error loading models");
            }
        };

        initializeModels();

        return () => {
            // Cleanup
            if (modelRef.current) {
                modelRef.current.dispose();
            }
        };
    }, []);

    // Process frame with rate limiting for stability
    const processVideo = useCallback(async () => {
        if (
            !videoRef.current ||
            !faceLandmarkerRef.current ||
            !canvasRef.current ||
            !modelRef.current
        )
            return;

        const now = performance.now();
        if (now - lastProcessTimeRef.current < 50) {
            // Max 20 FPS for stability
            animationFrameRef.current = requestAnimationFrame(processVideo);
            return;
        }
        lastProcessTimeRef.current = now;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        try {
            const results = faceLandmarkerRef.current.detectForVideo(
                video,
                now,
            );

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            let detectedEmotion: Emotion | null = null;
            let detectedConfidence = 0;

            if (results.faceLandmarks?.length) {
                const landmarks = results.faceLandmarks[0];

                // Draw face mesh connections
                drawConnectors(
                    ctx,
                    landmarks,
                    FACE_MESH_CONNECTIONS,
                    "rgba(255, 255, 255, 0.5)",
                );

                // Draw landmarks
                drawLandmarks(ctx, landmarks, "rgba(0, 255, 0, 0.8)");

                const faceCanvas = extractFaceRegion(video, landmarks);

                if (faceCanvas) {
                    // Improved emotion detection with confidence
                    const tensor = tf.tidy(() => {
                        return tf.browser
                            .fromPixels(faceCanvas, 1)
                            .expandDims(0)
                            .div(255.0);
                    });

                    const predictions = modelRef.current.predict(
                        tensor,
                    ) as tf.Tensor;
                    const probs = await predictions.data();
                    tensor.dispose();
                    predictions.dispose();

                    const maxIndex = Array.from(probs).indexOf(
                        Math.max(...Array.from(probs)),
                    );
                    const maxConfidence = probs[maxIndex];
                    const emotion = EMOTIONS[maxIndex];

                    // Enhanced emotion smoothing with confidence weighting
                    emotionBufferRef.current.push({
                        emotion,
                        confidence: maxConfidence,
                    });
                    if (emotionBufferRef.current.length > 5) {
                        emotionBufferRef.current.shift();
                    }

                    // Weighted voting based on confidence
                    const emotionVotes = emotionBufferRef.current.reduce(
                        (acc, curr) => {
                            acc[curr.emotion] =
                                (acc[curr.emotion] || 0) + curr.confidence;
                            return acc;
                        },
                        {} as Record<Emotion, number>,
                    );

                    const dominantEmotion = Object.entries(emotionVotes).reduce(
                        (a, b) => (a[1] > b[1] ? a : b),
                    )[0] as Emotion;

                    const avgConfidence =
                        emotionBufferRef.current.reduce(
                            (sum, curr) => sum + curr.confidence,
                            0,
                        ) / emotionBufferRef.current.length;

                    detectedEmotion = dominantEmotion;
                    detectedConfidence = avgConfidence;

                    setCurrentEmotion(dominantEmotion);
                    setConfidence(avgConfidence);

                    // Draw face mesh with emotion label
                    ctx.font = "16px sans-serif";
                    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
                    ctx.fillText(
                        `${dominantEmotion} (${(avgConfidence * 100).toFixed(1)}%)`,
                        10,
                        30,
                    );

                    if (detectedConfidence && detectedConfidence > 0) {
                        console.log("Attempting to log emotion:", {
                            detectedEmotion,
                            detectedConfidence,
                        });
                        await logEmotion(detectedEmotion, detectedConfidence);
                    }
                }
            }
            animationFrameRef.current = requestAnimationFrame(processVideo);
        } catch (err) {
            console.error("Processing error:", err);
            setError("Processing error: " + (err as Error).message);
        }
    }, []);

    useEffect(() => {
        if (!isOpen || !isInitialized) return;

        const startCamera = async () => {
            try {
                setError("");
                setStatus("Starting camera...");

                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error("Camera API not available");
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: VIDEO_WIDTH,
                        height: VIDEO_HEIGHT,
                    },
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                    await videoRef.current.play();
                    setStatus("Processing...");
                    processVideo();
                }
            } catch (err: any) {
                console.error("Camera error:", err);
                setError("Camera error: " + err.message);
                setStatus("Camera error");
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isOpen, isInitialized, processVideo]);

    const emotionColor = currentEmotion
        ? {
              happy: "text-green-400",
              sad: "text-blue-400",
              angry: "text-red-400",
              surprise: "text-yellow-400",
              fear: "text-purple-400",
              disgust: "text-orange-400",
              neutral: "text-gray-400",
          }[currentEmotion]
        : "text-white";

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isOpen ? (
                <div
                    className={`bg-gray-800 rounded-xl shadow-2xl transition-all duration-300 ${
                        isMinimized ? "w-48" : "w-80"
                    }`}
                >
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span
                                className={`text-sm font-medium ${emotionColor}`}
                            >
                                {currentEmotion
                                    ? `${currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)} (${(confidence * 100).toFixed(1)}%)`
                                    : status}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1 hover:bg-gray-700 rounded transition-colors text-white"
                                >
                                    {isMinimized ? (
                                        <Maximize2 size={16} />
                                    ) : (
                                        <Minimize2 size={16} />
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-gray-700 rounded transition-colors text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    className="absolute w-full h-full object-cover"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full"
                                    width={VIDEO_WIDTH}
                                    height={VIDEO_HEIGHT}
                                />
                                {error && (
                                    <div className="absolute inset-0 flex items-center justify-center text-red-500 text-sm p-4 text-center bg-black bg-opacity-75">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    disabled={!isInitialized}
                    className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Camera size={24} />
                </button>
            )}
        </div>
    );
};

export default EmotionDetector;
