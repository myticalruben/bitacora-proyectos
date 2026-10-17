"""Validate migrations, edit conflicts, and permanent removal using SQLite."""
import re
import sqlite3
from pathlib import Path
connection = sqlite3.connect(':memory:')
for migration in sorted(Path('drizzle').glob('*.sql')):
    connection.executescript(migration.read_text())
source = Path('lib/projects.ts').read_text()
delete_sql = re.search(r'prepare\(`(INSERT INTO projects .*?RETURNING id)`', source).group(1)
save_sql = re.search(r'prepare\(`(INSERT INTO projects .*?RETURNING \*)`', source).group(1)
def delete(project_id, revision, seed):
    return connection.execute(delete_sql, (project_id, revision+1, 'now', revision, seed, project_id, revision)).fetchone()
assert delete('nix-templates', 0, 1)
assert connection.execute('SELECT content,deleted FROM projects').fetchone() == ('', 1)
assert not delete('nix-templates', 0, 1)
assert not connection.execute(save_sql, ('nix-templates','resurrect','s','c','d',1,1,'now',0,'nix-templates',0)).fetchone()
assert not delete('missing', 0, 0)
connection.execute("INSERT INTO projects (id,title,summary,category,content,published,revision,updated_at,deleted) VALUES ('custom','Title','summary','web','docs',1,2,'now',0)")
assert not delete('custom', 1, 0)
assert delete('custom', 2, 0)
print('Database migrations and concurrency checks passed.')
