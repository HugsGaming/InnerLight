"use client";

import React, {
    FormEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import * as tf from "@tensorflow/tfjs";
import {
    FaceLandmarker,
    FilesetResolver,
    DrawingUtils,
} from "@mediapipe/tasks-vision";
import { Camera, MessageSquare, Loader2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
interface Message {
    text: string;
    sender: string;
    emotion: string | null;
}

interface ChatResponse {
    response: string;
    emotion: string;
}

export default function NewEmotionDetectionChat() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const drawingUtilsRef = useRef<DrawingUtils | null>(null);

    const lastEmotionUpdate = useRef<number>(0);
    const emotionBuffer = useRef<string[]>([]);
    const EMOTION_UPDATE_INTERVAL = 500;
    const EMOTION_BUFFER_SIZE = 5;

    const [emotionModel, setEmotionModel] = useState<tf.LayersModel | null>(
        null,
    );
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const emotions = [
        "angry",
        "disgust",
        "fear",
        "happy",
        "sad",
        "surprise",
        "neutral",
    ];

    const getMostFrequentEmotion = (emotionArr: string[]) => {
        const counts = emotionArr.reduce(
            (acc: Record<string, number>, emotion) => {
                acc[emotion] = (acc[emotion] || 0) + 1;
                return acc;
            },
            {},
        );
        return Object.entries(counts).reduce((a, b) =>
            a[1] > b[1] ? a : b,
        )[0];
    };

    const updateEmotion = useCallback((emotion: string) => {
        const now = Date.now();
        emotionBuffer.current.push(emotion);
        if (emotionBuffer.current.length > EMOTION_BUFFER_SIZE) {
            emotionBuffer.current.shift();
        }

        if (now - lastEmotionUpdate.current >= EMOTION_UPDATE_INTERVAL) {
            const stableEmotion = getMostFrequentEmotion(emotionBuffer.current);
            setCurrentEmotion(stableEmotion);
            lastEmotionUpdate.current = now;
        }
    }, []);

    // Emotional context prompts remain the same
    const emotionalContexts = {
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

    const generateResponse = async (
        userMessage: string,
        emotion: string,
    ): Promise<ChatResponse> => {
        try {
            const response = await fetch("/api/newAI", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [{ role: "user", content: userMessage }],
                    emotion,
                    emotionalContext:
                        emotionalContexts[
                            emotion as keyof typeof emotionalContexts
                        ],
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to Generate Response");
            }

            const data = await response.json();
            return data as ChatResponse;
        } catch (error) {
            console.error("Error generating response:", error);
            throw error;
        }
    };

    const initializeFaceLandmarker = async () => {
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
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
            drawingUtilsRef.current = new DrawingUtils(canvasRef.current.getContext("2d")!);
        }
    };

    const startVideo = async () => {
        if (!videoRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false,
            });
            videoRef.current.srcObject = stream;

            // Return a promise that resolves when the video is ready
            await new Promise((resolve, reject) => {
                if (!videoRef.current) return reject("Video element not found");

                videoRef.current.onloadedmetadata = () => {
                    videoRef.current
                        ?.play()
                        .then(() => {
                            setIsVideoPlaying(true);
                            requestAnimationFrame(predictWebcam);
                            resolve(true);
                        })
                        .catch((error) => {
                            toast.error(
                                "Failed to play video: " + error.message,
                            );
                            reject(error);
                        });
                };

                videoRef.current.onerror = (error) => {
                    toast.error("Video error: " + error);
                    reject(error);
                };
            });
        } catch (error) {
            console.error("Error accessing webcam:", error);
        }
    };

    const loadModels = async () => {
        setIsLoading(true);
        try {
            // Load emotion detection model
            const model = await tf.loadLayersModel(
                "/emotion_model_js/model.json",
            );
            setEmotionModel(model);

            if (!faceLandmarkerRef.current) await initializeFaceLandmarker();

            setIsInitialized(true);
            await startVideo();
        } catch (error) {
            console.error("Error loading models:", error);
            setIsInitialized(false);
        } finally {
            setIsLoading(false);
        }
    };

    let lastVideoTime = -1;
    const predictWebcam = async () => {
        if (
            !videoRef.current ||
            !faceLandmarkerRef.current ||
            !canvasRef.current ||
            !isVideoPlaying
        ) {
            return;
        }

        const video = videoRef.current;
        const nowInMs = Date.now();

        if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const results = faceLandmarkerRef.current.detectForVideo(
                video,
                nowInMs,
            );

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            if (!ctx) return;

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (results.faceLandmarks) {
                for (const landmarks of results.faceLandmarks) {
                    drawingUtilsRef.current?.drawConnectors(
                        landmarks,
                        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
                        { color: "#C0C0C070", lineWidth: 0.5 },
                    );

                    // Get bounding box and detect emotion
                    const boundingBox = getBoundingBox(landmarks, canvas);
                    const faceImage = extractFaceRegion(video, boundingBox);
                    const emotion = await detectEmotion(faceImage);

                    if (emotion) {
                        updateEmotion(emotion);
                        // Draw emotion label
                        const label = currentEmotion || emotion;
                        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                        ctx.fillRect(
                            boundingBox.x,
                            boundingBox.y - 30,
                            ctx.measureText(label).width + 10,
                            24,
                        );
                        ctx.fillStyle = "#FFFFFF";
                        ctx.font = "18px sans-serif";
                        ctx.fillText(
                            label,
                            boundingBox.x + 5,
                            boundingBox.y - 12,
                        );
                    }
                }
            }
            ctx.restore();
        }

        requestAnimationFrame(predictWebcam);
    };

    // Rest of the utility functions (getBoundingBox, extractFaceRegion, detectEmotion) remain the same
    const getBoundingBox = (
        landmarks: { x: number; y: number; z: number }[],
        canvas: HTMLCanvasElement,
    ) => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        landmarks.forEach((landmark) => {
            minX = Math.min(minX, landmark.x);
            minY = Math.min(minY, landmark.y);
            maxX = Math.max(maxX, landmark.x);
            maxY = Math.max(maxY, landmark.y);
        });

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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isSending) return;

        try {
            setIsSending(true);

            // Add user message
            const userMessage = {
                text: inputMessage,
                sender: "user",
                emotion: currentEmotion,
            };
            setMessages((prevMessages) => [...prevMessages, userMessage]);
            setInputMessage("");

            // Generate AI response
            const emotion = currentEmotion || "neutral";
            const response = await generateResponse(inputMessage, emotion);

            // Add AI response
            setTimeout(() => {
                setMessages((prev) => [
                    ...prev,
                    {
                        text: response.response,
                        sender: "bot",
                        emotion: response.emotion,
                    },
                ]);
                setIsSending(false);
            }, 500);
        } catch (error: any) {
            toast.error("Error generating response:", error);
            setIsSending(false);
        }
    };

    const extractFaceRegion = (
        image: HTMLVideoElement | HTMLCanvasElement,
        box: any,
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

    const detectEmotion = async (faceImage: HTMLCanvasElement) => {
        try {
            const tensor = tf.tidy(() => {
                return tf.browser
                    .fromPixels(faceImage)
                    .resizeNearestNeighbor([48, 48])
                    .mean(2)
                    .expandDims(0)
                    .expandDims(-1)
                    .div(255);
            });

            // @ts-ignore
            const prediction = await emotionModel!.predict(tensor).data();
            return emotions[prediction.indexOf(Math.max(...prediction))];
        } catch (error) {
            console.error("Error in detectEmotion:", error);
            return null;
        }
    };

    const resetAll = async () => {
        // Stop video stream if running
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }

        setIsVideoPlaying(false);
        setIsInitialized(false);
        setEmotionModel(null);
        faceLandmarkerRef.current = null;

        // Reload models and restart camera
        await loadModels();
    };

    useEffect(() => {
        loadModels();

        return () => {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
            setIsInitialized(false);
            setIsVideoPlaying(false);
        };
    }, []);

    // JSX remains largely the same
    return (
        <div className="w-full max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-4">
            {/* Video Feed */}
            <div className="w-full md:w-1/2">
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4">
                        <video
                            ref={videoRef}
                            className="absolute opacity-0 pointer-events-none"
                            width="640"
                            height="480"
                            playsInline
                            muted
                        />
                        <canvas
                            ref={canvasRef}
                            className="w-full h-auto border-2 border-gray-300 rounded-lg"
                            width="640"
                            height="480"
                        />
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={resetAll}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Camera className="w-4 h-4" />
                                {isLoading ? "Resetting..." : "Reset Camera"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="w-full md:w-1/2">
                <div className="bg-white rounded-lg shadow-md h-full">
                    <div className="p-4 flex flex-col h-[600px]">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-lg
                      ${
                          message.sender === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-800"
                      }`}
                                    >
                                        <p>{message.text}</p>
                                        {message.emotion && (
                                            <p className="text-xs mt-1 opacity-75">
                                                Detected emotion:{" "}
                                                {message.emotion}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) =>
                                    setInputMessage(e.target.value)
                                }
                                placeholder="Type your message..."
                                disabled={isSending}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            />
                            <button
                                type="submit"
                                disabled={isSending}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
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
            <ToastContainer />
        </div>
    );
}
