import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import WhatsAppButton from "./components/WhatsAppButton";
import AuthGuard from "./components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Escáner de Incidentes - QUINTA COMPAÑIA",
    description: "Digitaliza informes de incidentes",
    icons: {
        icon: '/logo.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <AuthGuard>
                    <Navigation />
                    {children}
                    <WhatsAppButton />
                </AuthGuard>
            </body>
        </html>
    );
}
