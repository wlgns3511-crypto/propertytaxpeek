export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 py-8">
      <div className="h-8 bg-stone-200 rounded w-2/3" />
      <div className="h-4 bg-stone-200 rounded w-full" />
      <div className="h-4 bg-stone-200 rounded w-5/6" />
      <div className="space-y-3 mt-8">
        <div className="h-32 bg-stone-100 rounded-lg" />
        <div className="h-32 bg-stone-100 rounded-lg" />
      </div>
    </div>
  );
}
