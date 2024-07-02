import React from "react";
import {
    FaHome,
    FaBell,
    FaPen,
    FaPaintBrush,
    FaCommentDots,
    FaInfoCircle,
    FaQuestionCircle,
    FaToolbox,
} from "react-icons/fa";

const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-white shadow-md h-full">
            <ul>
                <li className="p-4 flex items-center">
                    <FaHome className="mr-3" /> Home
                </li>
                <li className="p-4 flex items-center">
                    <FaBell className="mr-3" /> Notifications
                </li>
                <li className="p-4 flex items-center">
                    <FaPen className="mr-3" /> Write
                </li>
                <li className="p-4 flex items-center">
                    <FaPaintBrush className="mr-3" /> Draw
                </li>
                <li className="p-4 flex items-center">
                    <FaCommentDots className="mr-3" /> Chat
                </li>
                <li className="p-4 flex items-center">
                    <FaInfoCircle className="mr-3" /> About
                </li>
                <li className="p-4 flex items-center">
                    <FaQuestionCircle className="mr-3" /> Help
                </li>
                <li className="p-4 flex items-center">
                    <FaToolbox className="mr-3" /> Apps & Tools
                </li>
            </ul>
        </aside>
    );
};

export default Sidebar;
