"use client";
import React, { useState } from "react";
import {
    FaBars,
    FaHome,
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
        <div>
            {/* Toggle Button for Mobile/Tablet */}
            <button
                className="lg:hidden fixed top-4 left-4 z-99 bg-yellow-950 text-white p-2 rounded-full shadow-lg focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Sidebar"
            >
                <FaBars />
            </button>

            {/* Sidebar */}
            <div
                className={`fixed flex flex-col top-0 left-0 bg-yellow-950 dark:bg-gray-900 h-full text-white transition-all duration-300 z-99 ${
                    isOpen ? "w-64" : "w-14 lg:w-64"
                }`}
            >
                <div className="flex flex-col justify-between flex-grow mt-14">
                    <ul className="flex flex-col py-4 space-y-1">
                        {/* Sidebar Items */}
                        <li className="px-5 hidden lg:block">
                            <div className="flex flex-row items-center h-8">
                                <div className="text-sm font-light tracking-wide text-gray-400 uppercase">
                                    Home
                                </div>
                            </div>
                        </li>
                        <SidebarItem
                            href="/home"
                            icon={<FaHome />}
                            label="Dashboard"
                        />
                        <SidebarItem
                            href="/chatbot"
                            icon={<FaPen />}
                            label="Chatbot"
                        />
                        <SidebarItem
                            href="/draw"
                            icon={<FaPaintBrush />}
                            label="Draw"
                        />
                        <SidebarItem
                            href="/chat"
                            icon={<FaCommentDots />}
                            label="Chats"
                            badge="2"
                        />
                    </ul>

                    {/* Bottom Section */}
                    <div className="mt-auto">
                        <ul className="flex flex-col py-4 space-y-1">
                            <li className="px-5 hidden lg:block">
                                <div className="flex flex-row items-center mt-5 h-8">
                                    <div className="text-sm font-light tracking-wide text-gray-400 uppercase">
                                        Settings
                                    </div>
                                </div>
                            </li>
                            <SidebarItem
                                href="#"
                                icon={<FaInfoCircle />}
                                label="About"
                            />
                            <SidebarItem
                                href="#"
                                icon={<FaQuestionCircle />}
                                label="Help"
                            />
                            <SidebarItem
                                href="#"
                                icon={<FaCog />}
                                label="Settings"
                            />
                        </ul>
                        <p className="mb-4 px-5 py-3 hidden lg:block text-center text-xs">
                            Copyright Innerlight © 2024
                        </p>
                    </div>
                </div>
            </div>

            {/* Overlay for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-99 md:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
        </div>
    );
};

interface SidebarItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    badge?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
    href,
    icon,
    label,
    badge,
}) => (
    <li>
        <a
            href={href}
            className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-yellow-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
        >
            <span className="inline-flex justify-center items-center ml-4">
                {icon}
            </span>
            <span className="ml-2 text-sm tracking-wide truncate">{label}</span>
            {badge && (
                <span className="hidden lg:block px-2 py-0.5 ml-auto text-xs font-medium tracking-wide text-red-500 bg-red-50 rounded-full">
                    {badge}
                </span>
            )}
        </a>
    </li>
);

export default Sidebar;
