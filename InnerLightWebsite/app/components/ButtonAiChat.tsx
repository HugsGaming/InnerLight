"use client";
import { type Message } from "ai/react";
import { useAssistant } from "@ai-sdk/react";
import React, { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import FaceDetection from "../components/FaceDetection";
import { FaComments } from "react-icons/fa";

const ButtonAiChat: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    const {
        status,
        messages,
        input,
        submitMessage,
        handleInputChange,
        append,
    } = useAssistant({
        api: "/api/chatbot",
    });

    return (
        <div className="relative flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-700 text-black dark:text-white">
            <div className="flex-grow"></div>

            <button
                onClick={toggleModal}
                className="fixed bottom-4 right-4 bg-yellow-950 text-white p-4 rounded-full shadow-lg hover:bg-yellow-600 focus:outline-none"
            >
                <FaComments size={24} />
            </button>
            {isModalOpen && (
                <div className="fixed bottom-4 right-4 bg-yellow-950 dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full md:w-1/3 lg:w-1/4 h-65 z-50 flex flex-col">
                    <button
                        onClick={toggleModal}
                        className="absolute top-2 right-2 text-white dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                    >
                        &times;
                    </button>
                    <h2 className="text-2xl mb-4 text-white">
                        AI Chatbox & Emotion Detection
                    </h2>
                    <div className="flex flex-col flex-grow justify-end">
                        <div className=" p-2">
                            {/* Camera component */}
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg h-64">
                                <div className="mb-2">
                                    Camera for Emotion Detection
                                    <FaceDetection />
                                </div>
                            </div>
                        </div>
                        <div className="p-2">
                            {/* AI Chatbox component */}
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg h-32 overflow-y-auto flex flex-col">
                                <div className="mb-2">AI Chatbox</div>
                                <div className="flex-grow">
                                    {messages.map((m: Message) => (
                                        <div
                                            key={m.id}
                                            className="flex flex-col gap-1 border-b p-2"
                                        >
                                            <strong>{`${m.role}: `}</strong>
                                            {m.role !== "data" && (
                                                <Markdown>{m.content}</Markdown>
                                            )}
                                            {m.role === "data" && (
                                                <>
                                                    {
                                                        (m.data as any)
                                                            .description
                                                    }
                                                    <br />
                                                    <pre className="bg-amber-300">
                                                        {JSON.stringify(
                                                            m.data,
                                                            null,
                                                            2,
                                                        )}
                                                    </pre>
                                                </>
                                            )}
                                        </div>
                                    ))}

                                    {status === "in_progress" && <div />}
                                </div>
                                <form
                                    onSubmit={submitMessage}
                                    className="flex flex-row gap-2 p-2 bg-zinc-100 w-full"
                                >
                                    <input
                                        className="bg-zinc-100 w-full p-2 outline-none"
                                        disabled={status != "awaiting_message"}
                                        value={input}
                                        placeholder="Type a message"
                                        onChange={handleInputChange}
                                    />
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ButtonAiChat;
