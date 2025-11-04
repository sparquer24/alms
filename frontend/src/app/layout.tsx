import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootProviders from '../components/RootProviders';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <head>
        <title>Arms License Dashboard</title>
        <meta name="description" content="Dashboard for arms license processing" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <div className="w-full">
          {/* RootProviders is a client component that contains all context/providers */}
          <RootProviders>{children}</RootProviders>
        </div>
      </body>
    </html>
  );
}
