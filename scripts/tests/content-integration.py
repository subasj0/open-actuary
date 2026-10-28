"""Local-only HTTP/D1 integration checks. Does not publish to a hosted Site."""
import concurrent.futures,copy,http.cookiejar,json,os,time,urllib.error,urllib.parse,urllib.request,uuid
from pathlib import Path
base=os.environ.get('TEST_BASE_URL','http://127.0.0.1:8787')
assert urllib.parse.urlsplit(base).hostname in ('127.0.0.1','localhost'), 'Use only a disposable local preview.'
# Local disposable fixture identity, never a production bypass.
import sqlite3,hashlib,secrets
fixture_token=secrets.token_hex(32)
for path in Path('.wrangler/state/v3/d1').rglob('*.sqlite'):
 conn=sqlite3.connect(path)
 if conn.execute("SELECT 1 FROM sqlite_master WHERE name='users'").fetchone():
  conn.execute("INSERT OR IGNORE INTO users VALUES('content-test-author','Content test author','author',NULL)")
  conn.execute('INSERT INTO sessions VALUES(?,?,?)',(hashlib.sha256(fixture_token.encode()).hexdigest(),'content-test-author',int(time.time()*1000)+3600000));conn.commit()
cookie='__Host-oa-session='+fixture_token
results=[]
def req(path,body=None,author=True,expected=200,extra=None):
 headers={'content-type':'application/json'}
 if author:headers['cookie']=cookie
 if extra:headers.update(extra)
 data=None if body is None else json.dumps(body).encode()
 request=urllib.request.Request(base+path,data=data,headers=headers)
 try:
  with urllib.request.urlopen(request)as response:status=response.status;value=json.load(response)
 except urllib.error.HTTPError as e:
  status=e.code;raw=e.read().decode()
  try:value=json.loads(raw)
  except json.JSONDecodeError:value={'error':raw}
 assert status==expected,(path,status,value)
 return value

def passed(name):results.append(name);print('PASS:',name)
assert req('/api/session')['author'];assert not req('/api/session',author=False)['author'];passed('owner session and anonymous distinction')
p=copy.deepcopy(json.loads(Path('content/pilot.json').read_text()));suffix=uuid.uuid4().hex[:8];cid='qa-course-'+suffix;lid='qa-lesson-'+suffix
course=p['course'];course.update(id=cid,title='QA fixture '+suffix,chapters=[{'id':'first','title':'Test chapter','lessonIds':[lid]}])
lesson=p['lessons'][0];lesson.update(id=lid,courseId=cid)
req('/api/save-course',{'course':course,'expectedRevision':0},author=False,expected=403)
req('/api/save-course',{'course':course,'expectedRevision':0},extra={'origin':'https://unrelated.invalid'},expected=403)
c=req('/api/save-course',{'course':course,'expectedRevision':0});assert c['revision']==1
req('/api/publish/'+cid,{'expectedRevision':1},expected=422)
l=req('/api/save-lesson',{'lesson':lesson,'expectedRevision':0});assert l['revision']==1
req('/api/lesson/'+lid,author=False,expected=404);req('/api/lesson/'+lid+'?draft=1',author=False,expected=403)
passed('new content stays draft; author and same-origin write restrictions hold')
checks={k:'TEST FIXTURE ONLY: exercises version gates, not actual educational approval.' for k in ('technical','pedagogy','interaction','accessibility','originality')}
def review(revision):return {'revision':revision,'reviewer':'Local automated fixture (not real content review)','level':'pilot','checks':checks,'unresolved':[]}
req('/api/review/'+lid,review(2),expected=422)
req('/api/review/'+cid,review(1));req('/api/publish/'+cid,{'expectedRevision':1})
req('/api/publish/'+lid,{'expectedRevision':1},expected=422)
req('/api/review/'+lid,review(1));req('/api/publish/'+lid,{'expectedRevision':1})
assert req('/api/lesson/'+lid,author=False)['draft']['title']==lesson['title'];passed('publication requires exact review and published parent outline')
changed=copy.deepcopy(lesson);changed['title']='Changed draft, live stays fixed'
l=req('/api/save-lesson',{'lesson':changed,'expectedRevision':1});assert l['revision']==2 and l['review']is None
live=req('/api/lesson/'+lid,author=False);assert live['draft']['title']==lesson['title'] and live['review']['revision']==1
req('/api/save-lesson',{'lesson':changed,'expectedRevision':1},expected=409);passed('draft changes preserve live content AND its original review; stale save rejected')
def race(name):
 data=copy.deepcopy(changed);data['subtitle']=name
 try:return req('/api/save-lesson',{'lesson':data,'expectedRevision':2})['revision']
 except AssertionError as e:
  assert e.args[0][1]==409,e
  return 'conflict'
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:outcomes=list(pool.map(race,['First writer','Second writer']))
assert sorted(map(str,outcomes))==['3','conflict'],outcomes
assert len(req('/api/revisions/'+lid))==3
restored=req('/api/restore/'+lid,{'revision':1,'expectedRevision':3});assert restored['revision']==4 and restored['review']is None and restored['draft']['title']==lesson['title']
assert req('/api/lesson/'+lid,author=False)['revision']==1;passed('simultaneous writers do not overwrite; immutable history and restore preserve live snapshot')
package=req('/api/export/'+cid);req('/api/import',package,expected=409)
newcid='qa-import-'+suffix;newlid='qa-imported-'+suffix;package['course']['id']=newcid;package['course']['chapters'][0]['lessonIds']=[newlid];package['lessons'][0].update(id=newlid,courseId=newcid)
req('/api/import',package);imported=req('/api/lesson/'+newlid+'?draft=1');assert imported['review']is None and imported['published']is None
passed('portable import is draft-only and never silently overwrites or inherits approval')
progress={'completed':False,'bookmarked':True,'notes':'Local integration test note','attempts':{}}
req('/api/progress/'+lid,progress);assert req('/api/progress/'+lid)['notes']==progress['notes'];req('/api/progress/'+lid,author=False,expected=401)
passed('learning records persist and require signed-in identity')
req('/api/unpublish/'+cid,{'expectedRevision':1});req('/api/lesson/'+lid,author=False,expected=404)
passed('unpublished course also hides its lessons from public reads')
Path('docs/integration-results.json').write_text(json.dumps({'base':base,'date':time.strftime('%Y-%m-%d'),'passed':results,'fixtureCourse':cid,'fixtureState':'unpublished local test records retained as drafts'},indent=2)+'\n')
print(len(results),'integration scenarios passed.')
