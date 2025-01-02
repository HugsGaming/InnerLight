"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@mediapipe/face_mesh";
import * as camera_utils from "@mediapipe/camera_utils";
import * as drawing_utils from "@mediapipe/drawing_utils";
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
    const cameraRef = useRef<camera_utils.Camera | null>(null);

    const [emotionModel, setEmotionModel] = useState<tf.LayersModel | null>(
        null,
    );
    const [faceMeshModel, setFaceMeshModel] =
        useState<facemesh.FaceMesh | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

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

    // Emotional context prompts to guide the AI responses
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

    const loadModels = async () => {
        setIsLoading(true);
        try {
            // Load your emotion detection model
            const model = await tf.loadLayersModel(
                "/emotion_model_js/model.json",
            );
            setEmotionModel(model);
            console.log("Model loaded.", model);

            // Initialize FaceMesh
            const faceMesh = new facemesh.FaceMesh({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                },
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            faceMesh.onResults(onResults);
            setFaceMeshModel(faceMesh);
            console.log("FaceMesh model loaded.", faceMesh);
            setIsInitialized(true);
        } catch (error) {
            console.error("Error loading models.", error);
            setIsInitialized(false);
        } finally {
            setIsLoading(false);
        }
    };

    const resetAll = async () => {
        // Stop camera if running
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }

        // Reset states
        setIsInitialized(false);
        setEmotionModel(null);
        setFaceMeshModel(null);

        // Reload models and restart camera
        await loadModels();
    };

    useEffect(() => {
        loadModels();

        return () => {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            setIsInitialized(false);
        };
    }, []);

    useEffect(() => {
        if (!isInitialized || !faceMeshModel || !videoRef.current) {
            console.log("Camera prerequisites not met:", {
                isInitialized,
                hasFaceMesh: !!faceMeshModel,
                hasVideo: !!videoRef.current,
            });
            return;
        }

        const setupCamera = async () => {
            try {
                if (!cameraRef.current) {
                    console.log("Initializing camera...");
                    cameraRef.current = new camera_utils.Camera(
                        videoRef.current!,
                        {
                            onFrame: async () => {
                                if (
                                    videoRef.current &&
                                    faceMeshModel &&
                                    emotionModel
                                ) {
                                    try {
                                        await faceMeshModel.send({
                                            image: videoRef.current,
                                        });
                                    } catch (error) {
                                        console.error(
                                            "Error processing frame:",
                                            error,
                                        );
                                    }
                                }
                            },
                            width: 640,
                            height: 480,
                        },
                    );
                    console.log("Starting camera...");
                    await cameraRef.current.start();
                    console.log("Camera started succe");
                }
            } catch (error) {
                console.error("Error setting up camera:", error);
            }
        };

        setupCamera();
    }, [faceMeshModel, isInitialized, emotionModel]);

    const onResults = async (results: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        try {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the webcam frame
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            if (results.multiFaceLandmarks && emotionModel) {
                for (const landmarks of results.multiFaceLandmarks) {
                    drawing_utils.drawConnectors(
                        ctx,
                        landmarks,
                        facemesh.FACEMESH_TESSELATION,
                        { color: "#C0C0C070", lineWidth: 1 },
                    );

                    // Get bounding box of face
                    const boundingBox = getBoundingBox(landmarks);
                    const faceImage = extractFaceRegion(
                        results.image,
                        boundingBox,
                    );
                    const emotion = await detectEmotion(faceImage);

                    if (emotion) {
                        setCurrentEmotion(emotion);
                        // Draw emotion label
                        ctx.fillStyle = "#FF0000";
                        ctx.font = "24px sans-serif";
                        ctx.fillText(
                            emotion,
                            boundingBox.x,
                            boundingBox.y - 10,
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Error in onResults:", error);
        } finally {
            ctx.restore();
        }
    };

    // Detect emotion from face image
    const detectEmotion = async (faceImage: any) => {
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

    const getBoundingBox = (landmarks: any) => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        landmarks.forEach((landmark: any) => {
            minX = Math.min(minX, landmark.x);
            minY = Math.min(minY, landmark.y);
            maxX = Math.max(maxX, landmark.x);
            maxY = Math.max(maxY, landmark.y);
        });

        return {
            x: minX * canvasRef.current!.width,
            y: minY * canvasRef.current!.height,
            width: (maxX - minX) * canvasRef.current!.width,
            height: (maxY - minY) * canvasRef.current!.height,
        };
    };

    const extractFaceRegion = (image: any, box: any) => {
        const canvas = document.createElement("canvas");
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext("2d");

        ctx?.drawImage(
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

        return canvas;
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-4">
            {/* Video Feed */}
            <div className="w-full md:w-1/2">
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4">
                        <video
                            ref={videoRef}
                            className="hidden"
                            width="640"
                            height="480"
                            playsInline
                        />
                        <canvas
                            ref={canvasRef}
                            className="w-full h-auto border-2 border-gray-300 rounded-lg"
                            width="640"
                            height="480"
                        />
                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={() => resetAll()}
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
        </div>
    );
}
