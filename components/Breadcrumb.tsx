interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-stone-500 mb-4">
      <ol className="flex flex-wrap gap-1 items-center">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-stone-300">/</span>}
            {item.href ? (
              <a href={item.href} className="hover:text-amber-700">
                {item.label}
              </a>
            ) : (
              <span className="text-stone-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
