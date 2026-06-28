"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold text-stone-800 mb-4">Something Went Wrong</h1>
      <p className="text-stone-500 mb-8 max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
