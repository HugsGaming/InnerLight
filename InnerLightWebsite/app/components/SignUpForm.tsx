import React, { useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useReCaptcha } from "next-recaptcha-v3";
import { SlSocialFacebook, SlSocialGoogle } from "react-icons/sl";
import { createClient } from "../utils/supabase/client";

interface IFormInput {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean; // Added field for terms acceptance
}

interface SignUpFormProps {
    toggleForm: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ toggleForm }) => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<IFormInput>();
    const router = useRouter();
    const supabase = createClient();
    // const { executeRecaptcha } = useReCaptcha();

    const password = watch("password");
    const confirmPassword = watch("confirmPassword");

    // useEffect(() => {
    //     const script = document.createElement("script");
    //     script.src =
    //         "https://www.google.com/recaptcha/enterprise.js?render=6LdMICYqAAAAAKh9MmH4M4hPVqqMOyZIbqvIWfLc";
    //     script.async = true;
    //     document.head.appendChild(script);
    // }, []);

    const onSubmit: SubmitHandler<IFormInput> = useCallback(
        // async (data) => {
        //     try {
        //         const token = await executeRecaptcha("verify_recaptcha");

        //         const response = await fetch("/api/verify-recaptcha", {
        //             method: "POST",
        //             headers: {
        //                 "Content-Type": "application/json",
        //             },
        //             body: JSON.stringify({ token, ...data }),
        //         });

        //         if (!response.ok) {
        //             throw new Error("reCAPTCHA verification failed.");
        //         }

        //         const result = await response.json();
        //         if (result.success) {
        //             router.push("/home");
        //         } else {
        //             alert(
        //                 result.message ||
        //                     "reCAPTCHA verification failed. Please try again.",
        //             );
        //         }
        //     } catch (error) {
        //         alert(
        //             (error as Error).message ||
        //                 "An error occurred. Please try again.",
        //         );
        //     }
        // },
        // [executeRecaptcha, router],
        async (data) => {
            // try {
            //     await supabase.auth.signUp({
            //         email: data.email,
            //         password: data.password,
            //         options: {
            //             data: {
            //                 first_name: data.firstName,
            //                 last_name: data.lastName,
            //                 username: data.username
            //             }
            //         }
            //     });
            //     router.replace("/home");
            // } catch (error) {
            //     console
            // }
            console.log(data);
            supabase.auth
                .signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        data: {
                            first_name: data.firstName,
                            last_name: data.lastName,
                            username: data.username,
                        },
                    },
                })
                .then((data) => {
                    console.log(data);
                    router.replace("/home");
                })
                .catch((error) => {
                    console.log(error);
                });
        },
        [router],
    );

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
                                First Name is required
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
                                Last Name is required
                            </p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label
                            htmlFor="lname"
                            className="block text-gray-700 dark:text-gray-300"
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            id="uname"
                            {...register("username", { required: true })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.username && (
                            <p className="text-red-500 text-sm">
                                Username is required
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
                            {...register("email", { required: true })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm">
                                Email is required
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
                            {...register("password", { required: true })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm">
                                Password is required
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
                            {...register("termsAccepted", { required: true })}
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

                    <div className="mb-4">
                        <div
                            id="recaptcha-container"
                            className="g-recaptcha"
                        ></div>
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
                            onClick={toggleForm}
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
        </div>
    );
};

export default SignUpForm;
