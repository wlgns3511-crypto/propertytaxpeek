import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-4xl font-bold text-stone-800 mb-4">Page Not Found</h1>
      <p className="text-stone-500 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="text-amber-700 hover:text-amber-900 font-medium underline">
        &larr; Back to PropertyTaxPeek
      </Link>
    </div>
  );
}
