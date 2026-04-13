import Link from "next/link";
import { MoveLeft, Home, armchair } from "lucide-react";

export default function Custom404() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Decorative Element */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <h1 className="text-9xl font-bold text-gray-200 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-xl font-medium text-gray-800 bg-white/40 backdrop-blur-sm px-4 py-1 rounded-full border border-white/50 shadow-sm">
                Page Not Found
              </p>
            </div>
          </div>
        </div>

        {/* Messaging */}
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
          Looking for something?
        </h2>
        <p className="text-gray-600 mb-10 leading-relaxed">
          The interior you&apos;re looking for doesn&apos;t seem to exist. 
          It might have been moved or the link is broken.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-all active:scale-95 shadow-lg shadow-brand/20"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all active:scale-95"
          >
            <MoveLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Subtle Footer */}
        <p className="mt-16 text-sm text-gray-400 font-medium tracking-widest uppercase">
          Blooms Soft Furnishing
        </p>
      </div>
    </div>
  );
}