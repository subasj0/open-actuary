import json,pathlib,sqlite3
root=pathlib.Path(__file__).resolve().parents[1]
statements=[]
def q(x):return 'NULL' if x is None else "'"+str(x).replace("'","''")+"'"
for f in (root/'migration-source').glob('*.json'):
 for d in json.loads(f.read_text()):
  # This is an exact migration of an already-live snapshot, preserving its original review.
  content=d['published'] or d['draft']; rev=d['publishedRevision'] or d['revision']; review=d.get('publishedReview') or d.get('review')
  values=[d['id'],d['kind'],d['courseId'],json.dumps(content),rev,json.dumps(content),rev,json.dumps(review) if review else None,d['updatedAt'],json.dumps(review) if review else None]
  statements.append('INSERT INTO documents(id,kind,course_id,draft,revision,published,published_revision,review,updated_at,published_review) VALUES('+','.join(q(v) for v in values)+');')
  statements.append('INSERT INTO revisions VALUES('+','.join(q(v) for v in [d['id'],rev,json.dumps(content),d['updatedAt'],'Migrated exact published snapshot from original Site'])+');')
(root/'migrations/0003_live_content.sql').write_text('\n'.join(statements)+'\n')
print('Migration documents:',len(statements)//2)
