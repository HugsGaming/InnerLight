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
    FaCamera,
    FaBrain,
} from "react-icons/fa";

const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="print:hidden">
            {/* Toggle Button for Mobile/Tablet */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 bg-[#C46C4C] dark:bg-[#EAD8AC] text-[#EAD8AC] dark:text-[#1E3226] p-2 rounded-full shadow-lg focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Sidebar"
            >
                <FaBars />
            </button>

            {/* Sidebar */}
            <div
                className={`fixed flex flex-col top-0 left-0 h-full transition-all duration-300 z-999 
                    ${isOpen ? "w-64" : "w-14 lg:w-64"} 
                    bg-[#1E3226] dark:bg-gray-900 text-[#EAD8AC] dark:text-gray-200`}
            >
                <div className="flex flex-col justify-between flex-grow mt-14 font-medium text-2xl">
                    <ul className="flex flex-col py-4 space-y-1">
                        {/* Sidebar Items */}
                        <li className="px-5 hidden lg:block text-lg">
                            <div className="flex flex-row items-center h-8">
                                <div className="text-sm font-light tracking-wide text-[#A19F81] dark:text-gray-400 uppercase">
                                    Home
                                </div>
                            </div>
                        </li>
                        <SidebarItem
                            href="/dashboard"
                            icon={<FaHome />}
                            label="Dashboard"
                        />
                        <SidebarItem
                            href="/home"
                            icon={<FaPen />}
                            label="Post"
                        />
                        <SidebarItem
                            href="/chatbot"
                            icon={<FaCamera />}
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
                            // badge="2"
                        />
                        <SidebarItem
                            href="/hpt-test"
                            icon={<FaBrain />}
                            label="Psych Test"
                        />
                    </ul>

                    {/* Bottom Section */}
                    <div className="mt-auto">
                        <ul className="flex flex-col py-4 space-y-1">
                            <li className="px-5 hidden lg:block">
                                <div className="flex flex-row items-center mt-5 h-8">
                                    <div className="text-sm font-light tracking-wide text-[#A19F81] dark:text-gray-400 uppercase">
                                        Settings
                                    </div>
                                </div>
                            </li>
                            <SidebarItem
                                href="/settings"
                                icon={<FaInfoCircle />}
                                label="About"
                            />
                            <SidebarItem
                                href="/settings"
                                icon={<FaQuestionCircle />}
                                label="Help"
                            />
                        </ul>
                        <p className="mb-4 px-5 py-3 hidden lg:block text-center text-xs text-[#A19F81] dark:text-gray-400">
                            Copyright Innerlight © 2024
                        </p>
                    </div>
                </div>
            </div>

            {/* Overlay for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
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
            className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-green-800 dark:hover:bg-gray-600 text-white-600 hover:text-white-800 border-l-4 border-transparent hover:border-yellow-500 dark:hover:border-gray-800 pr-6"
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
