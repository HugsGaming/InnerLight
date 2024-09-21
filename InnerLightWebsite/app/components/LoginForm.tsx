"use client";

import React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { SlSocialFacebook, SlSocialGoogle } from "react-icons/sl";
import { createClient } from "../utils/supabase/client";
import { Bounce, ToastContainer, toast } from "react-toastify";

interface IFormInput {
    email: string;
    password: string;
}

const LoginForm: React.FC= () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<IFormInput>();
    const router = useRouter();
    const supabase = createClient();

    const onSubmit: SubmitHandler<IFormInput> = async (data) => {
        console.log(data);
        const { data: user, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
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
        }
        router.push("/home");
    };

    return (
        <div className="flex min-h-screen ">
            <div className="w-full lg:w-1/2 p-2 flex items-center justify-center">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full max-w-lg bg-white dark:bg-gray-900 p-12 shadow-lg rounded-lg"
                >
                    <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
                        Log In
                    </h2>
                    <div className="mb-6">
                        <label
                            htmlFor="email"
                            className="block text-gray-700 dark:text-gray-300 text-lg font-medium"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address",
                                },
                                validate: {
                                    isRegistered: async (value) => {
                                        const { data, error } = await supabase
                                            .from("profiles")
                                            .select("email")
                                            .eq("email", value);
                                        if (data!.length <= 0 || error) {
                                            return "Email is not registered";
                                        } else {
                                            return false;
                                        }
                                    },
                                },
                            })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="block text-gray-700 dark:text-gray-300 text-lg font-medium"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            {...register("password", {
                                required: "Password is required",
                            })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition"
                    >
                        Log In
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
                            Login with Google
                        </button>
                    </div>

                    <div className="mt-4">
                        <button className="w-full bg-blue-800 dark:bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-900 dark:hover:bg-blue-800 transition flex items-center justify-center gap-2">
                            <SlSocialFacebook className="w-5 h-5" />
                            Login with Facebook
                        </button>
                    </div>

                    <div>
                        <button
                            className="mt-5 text-blue-500 dark:text-blue-400"
                            onClick={() => {}}
                        >
                            Don&apos;t have an account? Sign Up
                        </button>
                    </div>
                </form>
            </div>

            <div className="hidden lg:block lg:w-1/2">
                <img
                    src="https://imgur.com/ZB9Z9q1.png"
                    alt="Hero"
                    className="w-full h-full rounded-lg object-contain"
                />
            </div>
        </div>
    );
};

export default LoginForm;
