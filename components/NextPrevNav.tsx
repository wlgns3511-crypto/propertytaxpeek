interface NavItem {
  name: string;
  slug: string;
}

interface Props {
  prev: NavItem | null;
  next: NavItem | null;
  entitySlug: string;
}

export function NextPrevNav({ prev, next, entitySlug }: Props) {
  if (!prev && !next) return null;

  return (
    <nav className="flex items-stretch border border-stone-200 rounded-lg overflow-hidden my-6" aria-label="Previous and next items">
      {prev ? (
        <a href={`/${entitySlug}/${prev.slug}/`}
          className="flex-1 flex items-center gap-2 p-3 hover:bg-stone-50 transition-colors text-sm group">
          <span className="text-stone-400 group-hover:text-amber-700 text-lg">&larr;</span>
          <div className="min-w-0">
            <div className="text-xs text-stone-400">Previous</div>
            <div className="font-medium text-stone-700 group-hover:text-amber-800 truncate">{prev.name}</div>
          </div>
        </a>
      ) : <div className="flex-1" />}

      <div className="w-px bg-stone-200" />

      {next ? (
        <a href={`/${entitySlug}/${next.slug}/`}
          className="flex-1 flex items-center justify-end gap-2 p-3 hover:bg-stone-50 transition-colors text-sm text-right group">
          <div className="min-w-0">
            <div className="text-xs text-stone-400">Next</div>
            <div className="font-medium text-stone-700 group-hover:text-amber-800 truncate">{next.name}</div>
          </div>
          <span className="text-stone-400 group-hover:text-amber-700 text-lg">&rarr;</span>
        </a>
      ) : <div className="flex-1" />}
    </nav>
  );
}
