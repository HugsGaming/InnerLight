import React, { useState } from "react";
import { ChatList, Input, Button } from "react-chat-elements";
import "react-chat-elements/dist/main.css";

interface ChatListComponentProps {
    onSelectFriend: (friend: any) => void;
}

const ChatListComponent: React.FC<ChatListComponentProps> = ({
    onSelectFriend,
}) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [input, setInput] = useState("");

    const handleAddFriend = () => {
        if (input.trim()) {
            const newFriend = { title: input, messages: [] };
            setFriends([...friends, newFriend]);
            setInput("");
        }
    };

    const handleSelectFriend = (friend: any) => {
        onSelectFriend(friend);
    };

    return (
        <div className="p-4 bg-gray-200 rounded-lg shadow-md h-screen mr-2 dark:bg-gray-800 dark:text-white">
            <div className="flex mb-4 bg-transparent text-black dark:bg-gray-800">
                <Input
                    placeholder="Add a friend..."
                    multiline={false}
                    value={input}
                    onChange={(e: {
                        target: { value: React.SetStateAction<string> };
                    }) => setInput(e.target.value)}
                    maxHeight={100}
                    className="flex-1 mr-2 text-black"
                    rightButtons={
                        <Button text="Add" onClick={handleAddFriend} />
                    }
                />
            </div>
            <ChatList
                className=" bg-transparent text-black "
                dataSource={friends}
                onClick={(friend) => handleSelectFriend(friend)}
                id="chat-list"
                lazyLoadingImage="path/to/lazy-loading-image.png"
            />
        </div>
    );
};

export default ChatListComponent;
