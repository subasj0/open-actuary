import {writeFileSync} from 'node:fs';
const base='https://open-actuary.subasj02.workers.dev';const tests=[];
for(const path of ['/api/health','/api/courses','/api/course/cs1-inference','/api/lesson/sampling-means','/api/lesson/cs2-2019-robot-paths-2710','/api/search?q=variance']){const start=performance.now();const r=await fetch(base+path);const body=await r.text();tests.push({path,status:r.status,elapsedMs:Math.round(performance.now()-start),bytes:body.length});if(!r.ok)throw Error(body);}
writeFileSync('docs/hosted-smoke.json',JSON.stringify({checked:'2026-10-28',tests,note:'Single-client smoke observations, not a load test or latency guarantee.'},null,2));console.log(tests);
