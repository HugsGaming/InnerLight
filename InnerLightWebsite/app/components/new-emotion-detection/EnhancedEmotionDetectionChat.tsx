"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import {
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "@mediapipe/tasks-vision";
import {
    Camera,
    MessageSquare,
    Loader2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { resolve } from "bun";

// Types
interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    emotion: string | null;
    timestamp: number;
}

interface ChatResponse {
    response: string;
    emotion: string;
}

interface EmotionDetectorState {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    currentEmotion: string | null;
}

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

const EMOTIONAL_CONTEXTS: Record<Emotion, string> = {
    angry: "The user seems angry or frustrated. Respond with empathy and help de-escalate the situation. Acknowledge their feelings and offer constructive support.",
    happy: "The user appears happy and positive. Match their upbeat energy while maintaining a natural conversation flow. Feel free to share in their joy.",
    sad: "The user seems sad or down. Show empathy and understanding. Offer emotional support without being overly cheerful. Listen and acknowledge their feelings.",
    neutral:
        "The user appears neutral. Maintain a balanced and engaged conversation while being responsive to subtle emotional cues.",
    fear: "The user shows signs of anxiety or fear. Provide reassurance and support. Help them feel safe and understood while offering practical perspectives.",
    disgust:
        "The user appears disgusted or disapproving. Address their concerns seriously while helping to reframe the situation constructively.",
    surprise:
        "The user seems surprised or taken aback. Explore their reaction with curiosity while providing steady, grounded responses.",
};

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

