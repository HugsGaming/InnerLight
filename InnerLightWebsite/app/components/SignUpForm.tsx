import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState, type FormEvent, type MouseEvent } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { SlSocialGoogle, SlSocialFacebook } from "react-icons/sl";

interface SignUpFormProps {
    toggleForm: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ toggleForm }) => {
    const router = useRouter();
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [submit, setSubmit] = useState("");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        termsAccepted: false,
    });

    const [errors, setErrors] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        termsAccepted: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const validateForm = () => {
        let valid = true;
        let errors = {
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            termsAccepted: "",
        };

        if (!formData.firstName) {
            errors.firstName = "First Name is required";
            valid = false;
        }
        if (!formData.lastName) {
            errors.lastName = "Last Name is required";
            valid = false;
        }
        if (!formData.username) {
            errors.username = "Username is required";
            valid = false;
        }
        if (!formData.email) {
            errors.email = "Email is required";
            valid = false;
        }
        if (!formData.password) {
            errors.password = "Password is required";
            valid = false;
        }
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
            valid = false;
        }
        if (!formData.termsAccepted) {
            errors.termsAccepted = "You must accept the terms and conditions";
            valid = false;
        }

        setErrors(errors);
        return valid;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmit("");

        if (!validateForm()) {
            return;
        }

        if (!executeRecaptcha) {
            console.log("Recaptcha has not been executed");
            return;
        }

        const gRecaptchaToken = await executeRecaptcha("inquirySubmit");

        try {
            const response = await axios.post(
                "/api/recaptchaSubmit",
                { gRecaptchaToken },
                {
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json",
                    },
                },
            );

            if (response?.data?.success) {
                console.log(`Success with score: ${response?.data?.score}`);
                setSubmit("ReCaptcha Verified and Form Submitted!");
                router.push("/home");
            } else {
                console.log(`Failed with score: ${response?.data?.score}`);
                setSubmit("ReCaptcha Failed!");
            }
        } catch (error) {
            console.error("Error during form submission:", error);
            setSubmit("An error occurred during submission.");
        }
    };

    return (
        <div className="flex min-h-screen">
            <div className="w-full lg:w-1/2 p-2 flex items-center justify-center">
                <form
                    className="w-full max-w-lg bg-white dark:bg-gray-900 p-12 shadow-lg rounded-lg"
                    onSubmit={handleSubmit}
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
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.firstName && (
                            <p className="text-red-500 text-sm">
                                {errors.firstName}
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
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.lastName && (
                            <p className="text-red-500 text-sm">
                                {errors.lastName}
                            </p>
                        )}
                    </div>

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
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.username && (
                            <p className="text-red-500 text-sm">
                                {errors.username}
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
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm">
                                {errors.email}
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
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm">
                                {errors.password}
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
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    <div className="mb-4 flex items-center">
                        <input
                            type="checkbox"
                            id="termsAccepted"
                            name="termsAccepted"
                            checked={formData.termsAccepted}
                            onChange={handleChange}
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
                            <p className="text-red-500 text-sm ml-2">
                                {errors.termsAccepted}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Sign Up
                    </button>

                    {submit && <p className="mt-4 text-center">{submit}</p>}
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
