"use client";

import { type Message } from "ai/react";
import { useAssistant } from "@ai-sdk/react";
import React, { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import * as faceapi from "face-api.js";
import FaceDetection from "../components/FaceDetection";

export default function Page() {
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
        <>
            <FaceDetection />
            <div className="">
                {messages.map((m: Message) => (
                    <div
                        key={m.id}
                        className="flex flex-col gap-1 border-b p-2"
                    >
                        <strong>{`${m.role}: `}</strong>
                        {m.role !== "data" && <Markdown>{m.content}</Markdown>}
                        {m.role === "data" && (
                            <>
                                {(m.data as any).description}
                                <br />
                                <pre className="bg-amber-300">
                                    {JSON.stringify(m.data, null, 2)}
                                </pre>
                            </>
                        )}
                    </div>
                ))}

                {status === "in_progress" && <div />}

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
        </>
    );
}
