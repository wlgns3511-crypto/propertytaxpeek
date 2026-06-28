"use client";

import { useState } from "react";

export function DataFeedback() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="text-sm text-stone-500 mt-4 p-3 bg-stone-50 rounded-lg">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <div className="text-sm text-stone-500 mt-4 p-3 bg-stone-50 rounded-lg flex items-center gap-3">
      <span>Was this data helpful?</span>
      <button
        onClick={() => setSubmitted(true)}
        className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100"
      >
        Yes
      </button>
      <button
        onClick={() => setSubmitted(true)}
        className="px-3 py-1 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-full hover:bg-stone-100"
      >
        No
      </button>
    </div>
  );
}
