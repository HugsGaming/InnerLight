"use client";
import React, { FormEvent, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@mediapipe/face_mesh";
import * as camera_utils from "@mediapipe/camera_utils";
import * as drawing_utils from "@mediapipe/drawing_utils";
import { Camera, MessageSquare, Loader2 } from "lucide-react";
import { FaComments } from "react-icons/fa";
import { toast } from "react-toastify";

interface Message {
    text: string;
    sender: string;
    emotion: string | null;
}

interface ChatResponse {
    response: string;
    emotion: string;
}

export default function NewButtonAi() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cameraRef = useRef<camera_utils.Camera | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const emotions = [
        "angry",
        "disgust",
        "fear",
        "happy",
        "sad",
        "surprise",
        "neutral",
    ];

    const emotionalContexts = {
        angry: "The user seems angry or frustrated. Respond with empathy and help de-escalate the situation.",
        happy: "The user appears happy and positive. Match their upbeat energy while maintaining a natural conversation flow.",
        sad: "The user seems sad or down. Show empathy and understanding. Offer emotional support.",
        neutral:
            "The user appears neutral. Maintain a balanced and engaged conversation.",
        fear: "The user shows signs of anxiety or fear. Provide reassurance and support.",
        disgust:
            "The user appears disgusted or disapproving. Address their concerns constructively.",
        surprise:
            "The user seems surprised. Explore their reaction with curiosity.",
    };

    // Toggle modal and handle camera
    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
        if (!isModalOpen) {
            loadModels();
        } else {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
        }
    };

    const generateResponse = async (
        userMessage: string,
        emotion: string,
    ): Promise<ChatResponse> => {
        try {
            const response = await fetch("/api/newAI", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: userMessage }],
                    emotion,
                    emotionalContext:
                        emotionalContexts[
                            emotion as keyof typeof emotionalContexts
                        ],
                }),
            });

            if (!response.ok) throw new Error("Failed to Generate Response");
            return await response.json();
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
            const userMessage = {
                text: inputMessage,
                sender: "user",
                emotion: currentEmotion,
            };
            setMessages((prev) => [...prev, userMessage]);
            setInputMessage("");

            const emotion = currentEmotion || "neutral";
            const response = await generateResponse(inputMessage, emotion);

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
        } catch (error) {
            toast.error("Error generating response");
            setIsSending(false);
        }
    };

    // Model loading and initialization logic
    const loadModels = async () => {
        setIsLoading(true);
        try {
            const model = await tf.loadLayersModel(
                "/emotion_model_js/model.json",
            );
            setEmotionModel(model);

            const faceMesh = new facemesh.FaceMesh({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            faceMesh.onResults(onResults);
            setFaceMeshModel(faceMesh);
            setIsInitialized(true);
        } catch (error) {
            console.error("Error loading models:", error);
            setIsInitialized(false);
        } finally {
            setIsLoading(false);
        }
    };

    const resetCamera = async () => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        setIsInitialized(false);
        setEmotionModel(null);
        setFaceMeshModel(null);
        await loadModels();
    };

    // Camera setup effect
    useEffect(() => {
        if (
            !isInitialized ||
            !faceMeshModel ||
            !videoRef.current ||
            !isModalOpen
        )
            return;

        const setupCamera = async () => {
            try {
                if (!cameraRef.current) {
                    cameraRef.current = new camera_utils.Camera(
                        videoRef.current!,
                        {
                            onFrame: async () => {
                                if (
                                    videoRef.current &&
                                    faceMeshModel &&
                                    emotionModel
                                ) {
                                    await faceMeshModel.send({
                                        image: videoRef.current,
                                    });
                                }
                            },
                            width: 640,
                            height: 480,
                        },
                    );
                    await cameraRef.current.start();
                }
            } catch (error) {
                console.error("Error setting up camera:", error);
            }
        };

        setupCamera();
    }, [faceMeshModel, isInitialized, emotionModel, isModalOpen]);

    // Face detection and emotion recognition logic
    const onResults = async (results: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;

        try {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            if (results.multiFaceLandmarks && emotionModel) {
                for (const landmarks of results.multiFaceLandmarks) {
                    drawing_utils.drawConnectors(
                        ctx,
                        landmarks,
                        facemesh.FACEMESH_TESSELATION,
                        {
                            color: "#C0C0C070",
                            lineWidth: 1,
                        },
                    );

                    const boundingBox = getBoundingBox(landmarks);
                    const faceImage = extractFaceRegion(
                        results.image,
                        boundingBox,
                    );
                    const emotion = await detectEmotion(faceImage);

                    if (emotion) {
                        setCurrentEmotion(emotion);
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
        let minX = Infinity,
            minY = Infinity;
        let maxX = -Infinity,
            maxY = -Infinity;

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
        <div className="relative flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-700 text-black dark:text-white">
            <button
                onClick={toggleModal}
                className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none"
            >
                <FaComments size={24} />
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
                        <div className="p-4 flex justify-between items-center border-b">
                            <h2 className="text-2xl font-semibold">
                                Emotion Detection Chat
                            </h2>
                            <button
                                onClick={toggleModal}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4 flex flex-col md:flex-row gap-4 h-[600px]">
                            {/* Video Feed */}
                            <div className="w-full md:w-1/2">
                                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                    <video
                                        ref={videoRef}
                                        className="hidden"
                                        width="640"
                                        height="480"
                                        playsInline
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full h-auto rounded-lg"
                                        width="640"
                                        height="480"
                                    />
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={resetCamera}
                                            disabled={isLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                                        >
                                            <Camera className="w-4 h-4" />
                                            {isLoading
                                                ? "Resetting..."
                                                : "Reset Camera"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Interface */}
                            <div className="w-full md:w-1/2 flex flex-col">
                                <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                    {messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-lg ${
                                                    message.sender === "user"
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                                                }`}
                                            >
                                                <p>{message.text}</p>
                                                {message.emotion && (
                                                    <p className="text-xs mt-1 opacity-75">
                                                        Emotion:{" "}
                                                        {message.emotion}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="flex gap-2"
                                >
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) =>
                                            setInputMessage(e.target.value)
                                        }
                                        placeholder="Type your message..."
                                        disabled={isSending}
                                        className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSending}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-400"
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
            )}
        </div>
    );
}
