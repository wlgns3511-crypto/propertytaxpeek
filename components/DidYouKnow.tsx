export function DidYouKnow({ fact }: { fact: string }) {
  return (
    <div className="my-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-sm font-semibold text-amber-900 mb-1">Did You Know?</p>
      <p className="text-sm text-amber-800">{fact}</p>
    </div>
  );
}
