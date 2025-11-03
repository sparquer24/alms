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
        {/*
          Defensive inline script: some third-party bundles or browser extensions
          attempt to read localStorage keys (eg. 'floatingSidebar') very early and
          may call Object.keys on a null value which throws. Inject a tiny script
          here to ensure a safe default exists before other scripts run.
        */}
        <script dangerouslySetInnerHTML={{ __html: `try{(function(){var k='floatingSidebar';if(typeof localStorage!=='undefined'){var r=localStorage.getItem(k);if(r===null||r==='null'||r==='undefined'){localStorage.setItem(k,JSON.stringify({}));}}try{if(typeof window!=='undefined'){window.floatingSidebar=window.floatingSidebar||{}}}catch(e){} })()}catch(e){};` }} />
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
