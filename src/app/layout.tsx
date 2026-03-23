import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Libre_Baskerville } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "JudgeMate - 喧嘩の仲裁AI",
    template: "%s | JudgeMate",
  },
  description: "友人・カップル・夫婦間の喧嘩をAIが公平に仲裁。論点を整理し、解決策を提案します。",
  keywords: ["AI", "仲裁", "喧嘩", "カップル", "夫婦", "友人", "解決", "判定"],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "JudgeMate",
    title: "JudgeMate - 喧嘩の仲裁AI",
    description: "友人・カップル・夫婦間の喧嘩をAIが公平に仲裁。論点を整理し、解決策を提案します。",
  },
  twitter: {
    card: "summary_large_image",
    title: "JudgeMate - 喧嘩の仲裁AI",
    description: "友人・カップル・夫婦間の喧嘩をAIが公平に仲裁。",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JudgeMate",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${libreBaskerville.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
