"use client";
import React, { useEffect, useState } from "react";
import {
    FaUserCircle,
    FaSearch,
    FaSun,
    FaMoon,
    FaSignOutAlt,
} from "react-icons/fa";
import { createClient } from "../utils/supabase/client";
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
    const [isDark, setIsDark] = useState(false);
    const router = useRouter();

    const supabase = createClient();

    useEffect(() => {
        const getTheme = () => {
            if (window.localStorage.getItem("dark")) {
                return JSON.parse(
                    window.localStorage.getItem("dark") as string,
                );
            }
            return (
                !!window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
            );
        };

        const setTheme = (value: boolean) => {
            window.localStorage.setItem("dark", JSON.stringify(value));
            document.documentElement.classList.toggle("dark", value);
        };

        setIsDark(getTheme());
        setTheme(getTheme());
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        window.localStorage.setItem("dark", JSON.stringify(!isDark));
        document.documentElement.classList.toggle("dark", !isDark);
    };

    const signOut = async () => {
        console.log("Signing out...");
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error signing out:", error);
        }
        router.replace("/auth/login");
    };

    const openProfile = () => {
        router.push("/profile");
    };

    return (
        <header className="fixed w-full flex items-center justify-between h-14 text-[#EAD8AC] z-10 print:hidden bg-[#1E3226] dark:bg-gray-800">
            <div className="flex items-center justify-start md:justify-center pl-3 w-14 md:w-64 h-14 bg-[#1E3226] dark:bg-gray-800 border-none">
                <span className="hidden md:block w-full">
                    <img
                        src="https://imgur.com/ygBYDbr.png"
                        alt="Logo"
                        className="h-12 w-full object-contain"
                    />
                </span>
            </div>
            <div className="flex justify-between items-center h-14 bg-[#1E3226] dark:bg-gray-800 header-right">
                <div className="bg-[#EAD8AC] dark:bg-gray-800 rounded flex items-center w-full max-w-xl ml-2 mr-4 p-2 shadow-sm border border-[#A19F81] dark:border-gray-700">
                    <button className="outline-none focus:outline-none">
                        <FaSearch className="w-5 text-[#C46C4C] dark:text-[#EAD8AC] h-5 cursor-pointer" />
                    </button>
                    <input
                        type="search"
                        placeholder="Search"
                        className="w-full pl-3 text-sm text-[#1E3226] dark:text-white outline-none focus:outline-none bg-transparent"
                    />
                </div>
                <ul className="flex items-center">
                    <li>
                        <button
                            onClick={toggleTheme}
                            className="group p-2 transition-colors duration-200 rounded-full shadow-md bg-[#C46C4C] dark:bg-[#9A4F3A] hover:bg-[#7A9179] focus:outline-none"
                        >
                            {isDark ? (
                                <FaSun className="w-4 h-4 text-[#EAD8AC] dark:text-yellow-400 group-hover:text-[#1E3226]" />
                            ) : (
                                <FaMoon className="w-4 h-4 text-[#EAD8AC] group-hover:text-[#1E3226]" />
                            )}
                        </button>
                    </li>
                    <li>
                        <div className="block w-px h-6 mx-3 mr-1 bg-[#A19F81] dark:bg-gray-500"></div>
                    </li>
                    <li>
                        <button
                            className="p-2 transition-colors duration-200 rounded-full shadow-md hover:text-[#7A9179]"
                            onClick={openProfile}
                        >
                            <FaUserCircle className="w-8 h-8 md:w-8 md:h-8 mr-2 rounded-full overflow-hidden text-[#EAD8AC] dark:text-gray-300" />
                        </button>
                    </li>
                    <li>
                        <a
                            className="flex items-center mr-4 hover:text-[#7A9179] dark:hover:text-gray-300 cursor-pointer"
                            onClick={signOut}
                        >
                            <FaSignOutAlt className="w-4 h-4" />
                            Logout
                        </a>
                    </li>
                </ul>
            </div>
        </header>
    );
};

export default Header;
