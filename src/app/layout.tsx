import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MASLABS - 혁신적인 골프 경험",
  description: "골퍼들은 공을 멀리 보냈을 때 살아 있음을 느낀다. MASGOLF - 혁신적인 골프 경험을 제공합니다.",
  keywords: ["골프", "MASLABS", "MASGOLF", "골프장", "골프용품"],
  authors: [{ name: "MASLABS" }],
  openGraph: {
    title: "MASLABS - 혁신적인 골프 경험",
    description: "골퍼들은 공을 멀리 보냈을 때 살아 있음을 느낀다",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