export default function EnhancedEmotionDetectionChat() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const faceLandmarkerRef = useRef<any>(null);
    const drawingUtilsRef = useRef<any>(null);
    const emotionBufferRef = useRef<string[]>([]);
    const lastVideoTimeRef = useRef<number>(-1);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<tf.LayersModel | null>(null);

    const [emotionModel, setEmotionModel] = useState<tf.LayersModel | null>(
        null,
    );
    const [detectorState, setDetectorState] = useState<EmotionDetectorState>({
        isInitialized: false,
        isLoading: false,
        error: null,
        currentEmotion: null,
    });
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState<string>("");
    const [isSending, setIsSending] = useState<boolean>(false);

    const EMOTION_BUFFER_SIZE = 5;

    // Utility Functions
    const getMostFrequentEmotion = useCallback((emotions: string[]): string => {
        return Object.entries(
            emotions.reduce((acc: Record<string, number>, emotion) => {
                acc[emotion] = (acc[emotion] || 0) + 1;
                return acc;
            }, {}),
        ).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    }, []);

    const updateEmotionState = useCallback(
        (emotion: string) => {
            emotionBufferRef.current.push(emotion);
            if (emotionBufferRef.current.length > EMOTION_BUFFER_SIZE) {
                emotionBufferRef.current.shift();
            }

            const stableEmotion = getMostFrequentEmotion(
                emotionBufferRef.current,
            );
            setDetectorState((prev) => ({
                ...prev,
                currentEmotion: stableEmotion,
            }));
        },
        [getMostFrequentEmotion],
    );

    // Initialize FaceLandmarker
    const initializeFaceLandmarker = async () => {
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
            );

            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(
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

            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d");
                drawingUtilsRef.current = new DrawingUtils(ctx!);
            }

            return true;
        } catch (error) {
            setDetectorState((prev) => ({
                ...prev,
                error: "Failed to initialize face detection",
            }));
            return false;
        }
    };

    // Emotion Detection
    const detectEmotion = async (
        faceImage: HTMLCanvasElement,
    ): Promise<string | null> => {
        return new Promise(async (resolve, reject) => {
            const model = modelRef.current;

            if (!model) {
                console.warn("Model not initialized yet.");
                resolve(null);
                return;
            }

            try {
                // Create tensor promise
                const tensorPromise = new Promise<tf.Tensor>(
                    (resolveTensor) => {
                        const tensor = tf.tidy(() => {
                            const imageTensor = tf.browser
                                .fromPixels(faceImage, 1)
                                .resizeBilinear([48, 48])
                                .mean(2)
                                .expandDims(0)
                                .expandDims(-1)
                                .div(255);
                            console.log(
                                "Created tensor with shape:",
                                imageTensor.shape,
                            );
                            return imageTensor;
                        });
                        resolveTensor(tensor);
                    },
                );

                const tensor = await tensorPromise;

                //Make prediction
                const predictionPromise = new Promise<number[]>(
                    async (resolvePred) => {
                        try {
                            const preditions = model.predict(
                                tensor,
                            ) as tf.Tensor;
                            const predictionArray = await preditions.data();
                            preditions.dispose();
                            resolvePred(Array.from(predictionArray));
                        } catch (predError) {
                            console.error("Prediction error:", predError);
                            reject(predError);
                        }
                    },
                );

                const predictionArray = await predictionPromise;
                console.log("Raw predictions:", predictionArray);

                const maxIndex = predictionArray.indexOf(
                    Math.max(...predictionArray),
                );
                const predictedEmotion = EMOTIONS[maxIndex];

                console.log(
                    "Predicted emotion:",
                    predictedEmotion,
                    "with confidence: ",
                    predictionArray[maxIndex],
                );

                tensor.dispose();
                resolve(predictedEmotion);
            } catch (error) {
                console.error("Error in detectEmotion:", error);
                reject(error);
            }
        });
    };

    const runDetection = async () => {
        if (
            !videoRef.current ||
            !faceLandmarkerRef.current ||
            !canvasRef.current
        ) {
            console.warn(
                "Video, faceLandmarker, or canvas not initialized yet.",
            );
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            console.error("Failed to get canvas context");
            return;
        }

        try {
            if (video.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = video.currentTime;

                const detectionPromise = new Promise((resolve) => {
                    const results = faceLandmarkerRef.current.detectForVideo(
                        video,
                        performance.now(),
                    );
                    resolve(results);
                });

                const results = await detectionPromise;

                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // @ts-ignore
                if (results.faceLandmarks?.length) {
                    // @ts-ignore
                    const landmarks = results.faceLandmarks[0];
                    drawingUtilsRef.current.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                        { color: "#C0C0C070", lineWidth: 1 },
                    );

                    const boundingBox = getBoundingBox(landmarks, canvas);

                    const faceImagePromise = new Promise<HTMLCanvasElement>(
                        (resolve) => {
                            const faceImage = extractFaceRegion(
                                video,
                                boundingBox,
                            );
                            resolve(faceImage);
                        },
                    );

                    const faceImage = await faceImagePromise;

                    // Log face extraction
                    console.log("Face extraction complete, dimensions:", {
                        width: faceImage.width,
                        height: faceImage.height,
                        bbox: boundingBox,
                    });

                    const emotion = await detectEmotion(faceImage);
                    console.log("Detected emotion:", emotion);

                    if (emotion) {
                        updateEmotionState(emotion);
                        drawEmotionLabel(ctx, boundingBox, emotion);
                    }
                }
                ctx.restore();
            }
        } catch (error) {
            console.error("Error in runDetection:", error);
        }

        requestAnimationFrame(runDetection);
    };

    // Chat Functions
    const generateResponse = async (
        userMessage: string,
        emotion: string,
    ): Promise<ChatResponse> => {
        const response = await fetch("/api/newAI", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", content: userMessage }],
                emotion,
                emotionalContext:
                    EMOTIONAL_CONTEXTS[emotion as Emotion] ||
                    EMOTIONAL_CONTEXTS.neutral,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to generate response");
        }

        return response.json();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isSending) return;

        const messageId = Date.now().toString();
        const emotion = detectorState.currentEmotion || "neutral";

        try {
            setIsSending(true);
            setMessages((prev) => [
                ...prev,
                {
                    id: messageId,
                    text: inputMessage,
                    sender: "user",
                    emotion,
                    timestamp: Date.now(),
                },
            ]);
            setInputMessage("");

            const response = await generateResponse(inputMessage, emotion);

            setMessages((prev) => [
                ...prev,
                {
                    id: `${messageId}-response`,
                    text: response.response,
                    sender: "bot",
                    emotion: response.emotion,
                    timestamp: Date.now(),
                },
            ]);
        } catch (error) {
            setDetectorState((prev) => ({
                ...prev,
                error: "Failed to generate response",
            }));
        } finally {
            setIsSending(false);
        }
    };

    const initializeModel = async (): Promise<tf.LayersModel> => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Starting model initialization...");
                const model = await tf.loadLayersModel(
                    "/emotion_model_js/model.json",
                );
                console.log("Model loaded successfully.");

                // Warmup run to ensure model is ready
                const dummTensor = tf.zeros([1, 48, 48, 1]);
                const warmResult = await model.predict(dummTensor);
                (warmResult as tf.Tensor).dispose();
                resolve(model);
            } catch (error) {
                console.error("Error initializing model:", error);
                reject(error);
            }
        });
    };

    // Lifecycle
    useEffect(() => {
        const initialize = async () => {
            setDetectorState((prev) => ({ ...prev, isLoading: true }));
            try {
                const model = await initializeModel();
                console.log("Assigned model:", model);

                modelRef.current = model;
                setEmotionModel((prev) => model);

                const faceLandmarkerInitialized =
                    await initializeFaceLandmarker();
                if (!faceLandmarkerInitialized) return;

                // Start video after initialization
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
                    audio: false,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        videoRef.current!.play();
                        requestAnimationFrame(runDetection);
                    };
                }

                setDetectorState((prev) => ({
                    ...prev,
                    isInitialized: true,
                    isLoading: false,
                }));
            } catch (error) {
                setDetectorState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: "Failed to initialize",
                }));
            }
        };

        initialize();

        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="w-full max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-4">
            {/* Video Feed Section */}
            <div className="w-full md:w-1/2">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            className="absolute w-full h-full object-cover"
                            width={VIDEO_WIDTH}
                            height={VIDEO_HEIGHT}
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full"
                            width={VIDEO_WIDTH}
                            height={VIDEO_HEIGHT}
                        />
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <button
                            onClick={() => window.location.reload()}
                            disabled={detectorState.isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {detectorState.isLoading
                                ? "Initializing..."
                                : "Reset"}
                        </button>
                        {detectorState.currentEmotion && (
                            <span className="text-sm text-gray-600">
                                Current emotion: {detectorState.currentEmotion}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Interface Section */}
            <div className="w-full md:w-1/2">
                <div className="bg-white rounded-lg shadow-md h-full">
                    <div className="p-4 flex flex-col h-[600px]">
                        {/* {detectorState.error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{detectorState.error}</AlertDescription>
                            </Alert>
                        )} */}

                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto mb-4 space-y-4 scroll-smooth"
                        >
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-lg ${
                                            message.sender === "user"
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        <p className="break-words">
                                            {message.text}
                                        </p>
                                        {message.emotion && (
                                            <p className="text-xs mt-1 opacity-75">
                                                {message.sender === "user"
                                                    ? "Detected"
                                                    : "Response"}{" "}
                                                emotion: {message.emotion}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) =>
                                    setInputMessage(e.target.value)
                                }
                                placeholder="Type your message..."
                                disabled={
                                    isSending || !detectorState.isInitialized
                                }
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                aria-label="Chat message input"
                            />
                            <button
                                type="submit"
                                disabled={
                                    isSending || !detectorState.isInitialized
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                aria-label="Send message"
                            >
                                {isSending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MessageSquare className="w-4 h-4" />
                                )}
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Utility functions
const getBoundingBox = (
    landmarks: { x: number; y: number; z: number }[],
    canvas: HTMLCanvasElement,
) => {
    const minX = Math.min(...landmarks.map((l) => l.x));
    const minY = Math.min(...landmarks.map((l) => l.y));
    const maxX = Math.max(...landmarks.map((l) => l.x));
    const maxY = Math.max(...landmarks.map((l) => l.y));

    const padding = 0.1;
    const width = (maxX - minX) * (1 + padding);
    const height = (maxY - minY) * (1 + padding);
    const x = minX - width * padding * 0.5;
    const y = minY - height * padding * 0.5;

    return {
        x: x * canvas.width,
        y: y * canvas.height,
        width: width * canvas.width,
        height: height * canvas.height,
    };
};

const extractFaceRegion = (
    image: HTMLVideoElement | HTMLCanvasElement,
    box: { x: number; y: number; width: number; height: number },
) => {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");

    if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(
            image,
            box.x,
            box.y,
            box.width,
            box.height,
            0,
            0,
            canvas.width,
            canvas.height,
        );
    }

    return canvas;
};

const drawEmotionLabel = (
    ctx: CanvasRenderingContext2D,
    box: { x: number; y: number },
    emotion: string,
) => {
    ctx.save();
    ctx.font = "18px sans-serif";

    const label = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    const metrics = ctx.measureText(label);
    const padding = 5;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(box.x, box.y - 30, metrics.width + padding * 2, 24);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(label, box.x + padding, box.y - 12);
    ctx.restore();
};
