import type { Metadata } from "next";
import { getAllPosts, getAllCategories } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Property Tax Guides & Resources",
  description:
    "Expert guides on property taxes: how to appeal assessments, homestead exemptions, state-by-state breakdowns, and strategies to lower your property tax bill.",
  alternates: { canonical: "/blog/" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Property Tax Guides &amp; Resources
      </h1>
      <p className="text-slate-600 mb-8">
        Expert articles on lowering your property tax bill, understanding
        exemptions, and navigating the appeals process.
      </p>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <span
            key={cat}
            className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Post list */}
      <div className="space-y-6">
        {posts.map((post) => (
          <a
            key={post.slug}
            href={`/blog/${post.slug}/`}
            className="block group"
          >
            <article className="border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-slate-400">
                  {post.readingTime} min read
                </span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 mb-2 leading-snug">
                {post.title}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {post.description}
              </p>
              <p className="text-xs text-slate-400 mt-3">
                {formatDate(post.publishedAt)}
                {post.updatedAt && post.updatedAt !== post.publishedAt && (
                  <span className="ml-2">
                    · Updated {formatDate(post.updatedAt)}
                  </span>
                )}
              </p>
            </article>
          </a>
        ))}
      </div>
    </>
  );
}
