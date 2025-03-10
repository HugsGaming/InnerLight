"use client";
import React from "react";

const Help: React.FC = () => {
    return (
        <div className="relative isolate overflow-hidden bg-custom">
            <div className="py-24 px-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-12">
                <div className="flex flex-col text-left basis-1/2">
                    <p className="inline-block font-semibold text-primary mb-4">
                        F.A.Q
                    </p>
                    <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
                        Frequently Asked Questions
                    </p>
                </div>
                <ul className="basis-1/2">
                    <li className="group">
                        <button
                            className="relative  flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
                            aria-expanded="false"
                        >
                            <span className="flex-1 text-base-content">
                                General Objective of InnerLight?
                            </span>
                            <svg
                                className="flex-shrink-0 w-4 h-4  ml-auto fill-current"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="transform origin-center transition duration-200 ease-out false"
                                ></rect>
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="block group-hover:opacity-0 origin-center rotate-90 transition duration-200 ease-out false"
                                ></rect>
                            </svg>
                        </button>
                        <div
                            className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
                            style={{
                                transition: "max-height 0.3s ease-in-out 0s",
                            }}
                        >
                            <div className="pb-5 leading-relaxed">
                                <div className="space-y-2 leading-relaxed">
                                    {" "}
                                    The general objective is to create a social
                                    media platform that can help users cope with
                                    their anxiety and depression by allowing
                                    them to express themselves through their
                                    artworks and creative writing.
                                </div>
                            </div>
                        </div>
                    </li>
                    <li className="group">
                        <button
                            className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
                            aria-expanded="false"
                        >
                            <span className="flex-1 text-base-content">
                                Scope of InnerLight?
                            </span>
                            <svg
                                className="flex-shrink-0 w-4 h-4 ml-auto fill-current"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="transform origin-center transition duration-200 ease-out false"
                                ></rect>
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="group-hover:opacity-0 transform origin-center rotate-90 transition-all duration-200 ease-out false"
                                ></rect>
                            </svg>
                        </button>
                        <div
                            className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
                            style={{
                                transition: "max-height 0.3s ease-in-out 0s",
                            }}
                        >
                            <div className="pb-5 leading-relaxed">
                                <div className="space-y-2 leading-relaxed">
                                    <ul className="list-disc list-inside">
                                        <li>
                                            The project will use existing web
                                            technologies to create the platform.
                                        </li>
                                        <li>
                                            This platform will be a web
                                            application to make it
                                            cross-platform to cater users using
                                            the desktop and mobile devices.
                                        </li>
                                        <li>
                                            Proponents will use Supabase as
                                            their platform for authentication,
                                            database, and storage.
                                        </li>
                                        <li>
                                            The web application will be deployed
                                            in Vercel as their platform for the
                                            deployment of the website.
                                        </li>
                                        <li>
                                            The proponents will use Chat GPT-4
                                            as their model.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li className="group">
                        <button
                            className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
                            aria-expanded="false"
                        >
                            <span className="flex-1 text-base-content">
                                Other Scope?
                            </span>
                            <svg
                                className="flex-shrink-0 w-4 h-4 ml-auto fill-current"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="transform origin-center transition duration-200 ease-out false"
                                ></rect>
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="group-hover:opacity-0 transform origin-center rotate-90 transition duration-200 ease-out false"
                                ></rect>
                            </svg>
                        </button>
                        <div
                            className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
                            style={{
                                transition: "max-height 0.3s ease-in-out 0s",
                            }}
                        >
                            <div className="pb-5 leading-relaxed">
                                <div className="space-y-2 leading-relaxed">
                                    {" "}
                                    <ul className="list-disc list-inside">
                                        <li>
                                            The application will be available
                                            for everyone to use.
                                        </li>
                                        <li>
                                            User accounts are free and can be
                                            created by anyone.
                                        </li>
                                        <li>
                                            User comments and posts will be
                                            filtered by an edge function.
                                        </li>
                                        <li>
                                            The application is intended to serve
                                            people who have less severe mental
                                            health conditions such as
                                            Depression, Anxiety, Normal Stress
                                            Response (PTSD Type 1), Acute Stress
                                            Disorder (PTSD Type 2),
                                            Uncomplicated PTSD (PTSD Type 3).
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li className="group">
                        <button
                            className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
                            aria-expanded="false"
                        >
                            <span className="flex-1 text-base-content">
                                Limitations of Innerlight?
                            </span>
                            <svg
                                className="flex-shrink-0 w-4 h-4 ml-auto fill-current"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="transform origin-center transition duration-200 ease-out false"
                                ></rect>
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="group-hover:opacity-0 transform origin-center rotate-90 transition duration-200 ease-out false"
                                ></rect>
                            </svg>
                        </button>
                        <div
                            className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
                            style={{
                                transition: "max-height 0.3s ease-in-out 0s",
                            }}
                        >
                            <div className="pb-5 leading-relaxed">
                                <div className="space-y-2 leading-relaxed">
                                    <ul className="list-disc list-inside">
                                        <li>
                                            The application will only be
                                            accessible through a browser.
                                        </li>
                                        <li>
                                            The AI will only be able to
                                            recognize facial expressions, not
                                            body language.
                                        </li>
                                        <li>
                                            The application can only be accessed
                                            if there is an internet connection
                                            available.
                                        </li>
                                        <li>
                                            The proponents will not upgrade the
                                            current Supabase plan from a free
                                            tier.
                                        </li>
                                        <li>
                                            People with severe mental health
                                            conditions such as Autism,
                                            Tourette's Syndrome, Dissociative
                                            Identity Disorder, Complex PTSD
                                            (PTSD Type 4), and Comorbid PTSD
                                            (PTSD Type 5) will not be able to
                                            use the program.
                                        </li>
                                        <li>
                                            The chatbot will only support
                                            limited languages, such as English
                                            and Filipino.
                                        </li>
                                        <li>
                                            Due to how Open AI custom chatbots
                                            do not save messages, messages for
                                            AI to user won’t be saved to
                                            database.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li className="group">
                        <button
                            className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
                            aria-expanded="false"
                        >
                            <span className="flex-1 text-base-content">
                                Assumptions?
                            </span>
                            <svg
                                className="flex-shrink-0 w-4 h-4 ml-auto fill-current"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="transform origin-center transition duration-200 ease-out false"
                                ></rect>
                                <rect
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="1"
                                    className="group-hover:opacity-0 transform origin-center rotate-90 transition duration-200 ease-out false"
                                ></rect>
                            </svg>
                        </button>
                        <div
                            className="transition-all duration-300 ease-in-out group-hover:max-h-60 max-h-0 overflow-hidden"
                            style={{
                                transition: "max-height 0.3s ease-in-out 0s",
                            }}
                        >
                            <div className="pb-5 leading-relaxed">
                                <div className="space-y-2 leading-relaxed">
                                    <ul className="list-disc list-inside">
                                        <li>
                                            Assuming that the user is
                                            experiencing Depression and Anxiety.
                                        </li>
                                        <li>
                                            Assumes that the user has a webcam
                                            for the chatbot to know what mood
                                            the user’s mood.
                                        </li>
                                        <li>
                                            Assumes that the User is only
                                            visible in the webcam.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li>
                        <a
                            href="#"
                            className="text-orange-500 mt-3 inline-flex font-medium no-underline group px-2 py-2 items-center -tracking-tight"
                        >
                            See more
                            <svg
                                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-500 ease-in-out"
                                viewBox="0 0 100 50"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M78.1233 27.7777H21.8758C20.1259 27.7777 18.751 26.5555 18.751 24.9999C18.751 23.4444 20.1259 22.2222 21.8758 22.2222H78.1233C79.8732 22.2222 81.2482 23.4444 81.2482 24.9999C81.2482 26.5555 79.8732 27.7777 78.1233 27.7777Z"
                                    fill="#FF8E26"
                                />
                                <path
                                    d="M62.4999 47.2222C62.09 47.2266 61.6837 47.1548 61.307 47.0112C60.9302 46.8677 60.5915 46.6557 60.3125 46.3888C59.0625 45.2777 59.0625 43.5555 60.3125 42.4444L79.9991 24.9444L60.3125 7.4444C59.0625 6.33329 59.0625 4.61107 60.3125 3.49996C61.5624 2.38885 63.4998 2.38885 64.7498 3.49996L86.6238 22.9444C87.8737 24.0555 87.8737 25.7777 86.6238 26.8888L64.7498 46.3333C64.1248 46.8888 63.3123 47.1666 62.5624 47.1666L62.4999 47.2222Z"
                                    fill="#FF8E26"
                                />
                            </svg>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Help;
