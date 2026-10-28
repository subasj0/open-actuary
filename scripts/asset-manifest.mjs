import {readdirSync,readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const manifest={};
function walk(dir){for(const name of readdirSync(dir)){const p=dir+'/'+name;if(statSync(p).isDirectory())walk(p);else{const b=readFileSync(p);manifest[p.slice('dist/public'.length)]={hash:createHash('sha256').update(b).digest('hex').slice(0,32),size:b.length};}}}
walk('dist/public');console.log(JSON.stringify(manifest));
