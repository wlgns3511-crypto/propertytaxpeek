#!/usr/bin/env python3
import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'taxes.db')
conn = sqlite3.connect(DB_PATH)

conn.execute("""
CREATE TABLE IF NOT EXISTS county_comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    county_a_slug TEXT NOT NULL,
    county_b_slug TEXT NOT NULL
)
""")

# Top 500 counties by population
counties = conn.execute(
    "SELECT slug FROM counties ORDER BY population DESC LIMIT 500"
).fetchall()
slugs = [r[0] for r in counties]

batch = []
for i in range(len(slugs)):
    for j in range(i+1, len(slugs)):
        a, b = sorted([slugs[i], slugs[j]])
        slug = f"{a}-vs-{b}"
        batch.append((slug, a, b))

conn.executemany(
    "INSERT OR IGNORE INTO county_comparisons (slug, county_a_slug, county_b_slug) VALUES (?,?,?)",
    batch
)
conn.commit()
count = conn.execute("SELECT COUNT(*) FROM county_comparisons").fetchone()[0]
print(f"✅ county_comparisons: {count:,} rows")
conn.close()
