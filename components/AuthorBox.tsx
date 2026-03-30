export function AuthorBox() {
  return (
    <div className="mt-10 flex gap-4 p-5 bg-blue-50 border-blue-200 border rounded-xl">
      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
        <span>🏠</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-slate-900 text-sm">PropertyTaxPeek Research Team</span>
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">Real Estate Tax & Assessment Analysts</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          Our property tax specialists track assessment rates, exemption programs, and appeal processes across all US counties. Data sourced from county assessor records and state revenue department filings.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">✓ County Data Verified</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">✓ 3,000+ Counties</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">✓ Annual Updates</span>
        </div>
      </div>
    </div>
  );
}
