// Hello

"use client";
import React from "react";
import Image from "next/image";

const About: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row items-center gap-8 max-w-6xl mx-auto">
                {/* Image container */}
                <div className="w-full lg:w-1/2">
                    <div className="relative aspect-[4/3] w-full max-w-lg mx-auto">
                        <img
                            src="https://imgur.com/g8zAUSv.jpg"
                            alt="About Us Image"
                            className="object-contain w-full h-full"
                        />
                    </div>
                </div>

                {/* Content container */}
                <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
                    <div className="inline-block">
                        <span className="text-gray-500 border-b-2 border-yellow-600 uppercase text-sm md:text-base font-medium">
                            About us
                        </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                        About{" "}
                        <span className="text-yellow-600">INNERLIGHT</span>
                    </h2>

                    <p className="text-gray-700 dark:text-white text-sm md:text-base leading-relaxed max-w-prose">
                        The purpose of this project is to mitigate the effects
                        of depression and anxiety among its users through
                        creative expressions. The beneficiaries are:
                        <br />
                        <strong>Patients</strong> - for them to have a platform
                        in which they can express themselves and help mitigate
                        their symptoms
                        <br />
                        <strong>Psychiatrists</strong> - for them to recommend a
                        platform to their patients to help mitigate their
                        symptoms
                    </p>
                </div>
            </div>
        </div>
    );
};

export default About;
