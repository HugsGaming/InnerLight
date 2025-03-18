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
    MessageCircle,
} from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// For serialization support
class L2 {
    static className = "L2";

    constructor(config: any) {
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
    showFeedback?: boolean;
    feedback?: "helpful" | "unhelpful" | null;
    feedbackComment?: string;
}

interface ChatResponse {
    response: string;
    emotion: string;
    messageId: string;
}

interface EmotionDetectorState {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    currentEmotion: string | null;
    confidence: number;
}

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

const createEmotionLogger = (
    supabase: any,
): EmotionLogger => {
    const queue: EmotionLog[] = [];
    let isProcesing = false;

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

        isProcesing = true;
        const batch = queue.splice(0, 10);

        try {
            const { error } = await supabase.from("emotion_logs").insert(batch);

            if (error) {
                console.error("Error batch logging emotions:", error);
                queue.unshift(...batch);
            }
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

// Utility functions for face detection
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

export default function AdaptiveChat() {
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
    const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [showFeedbackComment, setShowFeedbackComment] = useState(false);

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

    const emotionLogger = createEmotionLogger(supabase);

    const logEmotion = async (emotion: Emotion, confidence: number) => {
        try {
            const now = Date.now();
            if (now - lastLogTimeRef.current < 1000) return;
            lastLogTimeRef.current = now;

            const emotionLog: EmotionLog = {
                user_id: userIdRef.current!,
                emotion,
                confidence,
                timestamp: new Date().toISOString(),
                session_id: sessionId.current,
                page_path: window.location.pathname,
            };

            await emotionLogger.logEmotion(emotionLog);
        } catch (error) {
            console.error("Error in logEmotion", error);
        }
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

            if (EMOTIONS.includes(emotion as Emotion)) {
                await logEmotion(emotion as Emotion, confidence);
            }
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
        // Convert the existing messages to the format expected by the API
        const messageHistory = messages.map(msg => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text
        }));

        // Add the current message
        messageHistory.push({ role: "user", content: userMessage });

        // Limit history to the most recent 10 messages to prevent overly large requests
        const recentMessageHistory = messageHistory.slice(-10);

        const response = await fetch("/api/adaptiveAI", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: recentMessageHistory, // Send the conversation history, not just the current message
                emotion,
                emotionalContext:
                    EMOTIONAL_CONTEXTS[emotion as Emotion] ||
                    EMOTIONAL_CONTEXTS.neutral,
                userId: userIdRef.current
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to generate response");
        }

        return response.json();
    };

    const submitFeedback = async (messageId: string, helpful: boolean, comment?: string) => {
        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userIdRef.current,
                    messageId,
                    helpful,
                    comments: comment
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit feedback");
            }

            return await response.json();
        } catch (error) {
            console.error("Error submitting feedback:", error);
            throw error;
        }
    };

    const handleFeedback = async (messageId: string, isHelpful: boolean) => {
        try {
            // Update message with feedback
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === messageId 
                        ? { 
                            ...msg, 
                            feedback: isHelpful ? "helpful" : "unhelpful",
                            showFeedback: !isHelpful // Only show comment form if feedback is negative
                          } 
                        : msg
                )
            );

            // If positive feedback, submit immediately
            if (isHelpful) {
                await submitFeedback(messageId, true);
                toast.success("Thanks for your feedback!");
            } else {
                // For negative feedback, show comment form
                setFeedbackMessageId(messageId);
                setShowFeedbackComment(true);
            }
        } catch (error) {
            toast.error("Failed to submit feedback. Please try again.");
        }
    };

    const handleSubmitFeedbackComment = async () => {
        if (!feedbackMessageId) return;
        
        try {
            await submitFeedback(feedbackMessageId, false, feedbackComment);
            
            // Update message state
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === feedbackMessageId
                        ? { 
                            ...msg, 
                            feedbackComment,
                            showFeedback: false 
                          } 
                        : msg
                )
            );
            
            // Reset feedback state
            setFeedbackMessageId(null);
            setFeedbackComment("");
            setShowFeedbackComment(false);
            
            toast.success("Thanks for your feedback!");
        } catch (error) {
            toast.error("Failed to submit feedback comment. Please try again.");
        }
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
                    id: response.messageId || `${messageId}-response`,
                    text: response.response,
                    sender: "bot",
                    emotion: response.emotion,
                    timestamp: Date.now(),
                    showFeedback: true, // Enable feedback for bot messages
                },
            ]);
        } catch (error) {
            setDetectorState((prev) => ({
                ...prev,
                error: "Failed to generate response",
            }));
            toast.error("Failed to get a response. Please try again.");
        } finally {
            setIsSending(false);
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
                    toast.error("Error getting user: " + userError?.message);
                    return;
                }

                userIdRef.current = user.id;

                const model = await initializeModel();
                modelRef.current = model;

                const faceLandmarkerInitialized = await initializeFaceLandmarker();
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
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Start/stop speech recognition
    const startListening = () => {
        if (!("webkitSpeechRecognition" in window)) {
            toast.error("Speech recognition not supported in your browser");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputMessage(transcript);
        };
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            toast.error(`Speech recognition error: ${event.error}`);
        };
        recognition.onend = () => setIsListening(false);

        recognition.start();
        recognitionRef.current = recognition;
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-4">
            {/* Video Feed Section */}
            <div className="w-full md:w-1/2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                    <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
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
                        
                        {detectorState.error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center">
                                <div className="flex flex-col items-center">
                                    <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                                    <p>{detectorState.error}</p>
                                </div>
                            </div>
                        )}
                        
                        {detectorState.isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <p>Initializing...</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <button
                            onClick={() => window.location.reload()}
                            disabled={detectorState.isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {detectorState.isLoading ? "Initializing..." : "Reset"}
                        </button>
                        {detectorState.currentEmotion && (
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Current emotion: {detectorState.currentEmotion} 
                                ({(detectorState.confidence * 100).toFixed(1)}%)
                            </span>
                        )}
                    </div>
                    <p className="text-red-500 text-sm mt-2">
                        Required: Camera Permission to use Adaptive Chatbot
                    </p>
                </div>
            </div>
            
            {/* Chat Interface Section */}
            <div className="w-full md:w-1/2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full">
                    <div className="p-4 flex flex-col h-[600px]">
                        <div className="mb-4 border-b pb-2">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-green-500" />
                                Adaptive Chat Assistant
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Your emotionally-aware AI that learns from each interaction
                            </p>
                        </div>
                        
                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto mb-4 space-y-4 scroll-smooth"
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-center">
                                    <div>
                                        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p>Send a message to start chatting with the adaptive AI assistant</p>
                                        <p className="text-sm mt-2">Your emotions will be detected to provide personalized responses</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className="flex flex-col max-w-[80%]">
                                            <div
                                                className={`p-3 rounded-lg ${
                                                    message.sender === "user"
                                                        ? "bg-green-500 text-white"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                                                }`}
                                            >
                                                <p className="break-words">{message.text}</p>
                                                {message.emotion && (
                                                    <p className="text-xs mt-1 opacity-75">
                                                        {message.sender === "user" ? "Detected" : "Response"}{" "}
                                                        emotion: {message.emotion}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {/* Feedback buttons for AI responses */}
                                            {message.sender === "bot" && message.showFeedback && (
                                                <div className="flex mt-1 ml-1">
                                                    {!message.feedback ? (
                                                        <>
                                                            <button 
                                                                onClick={() => handleFeedback(message.id, true)}
                                                                className="text-xs flex items-center gap-1 mr-2 text-gray-500 hover:text-green-500"
                                                            >
                                                                <ThumbsUp size={12} /> Helpful
                                                            </button>
                                                            <button 
                                                                onClick={() => handleFeedback(message.id, false)}
                                                                className="text-xs flex items-center gap-1 text-gray-500 hover:text-red-500"
                                                            >
                                                                <ThumbsDown size={12} /> Not helpful
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">
                                                            {message.feedback === "helpful" ? 
                                                                "✓ Marked as helpful" : 
                                                                "✓ Marked as not helpful"}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Feedback comment form */}
                                            {message.sender === "bot" && 
                                             message.feedback === "unhelpful" && 
                                             message.showFeedback && (
                                                <div className="mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        How could the response be improved?
                                                    </p>
                                                    <div className="flex">
                                                        <input
                                                            type="text"
                                                            value={feedbackComment}
                                                            onChange={(e) => setFeedbackComment(e.target.value)}
                                                            className="flex-1 text-xs p-1 border rounded"
                                                            placeholder="What would have been more helpful?"
                                                        />
                                                        <button
                                                            onClick={handleSubmitFeedbackComment}
                                                            className="ml-1 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                                                        >
                                                            Send
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type your message..."
                                disabled={isSending}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                aria-label="Chat message input"
                            />

                            {/* Speech-to-Text Button */}
                            <button
                                type="button"
                                onClick={startListening}
                                disabled={isListening}
                                className={`p-2 rounded-md ${
                                    isListening
                                        ? "bg-red-500 text-white"
                                        : "bg-blue-500 text-white hover:bg-blue-600"
                                } transition-colors`}
                                aria-label="Voice input"
                            >
                                <Mic className="w-5 h-5" />
                            </button>

                            {/* Send Button */}
                            <button
                                type="submit"
                                disabled={isSending || !inputMessage.trim()}
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
};