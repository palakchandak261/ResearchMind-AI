import sqlite3

con = sqlite3.connect("researchgraph.db")
cur = con.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [r[0] for r in cur.fetchall()]
print(f"Total relational tables: {len(tables)}")
print("-" * 45)
total_rows = 0
for t in sorted(tables):
    cur.execute(f"SELECT count(1) FROM {t}")
    cnt = cur.fetchone()[0]
    total_rows += cnt
    print(f"  {t:26}: {cnt:>5} rows")
print("-" * 45)
print(f"Total persisted database records: {total_rows}")
con.close()
