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
    Mic,
    ThumbsUp,
    ThumbsDown,
    BarChart2,
} from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";

// Register L2 regularization for model loading
class L2 {
    static className = "L2";

    // @ts-ignore
    constructor(config) {
        return tf.regularizers.l2(config);
    }
}
// @ts-ignore
tf.serialization.registerClass(L2);

// Types
interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    emotion: string | null;
    timestamp: number;
    interactionId?: string;
    feedbackGiven?: boolean;
}

interface ChatResponse {
    response: string;
    emotion: string;
    contextUsed?: string;
}

interface EmotionDetectorState {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    currentEmotion: string | null;
    confidence: number;
}

// Constants
const EMOTIONS = [
    "angry",
    "disgust",
    "fear",
    "happy",
    "sad",
    "surprise",
    "neutral",
] as const;

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

export default function AdaptiveEmotionChat() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const faceLandmarkerRef = useRef<any>(null);
    const drawingUtilsRef = useRef<any>(null);
    const emotionBufferRef = useRef<string[]>([]);
    const lastVideoTimeRef = useRef<number>(-1);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const modelRef = useRef<tf.LayersModel | null>(null);
    const lastLogTimeRef = useRef<number>(0);
    const sessionId = useRef<string>(uuidv4());
    const userIdRef = useRef<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    
    const [emotionHistory, setEmotionHistory] = useState<{emotion: string, timestamp: string}[]>([]);
    const [showEmotionInsights, setShowEmotionInsights] = useState(false);
    const [emotionStats, setEmotionStats] = useState<{
        emotion: string;
        count: number;
        percentage: number;
    }[]>([]);

    const [detectorState, setDetectorState] = useState<EmotionDetectorState>({
        isInitialized: false,
        isLoading: false,
        error: null,
        currentEmotion: null,
        confidence: 0,
    });
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState<string>("");
    const [isSending, setIsSending] = useState<boolean>(false);

    const supabase = createClient();

    const EMOTION_BUFFER_SIZE = 5;

    // Start speech recognition
    const startListening = () => {
        if (!("webkitSpeechRecognition" in window)) {
            alert("Speech Recognition is not supported in your browser.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: {
            results: { transcript: any }[][];
        }) => {
            const transcript = event.results[0][0].transcript;
            setInputMessage(transcript);
        };
        recognition.onerror = () => alert("Error with speech recognition.");
        recognition.onend = () => setIsListening(false);

        recognition.start();
        recognitionRef.current = recognition;
    };

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
        async (emotion: string, confidence: number) => {
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
                confidence,
            }));

            // Update emotion history for adaptive learning
            const timestamp = new Date().toISOString();
            setEmotionHistory(prevHistory => {
                const newHistory = [...prevHistory, { emotion, timestamp }];
                
                // Update emotion statistics
                const emotionCounts: Record<string, number> = {};
                newHistory.forEach(entry => {
                    emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
                });
                
                const totalEmotions = newHistory.length;
                const stats = Object.entries(emotionCounts).map(([emotion, count]) => ({
                    emotion,
                    count,
                    percentage: (count / totalEmotions) * 100
                }));
                
                setEmotionStats(stats.sort((a, b) => b.count - a.count));
                
                // Keep last 50 emotions to avoid overwhelming memory
                return newHistory.slice(-50);
            });

            // Log emotion for tracking (rate-limited)
            if (EMOTIONS.includes(emotion as any)) {
                const now = Date.now();
                if (now - lastLogTimeRef.current > 1000) {
                    lastLogTimeRef.current = now;
                    
                    try {
                        await supabase.from("emotion_logs").insert({
                            user_id: userIdRef.current!,
                            emotion,
                            confidence,
                            timestamp,
                            session_id: sessionId.current,
                            page_path: window.location.pathname,
                        });
                    } catch (error) {
                        console.warn("Failed to log emotion:", error);
                    }
                }
            }
        },
        [getMostFrequentEmotion, supabase],
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
    ): Promise<{ emotion: string; confidence: number } | null> => {
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

                const maxIndex = predictionArray.indexOf(
                    Math.max(...predictionArray),
                );

                tensor.dispose();
                resolve({
                    emotion: EMOTIONS[maxIndex],
                    confidence: predictionArray[maxIndex],
                });
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

                    if (faceImage) {
                        const result = await detectEmotion(faceImage);
                        if (result) {
                            const { emotion, confidence } = result;
                            await updateEmotionState(emotion, confidence);
                            drawEmotionLabel(
                                ctx,
                                boundingBox,
                                `${emotion} (${(confidence * 100).toFixed(1)}%)`,
                            );
                        }
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
        const response = await fetch("/api/enhancedAI", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", content: userMessage }],
                emotion,
                sessionId: sessionId.current,
                emotionHistory: emotionHistory,
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

            const interactionId = uuidv4();
            setMessages((prev) => [
                ...prev,
                {
                    id: `${messageId}-response`,
                    text: response.response,
                    sender: "bot",
                    emotion: response.emotion,
                    timestamp: Date.now(),
                    interactionId,
                    feedbackGiven: false
                },
            ]);

            // Automatically scroll to the latest message
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 100);

        } catch (error) {
            setDetectorState((prev) => ({
                ...prev,
                error: "Failed to generate response",
            }));
            toast.error("Failed to generate response");
        } finally {
            setIsSending(false);
        }
    };

    const submitFeedback = async (messageId: string, score: number) => {
        try {
            const message = messages.find(m => m.id === messageId);
            if (!message || !message.interactionId) return;

            // Send feedback to API
            await fetch("/api/enhancedAI", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interactionId: message.interactionId,
                    feedbackScore: score,
                }),
            });

            // Update message to show feedback was given
            setMessages(prevMessages => 
                prevMessages.map(m => 
                    m.id === messageId ? {...m, feedbackGiven: true} : m
                )
            );

            toast.success("Thank you for your feedback!");
        } catch (error) {
            console.error("Error submitting feedback:", error);
            toast.error("Failed to submit feedback");
        }
    };

    const initializeModel = async (): Promise<tf.LayersModel> => {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Starting model initialization...");

                const modelConfig = {
                    strict: false,
                };

                const model = await tf.loadLayersModel(
                    "/emotion_model_js/model.json",
                    modelConfig,
                );
                console.log("Model loaded successfully.");

                model.compile({
                    optimizer: tf.train.adam(),
                    loss: "categoricalCrossentropy",
                    metrics: ["accuracy"],
                });

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
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();
                if (userError || !user) {
                    toast.error("Error Getting user: " + userError?.message);
                    return;
                }

                userIdRef.current = user.id;

                const model = await initializeModel();
                console.log("Assigned model:", model);

                modelRef.current = model;

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
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {detectorState.isLoading
                                ? "Initializing..."
                                : "Reset"}
                        </button>
                        {detectorState.currentEmotion && (
                            <span className="text-sm text-gray-600">
                                Current emotion: {detectorState.currentEmotion}(
                                {(detectorState.confidence * 100).toFixed(1)}%)
                            </span>
                        )}
                        <button
                            onClick={() => setShowEmotionInsights(!showEmotionInsights)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                            <BarChart2 className="w-4 h-4" />
                            {showEmotionInsights ? "Hide" : "Show"} Insights
                        </button>
                    </div>
                    <p className="text-red-500 text-sm mt-2">
                        Required: Camera Permission to use Chatbot
                    </p>
                    
                    {/* Emotion Insights Panel */}
                    {showEmotionInsights && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Emotion Insights</h3>
                            <p className="text-sm mb-4">Based on your recent emotional patterns:</p>
                            
                            <div className="space-y-2">
                                {emotionStats.map(stat => (
                                    <div key={stat.emotion} className="flex flex-col">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="capitalize">{stat.emotion}</span>
                                            <span>{stat.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div 
                                                className="bg-blue-600 h-2.5 rounded-full" 
                                                style={{ width: `${stat.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {emotionStats.length > 0 && (
                                <div className="mt-4 text-sm">
                                    <p>Primary emotion: <span className="font-semibold capitalize">{emotionStats[0].emotion}</span></p>
                                    {emotionStats.length > 1 && (
                                        <p>Secondary emotion: <span className="font-semibold capitalize">{emotionStats[1].emotion}</span></p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Chat Interface Section */}
            <div className="w-full md:w-1/2">
                <div className="bg-white rounded-lg shadow-md h-full">
                    <div className="p-4 flex flex-col h-[600px]">
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
                                                ? "bg-green-500 text-white"
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
                                        
                                        {/* Feedback buttons for AI responses */}
                                        {message.sender === "bot" && !message.feedbackGiven && (
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button 
                                                    onClick={() => submitFeedback(message.id, 5)}
                                                    className="p-1 rounded-full hover:bg-green-100"
                                                    title="Helpful"
                                                >
                                                    <ThumbsUp className="w-4 h-4 text-green-500" />
                                                </button>
                                                <button 
                                                    onClick={() => submitFeedback(message.id, 1)}
                                                    className="p-1 rounded-full hover:bg-red-100"
                                                    title="Not Helpful"
                                                >
                                                    <ThumbsDown className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        )}
                                        {message.sender === "bot" && message.feedbackGiven && (
                                            <div className="flex justify-end mt-2">
                                                <span className="text-xs text-gray-500">Feedback received</span>
                                            </div>
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
                                disabled={isSending}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed dark:text-black"
                                aria-label="Chat message input"
                            />

                            {/* Speech-to-Text Button */}
                            <button
                                type="button"
                                onClick={startListening}
                                className={`p-2 rounded-md ${
                                    isListening
                                        ? "bg-red-500 text-white"
                                        : "bg-blue-500 text-white"
                                } hover:bg-blue-600 transition-colors`}
                                aria-label="Voice input"
                            >
                                <Mic className="w-5 h-5" />
                            </button>

                            {/* Send Button */}
                            <button
                                type="submit"
                                disabled={isSending}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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