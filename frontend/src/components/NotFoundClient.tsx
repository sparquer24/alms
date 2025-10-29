"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Type assertion for Next.js Link to fix React 18 compatibility
const LinkFixed = Link as any;

export default function NotFoundClient() {
  const router = useRouter();
  const [count, setCount] = useState(8);

  useEffect(() => {
    const t = setInterval(() => {
      setCount((prev) => {
        if (prev === 1) {
          clearInterval(t);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 text-white p-6">
      <div className="max-w-2xl w-full bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-10 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Oopsie-daisy! 🚀</h1>
        <p className="text-lg mb-4">Looks like the page you&apos;re trying to reach has gone on a coffee break — or got abducted by space narwhals.</p>
        <p className="mb-6">Don&apos;t worry — we&apos;ll get you back on track.</p>

        <div className="flex items-center justify-center gap-4">
          <LinkFixed
            href="/"
            className="px-4 py-2 rounded-lg bg-white text-purple-700 font-semibold hover:scale-105 transform transition"
          >
            Go back home
          </LinkFixed>

          <LinkFixed
            href="/"
            className="px-4 py-2 rounded-lg border border-white border-opacity-30 hover:bg-white hover:bg-opacity-10 transition"
          >
            Try previous
          </LinkFixed>
        </div>

        <div className="mt-6 text-sm text-white text-opacity-80">
          <p>404 — Cosmic breadcrumbs lost. If you keep seeing this, maybe check your URL or wink at the developer 🫣</p>
        </div>
      </div>
    </div>
  );
}
