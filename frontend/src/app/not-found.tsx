'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center text-white">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-lg mb-6 opacity-90">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:scale-105 transition-transform"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}