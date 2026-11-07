import sqlite3
import json

conn = sqlite3.connect('researchgraph.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in c.fetchall()]
print("=== DATABASE TABLES & ROW COUNTS ===")
for t in tables:
    count = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f"Table: {t:25} | Rows: {count}")

print("\n=== SAMPLE PAPERS ===")
c.execute("SELECT id, title, publication_year, citation_count, source FROM papers LIMIT 5")
for row in c.fetchall():
    print(row)

print("\n=== SAMPLE CLAIMS ===")
c.execute("SELECT id, paper_id, claim_text, confidence FROM claims LIMIT 3")
for row in c.fetchall():
    print(row)

print("\n=== SAMPLE METHODOLOGIES ===")
c.execute("SELECT id, name, category FROM methodologies LIMIT 5")
for row in c.fetchall():
    print(row)

print("\n=== SAMPLE USERS ===")
c.execute("SELECT id, username, email, role FROM users")
for row in c.fetchall():
    print(row)

conn.close()
