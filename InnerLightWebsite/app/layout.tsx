import { type ReactNode } from "react";
import "./globals.css";
import GoogleCaptchaWrapper from "./GoogleCaptchaWrapper";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <GoogleCaptchaWrapper>{children}</GoogleCaptchaWrapper>
            </body>
        </html>
    );
}
