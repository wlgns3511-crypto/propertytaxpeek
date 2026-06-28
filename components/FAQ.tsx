interface FAQItem {
  question: string;
  answer: string;
}

export function FAQ({ items }: { items: FAQItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <details key={i} className="border border-slate-200 rounded-lg" open={i === 0}>
            <summary className="p-4 cursor-pointer font-medium hover:bg-slate-50">
              {item.question}
            </summary>
            <div className="px-4 pb-4 text-slate-600">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
