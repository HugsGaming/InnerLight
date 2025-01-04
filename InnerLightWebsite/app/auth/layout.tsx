import { type ReactNode } from "react";
import { ReCaptchaProvider } from "next-recaptcha-v3";
import "../globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
