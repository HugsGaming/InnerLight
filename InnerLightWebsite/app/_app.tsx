import type { AppProps } from "next/app";
import { ReCaptchaProvider } from "next-recaptcha-v3";
import "../styles/globals.css";

const MyApp = ({ Component, pageProps }: AppProps) => {
    return (
        <ReCaptchaProvider reCaptchaKey="6LdMICYqAAAAAKh9MmH4M4hPVqqMOyZIbqvIWfLc">
            <Component {...pageProps} />
        </ReCaptchaProvider>
    );
};

export default MyApp;
