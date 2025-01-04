"use client";

import React, { useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useReCaptcha } from "next-recaptcha-v3";
import { SlSocialFacebook, SlSocialGoogle } from "react-icons/sl";
import { createClient } from "../utils/supabase/client";
import { ToastContainer, toast } from "react-toastify";
import { set } from "zod";

interface IFormInput {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean; // Added field for terms acceptance
}

const SignUpForm: React.FC = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<IFormInput>();
    const router = useRouter();
    const supabase = createClient();
    const { executeRecaptcha } = useReCaptcha();

    const password = watch("password");
    const confirmPassword = watch("confirmPassword");
    const [isDisabled, setIsDisabled] = React.useState(false);

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        try {
            setIsDisabled(true);

            // Execute reCAPTCHA and get the token
            const token = await executeRecaptcha("sign_up");

            const recaptchaResponse = await fetch("/api/verify-recaptcha", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            const recaptchaData = await recaptchaResponse.json();

            if (!recaptchaData.success) {
                toast.error("reCAPTCHA verification failed. Please try again.", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                console.error("reCAPTCHA verification failed.");
                setIsDisabled(false);
                return;
            }

            // Proceed with sign up
            const { data: user, error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        first_name: data.firstName,
                        last_name: data.lastName,
                        username: data.username,
                    },
                },
            });

            if (error) {
                toast.error(error.message, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                console.error(error.message);
            } else {
                router.push("/home");
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            console.error(error);
        } finally {
            setIsDisabled(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            <div className="w-full lg:w-1/2 p-2 flex items-center justify-center">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full max-w-lg bg-white dark:bg-gray-900 p-12 shadow-lg rounded-lg"
                >
                    <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
                        Sign Up
                    </h2>
                    <div className="mb-4">
                        <label
                            htmlFor="fname"
                            className="block text-gray-700 dark:text-gray-300"
                        >
                            First Name
                        </label>
                        <input
                            type="text"
                            id="fname"
                            {...register("firstName", { required: true })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.firstName && (
                            <p className="text-red-500 text-sm">
                                {errors.firstName.message}
                            </p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label
                            htmlFor="lname"
                            className="block text-gray-700 dark:text-gray-300"
                        >
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lname"
                            {...register("lastName", { required: true })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.lastName && (
                            <p className="text-red-500 text-sm">
                                {errors.lastName.message}
                            </p>
                        )}
                        <div className="mb-4">
                            <label
                                htmlFor="uname"
                                className="block text-gray-700 dark:text-gray-300"
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                id="uname"
                                {...register("username", {
                                    required: "Username is required",
                                    validate: {
                                        uniqueUsername: async (value) => {
                                            const { data, error } =
                                                await supabase
                                                    .from("profiles")
                                                    .select("username")
                                                    .eq("username", value);

                                            console.log(
                                                "Username validation ",
                                                data,
                                            );
                                            if (data!.length > 0) {
                                                return "Username is already taken";
                                            }
                                        },
                                    },
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                            {errors.username && (
                                <p className="text-red-500 text-sm">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label
                                htmlFor="email"
                                className="block text-gray-700 dark:text-gray-300"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                {...register("email", {
                                    required: true,
                                    pattern:
                                        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i||
                                        "Invalid email address",
                                    validate: {
                                        uniqueEmail: async (value) => {
                                            const { data, error } =
                                                await supabase
                                                    .from("profiles")
                                                    .select("email")
                                                    .eq("email", value);
                                            console.log(
                                                "Email validation ",
                                                data,
                                            );
                                            if (data!.length > 0) {
                                                return "Email already exists";
                                            }
                                        },
                                    },
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label
                                htmlFor="password"
                                className="block text-gray-700 dark:text-gray-300"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                {...register("password", {
                                    required: true,
                                    validate: {
                                        minLength: (value) =>
                                            value.length >= 8 ||
                                            "Password must be at least 8 characters",
                                        hasUpperCase: (value) =>
                                            /[A-Z]/.test(value) ||
                                            "Password must contain at least one uppercase letter",
                                        hasLowerCase: (value) =>
                                            /[a-z]/.test(value) ||
                                            "Password must contain at least one lowercase letter",
                                        hasNumber: (value) =>
                                            /[0-9]/.test(value) ||
                                            "Password must contain at least one number",
                                    },
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label
                                htmlFor="confirmPassword"
                                className="block text-gray-700 dark:text-gray-300"
                            >
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                {...register("confirmPassword", {
                                    validate: (value) =>
                                        value === password ||
                                        "Passwords must match",
                                })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                        <div className="mb-4 flex items-center">
                            <input
                                type="checkbox"
                                id="termsAccepted"
                                {...register("termsAccepted", {
                                    required: true,
                                })}
                                className="mr-2"
                            />
                            <label
                                htmlFor="termsAccepted"
                                className="text-gray-700 dark:text-gray-300"
                            >
                                I accept the{" "}
                                <a href="#" className="text-blue-500">
                                    terms and conditions
                                </a>
                            </label>
                            {errors.termsAccepted && (
                                <p className="text-red-500 text-sm">
                                    You must accept the terms and conditions
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition"
                    >
                        Sign Up
                    </button>
                    <div className="my-4 flex items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="mx-4 text-gray-500 dark:text-gray-400">
                            or
                        </span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <div className="mt-4">
                        <button className="w-full bg-red-600 dark:bg-red-700 text-white py-3 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition flex items-center justify-center gap-2">
                            <SlSocialGoogle className="w-5 h-5" />
                            Sign Up with Google
                        </button>
                    </div>

                    <div className="mt-4">
                        <button className="w-full bg-blue-800 dark:bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-900 dark:hover:bg-blue-800 transition flex items-center justify-center gap-2">
                            <SlSocialFacebook className="w-5 h-5" />
                            Sign Up with Facebook
                        </button>
                    </div>

                    <div>
                        <button
                            className="mt-5 text-blue-500 dark:text-blue-400"
                            onClick={() => {
                                router.push("/auth/login");
                            }}
                            disabled={isDisabled}
                        >
                            Already have an account? Log In
                        </button>
                    </div>
                </form>
            </div>
            <div className="hidden lg:block lg:w-1/2">
                <img
                    src="https://imgur.com/Ic0QJ9v.png"
                    alt="Hero"
                    className="w-full h-full rounded-lg object-contain"
                />
            </div>
            <ToastContainer />
        </div>
    );
};

export default SignUpForm;
