import sqlite3

conn = sqlite3.connect('backend/language_tutor.db')
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(users)")
cols = [row[1] for row in cursor.fetchall()]
print("Existing users columns:", cols)

if 'email' not in cols:
    print("Adding email column...")
    cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR(120)")
if 'password_hash' not in cols:
    print("Adding password_hash column...")
    cursor.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
if 'salt' not in cols:
    print("Adding salt column...")
    cursor.execute("ALTER TABLE users ADD COLUMN salt VARCHAR(64)")

conn.commit()
cursor.execute("PRAGMA table_info(users)")
print("Updated users columns:", [row[1] for row in cursor.fetchall()])
conn.close()
