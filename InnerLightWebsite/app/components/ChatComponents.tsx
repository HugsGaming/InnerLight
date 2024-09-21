import React, { useState, useRef, useEffect } from "react";
import { MessageList, Input, Button } from "react-chat-elements";
import "react-chat-elements/dist/main.css";
import { FaImage, FaFileUpload } from "react-icons/fa"; // Import icons
import { MessageBox } from "react-chat-elements"; // Import MessageBox

interface ChatComponentProps {
    friend: any;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ friend }) => {
    const [messages, setMessages] = useState<any[]>([
        {
            id: 1,
            text: "Hello! How are you?",
            position: "left",
            type: "text",
            date: new Date(),
            title: "Friend",
        },
    ]);
    const [input, setInput] = useState("");
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        messageId: number | null;
    }>({ visible: false, x: 0, y: 0, messageId: null });
    const messageListRef = useRef(null);

    useEffect(() => {
        if (friend) {
            setMessages(friend.messages);
        }
    }, [friend]);

    const handleSend = () => {
        if (input.trim()) {
            const newMessage = {
                id: Date.now(),
                text: input,
                position: "right",
                type: "text",
                date: new Date(),
                title: "User",
            };
            const updatedMessages = [...messages, newMessage];
            setMessages(updatedMessages);
            if (friend) {
                friend.messages = updatedMessages; // Update the friend's messages
            }
            setInput("");
        }
    };

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const newMessage = {
                id: Date.now(),
                text: "Image",
                position: "right",
                type: "photo",
                date: new Date(),
                title: "User",
                data: {
                    uri: URL.createObjectURL(file),
                },
            };
            const updatedMessages = [...messages, newMessage];
            setMessages(updatedMessages);
            if (friend) {
                friend.messages = updatedMessages;
            }
        }
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const newMessage = {
                id: Date.now(),
                text: file.name,
                position: "right",
                type: "file",
                date: new Date(),
                title: "User",
                size: file.size,
                data: {
                    uri: URL.createObjectURL(file),
                    status: {
                        click: false,
                        loading: 0,
                    },
                },
            };
            const updatedMessages = [...messages, newMessage];
            setMessages(updatedMessages);
            if (friend) {
                friend.messages = updatedMessages;
            }
        }
    };

    const handleDownload = (uri: string, filename: string) => {
        const link = document.createElement("a");
        link.href = uri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = (id: number) => {
        const updatedMessages = messages.filter((message) => message.id !== id);
        setMessages(updatedMessages);
        if (friend) {
            friend.messages = updatedMessages;
        }
    };

    const handleContextMenu = (event: React.MouseEvent, messageId: number) => {
        event.preventDefault();
        setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            messageId: messageId,
        });
    };

    const handleClick = () => {
        setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    };

    useEffect(() => {
        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, []);

    return (
        <div className="flex flex-col h-screen p-4 bg-gray-200 rounded-lg shadow-md mr-2 dark:bg-gray-800 dark:text-white">
            <div className="flex-grow text-black dark:bg-gray-800">
                <MessageList
                    className="message-list"
                    lockable={true}
                    toBottomHeight={"100%"}
                    referance={messageListRef}
                    dataSource={messages.map((message) => {
                        if (
                            message.type === "photo" ||
                            message.type === "file"
                        ) {
                            return {
                                ...message,
                                data: {
                                    ...message.data,
                                    uri: message.data.uri,
                                },
                                render: () => (
                                    <div
                                        onContextMenu={(e) =>
                                            handleContextMenu(e, message.id)
                                        }
                                    >
                                        <MessageBox
                                            position={message.position}
                                            type={message.type}
                                            title={message.title}
                                            data={message.data}
                                        />
                                    </div>
                                ),
                            };
                        }
                        return message;
                    })}
                />
            </div>
            <div className="p-4">
                <Input
                    className="bg-gray-200 text-black dark:bg-gray-800 w-auto"
                    placeholder="Type here..."
                    multiline={true}
                    value={input}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setInput(e.target.value)
                    }
                    maxHeight={100}
                    rightButtons={
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                id="image-upload"
                                onChange={handleImageUpload}
                            />
                            <label htmlFor="image-upload">
                                <FaImage
                                    style={{
                                        color: "gray",
                                        cursor: "pointer",
                                        marginLeft: "10px",
                                        fontSize: "30px", // Increase icon size
                                    }}
                                />
                            </label>
                            <input
                                type="file"
                                style={{ display: "none" }}
                                id="file-upload"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="file-upload">
                                <FaFileUpload
                                    style={{
                                        color: "gray",
                                        cursor: "pointer",
                                        marginLeft: "10px",
                                        fontSize: "30px", // Increase icon size
                                    }}
                                />
                            </label>
                            <Button
                                className="font-bold ml-4"
                                text="Send"
                                onClick={handleSend}
                            />
                        </div>
                    }
                />
            </div>
            {contextMenu.visible && (
                <div
                    style={{
                        position: "absolute",
                        top: `${contextMenu.y}px`,
                        left: `${contextMenu.x}px`,
                        backgroundColor: "white",
                        padding: "10px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                        zIndex: 1000,
                    }}
                >
                    <button
                        onClick={() => handleDelete(contextMenu.messageId!)}
                        className="block w-full text-left"
                    >
                        Delete Message
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatComponent;
