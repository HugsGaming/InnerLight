import { ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import About from "../components/settings/About";
import Help from "../components/settings/Help";

export default function Page() {
    return (
        <div
            className={`min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-white dark:bg-gray-700 text-black dark:text-white `}
        >
            <Head>
                <script
                    src="https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.8.0/dist/alpine.min.js"
                    defer
                ></script>
            </Head>
            <Header />
            <Sidebar />
            <div className="ml-14 mt-14 mb-10 md:ml-64">
                <About />
                <Help />
                <ToastContainer />
            </div>
        </div>
    );
}
