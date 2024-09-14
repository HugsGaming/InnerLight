import React, { useState } from "react";
import { MessageBox } from "react-chat-elements";
import "react-chat-elements/dist/main.css";

interface Message {
    id: number;
    position: "left" | "right";
    type: "text" | "photo" | "file";
    title: string;
    text?: string;
    data?: { uri: string; name?: string; size?: string };
}

interface MessagesComponentProps {
    messages: Message[];
    onSend: (message: Message) => void;
}

const MessagesComponent: React.FC<MessagesComponentProps> = ({
    messages,
    onSend,
}) => {
    const [input, setInput] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);

    const handleSend = async () => {
        if (input.trim() || file) {
            let fileUrl = "";
            if (file) {
                fileUrl = URL.createObjectURL(file);
            }
            const newMessage: Message = {
                id: messages.length + 1,
                position: "right",
                type: file ? "photo" : "text",
                title: "You",
                text: input,
                data: file
                    ? {
                          uri: fileUrl,
                          name: file.name,
                          size: `${file.size} bytes`,
                      }
                    : undefined,
            };
            onSend(newMessage);
            setInput("");
            setFile(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            if (e.shiftKey) {
                e.preventDefault();
                setInput((prevInput) => prevInput + "\n");
            } else {
                e.preventDefault();
                handleSend();
            }
        }
    };

    return (
        <div className="flex-grow flex flex-col">
            <div className="flex-grow overflow-auto mb-4 p-4 bg-white border border-gray-300 rounded-lg shadow-md">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select a chat to start messaging</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageBox
                            key={message.id}
                            position={message.position}
                            type={message.type}
                            title={message.title}
                            text={message.text || ""}
                            data={message.data || {}}
                            date={new Date()}
                            id={message.id.toString()}
                            focus={false}
                            titleColor="#000"
                        />
                    ))
                )}
            </div>
            <div className="border-t border-gray-300 bg-white">
                <div className="flex items-center p-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-grow p-2 border border-gray-300 rounded-lg resize-none"
                        placeholder="Type a message"
                        rows={1}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="ml-2"
                    />
                    <button
                        onClick={handleSend}
                        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessagesComponent;
