import {readFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
const line=await new Promise(resolve=>{const r=createInterface({input:process.stdin});r.once('line',s=>{r.close();resolve(s);});});
const {jwt,buckets,manifest}=JSON.parse(line);let completion=jwt;
for(const bucket of buckets){const form=new FormData();for(const hash of bucket){const path=Object.keys(manifest).find(p=>manifest[p].hash===hash);const bytes=readFileSync('dist/public'+path);const ext=path.split('.').pop();const mime={html:'text/html',js:'application/javascript',css:'text/css',svg:'image/svg+xml',woff2:'font/woff2',woff:'font/woff',ttf:'font/ttf',zip:'application/zip',json:'application/json'}[ext]||'application/octet-stream';form.append(hash,new Blob([bytes.toString('base64')],{type:mime}),hash);}
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/fe70503d136ba9d31118cd7e7f756483/workers/assets/upload?base64=true',{method:'POST',headers:{authorization:'Bearer '+jwt},body:form});const d=await r.json();if(!d.success)throw Error(JSON.stringify(d.errors));if(d.result?.jwt)completion=d.result.jwt;
}
console.log(JSON.stringify({completion}));
