"use client";
import React, { useState } from "react";
import {
    FaHome,
    FaBell,
    FaBook,
    FaPen,
    FaPaintBrush,
    FaCommentDots,
    FaInfoCircle,
    FaQuestionCircle,
    FaCog,
} from "react-icons/fa";

const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed flex flex-col top-14 left-0 w-14 hover:w-64 md:w-64 bg-yellow-950 dark:bg-gray-900 h-full text-white transition-all duration-300 border-none z-10 sidebar">
            <div className="overflow-y-auto overflow-x-hidden flex flex-col justify-between flex-grow">
                <ul className="flex flex-col py-4 space-y-1">
                    <li className="px-5 hidden md:block">
                        <div className="flex flex-row items-center h-8">
                            <div className="text-sm font-light tracking-wide text-gray-400 uppercase">
                                Home
                            </div>
                        </div>
                    </li>
                    <li>
                        <a
                            href="/home"
                            className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                        >
                            <span className="inline-flex justify-center items-center ml-4">
                                <FaHome className="w-5 h-5" />
                            </span>
                            <span className="ml-2 text-sm tracking-wide truncate">
                                Dashboard
                            </span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                        >
                            <span className="inline-flex justify-center items-center ml-4">
                                <FaBell className="w-5 h-5" />
                            </span>
                            <span className="ml-2 text-sm tracking-wide truncate">
                                Notification
                            </span>
                            <span className="hidden md:block px-2 py-0.5 ml-auto text-xs font-medium tracking-wide text-blue-500 bg-indigo-50 rounded-full">
                                1.2k
                            </span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                        >
                            <span className="inline-flex justify-center items-center ml-4">
                                <FaBook className="w-5 h-5" />
                            </span>
                            <span className="ml-2 text-sm tracking-wide truncate">
                                Followers
                            </span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                        >
                            <span className="inline-flex justify-center items-center ml-4">
                                <FaPen className="w-5 h-5" />
                            </span>
                            <span className="ml-2 text-sm tracking-wide truncate">
                                Write
                            </span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="/draw"
                            className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                        >
                            <span className="inline-flex justify-center items-center ml-4">
                                <FaPaintBrush className="w-5 h-5" />
                            </span>
                            <span className="ml-2 text-sm tracking-wide truncate">
                                Draw
                            </span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="/chat"
                            className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                        >
                            <span className="inline-flex justify-center items-center ml-4">
                                <FaCommentDots className="w-5 h-5" />
                            </span>
                            <span className="ml-2 text-sm tracking-wide truncate">
                                Chats
                            </span>
                            <span className="hidden md:block px-2 py-0.5 ml-auto text-xs font-medium tracking-wide text-red-500 bg-red-50 rounded-full">
                                2
                            </span>
                        </a>
                    </li>
                </ul>
                {/* Bottom items */}
                <div className="mt-auto">
                    <ul className="flex flex-col py-4 space-y-1">
                        <li className="px-5 hidden md:block">
                            <div className="flex flex-row items-center mt-5 h-8">
                                <div className="text-sm font-light tracking-wide text-gray-400 uppercase">
                                    Settings
                                </div>
                            </div>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                            >
                                <span className="inline-flex justify-center items-center ml-4">
                                    <FaInfoCircle className="w-5 h-5" />
                                </span>
                                <span className="ml-2 text-sm tracking-wide truncate">
                                    About
                                </span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                            >
                                <span className="inline-flex justify-center items-center ml-4">
                                    <FaQuestionCircle className="w-5 h-5" />
                                </span>
                                <span className="ml-2 text-sm tracking-wide truncate">
                                    Help
                                </span>
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
                            >
                                <span className="inline-flex justify-center items-center ml-4">
                                    <FaCog className="w-5 h-5" />
                                </span>
                                <span className="ml-2 text-sm tracking-wide truncate">
                                    Settings
                                </span>
                            </a>
                        </li>
                    </ul>
                    <p className="mb-14 px-5 py-3 hidden md:block text-center text-xs">
                        Copyright Innerlight @ 2024
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
