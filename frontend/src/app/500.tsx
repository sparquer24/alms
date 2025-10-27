'use client';

export const dynamic = 'force-dynamic';

export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-orange-500 p-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center text-white">
        <h1 className="text-6xl font-bold mb-4">500</h1>
        <h2 className="text-2xl font-semibold mb-4">Server Error</h2>
        <p className="text-lg mb-6 opacity-90">
          Something went wrong on our end. Please try again later.
        </p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-white text-red-600 font-semibold rounded-lg hover:scale-105 transition-transform"
        >
          Go home
        </a>
      </div>
    </div>
  );
}