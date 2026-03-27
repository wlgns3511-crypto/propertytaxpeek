"use client";

import { useState } from "react";

const SITE_URL = "https://propertytaxpeek.com";

export function EmbedButton() {
  const [show, setShow] = useState(false);
  const embedCode = `<iframe src="${SITE_URL}/embed/tax-calculator/" width="100%" height="500" style="border:1px solid #e2e8f0;border-radius:8px;" title="Property Tax Calculator"></iframe>`;

  return (
    <div className="mt-4">
      <button
        onClick={() => setShow(!show)}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        {show ? "Hide" : "Embed this calculator"}
      </button>
      {show && (
        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 mb-2">
            Copy the code below to embed this calculator on your site:
          </p>
          <textarea
            readOnly
            value={embedCode}
            rows={3}
            className="w-full text-xs font-mono p-2 border border-slate-300 rounded bg-white"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
      )}
    </div>
  );
}
