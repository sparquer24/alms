"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Image from "next/image";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggedIn } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/admin/reports");
    }
  }, [isLoggedIn, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, pin)) {
      router.push("/admin/reports");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: 'url("/backgroundIMGALMS.jpeg")' }}>
      <div className="max-w-md w-full space-y-6 bg-white/95 p-10 rounded-lg shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <Image
              src="/icon-alms.svg"
              alt="ALMS Logo"
              width={80}
              height={80}
              className="drop-shadow-md"
              priority
            />
          </div>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-black">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-700">
            Sign in to access the admin dashboard
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-400 rounded-md p-4 mb-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:border-[#001F54] focus:z-10 sm:text-sm bg-white/90"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pin" className="sr-only">PIN</label>
              <input
                id="pin"
                name="pin"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#001F54] focus:border-[#001F54] focus:z-10 sm:text-sm bg-white/90"
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-[#001F54] hover:bg-[#112a61] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001F54] shadow-md transition-all duration-200 text-white font-semibold"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
