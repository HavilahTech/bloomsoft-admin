"use client";

const Loader = () => {
  return (
    <div className="w-full h-screen flex flex-col justify-center items-center gap-6 bg-white">
      <div className="flex items-center justify-center space-x-2 w-full">
        <span className="w-3 h-3 rounded-full bg-brand/80 animate-ping [animation-delay:0s]" />
        <span className="w-3 h-3 rounded-full bg-brand/80 animate-ping [animation-delay:0.2s]" />
        <span className="w-3 h-3 rounded-full bg-brand/80 animate-ping [animation-delay:0.4s]" />
      </div>
      <p className="font-medium text-gray-500 text-sm">Creating spaces...</p>
    </div>
  );
};

export default Loader;
