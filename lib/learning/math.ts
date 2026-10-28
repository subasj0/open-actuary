// Deterministic instructional mathematics. Simulation is illustrative, never a proof.
export function normalPdf(x:number) { return Math.exp(-x*x/2)/Math.sqrt(2*Math.PI); }
export function normalCdf(x:number) {
 const z=Math.abs(x),t=1/(1+0.2316419*z);
 const tail=normalPdf(z)*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
 return x>=0?1-tail:tail;
}
export function normalQuantile(p:number) {
 if (!(p>0&&p<1)) throw new Error('Probability must lie strictly between zero and one.');
 let lo=-9,hi=9;for(let k=0;k<70;k++){const mid=(lo+hi)/2;if(normalCdf(mid)<p)lo=mid;else hi=mid;}return(lo+hi)/2;
}
export function seeded(seed:number) { let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}; }
export function gaussian(random:()=>number) {return Math.sqrt(-2*Math.log(Math.max(Number.EPSILON,random())))*Math.cos(2*Math.PI*random());}
export function sampleMeans(kind:string,n:number,count:number,seed=42) {
 const random=seeded(seed),values:number[]=[];
 for(let j=0;j<count;j++){let sum=0;for(let i=0;i<n;i++)sum+=kind==='exponential'?-10*Math.log(Math.max(Number.EPSILON,random())):kind==='bernoulli'?(random()<0.3?1:0):10+4*gaussian(random);values.push(sum/n);}return values;
}
export function moments(kind:string) {return kind==='exponential'?{mean:10,sd:10}:kind==='bernoulli'?{mean:.3,sd:Math.sqrt(.21)}:{mean:10,sd:4};}
export function interval(mean:number,sigma:number,n:number,confidence:number) {const half=normalQuantile((1+confidence)/2)*sigma/Math.sqrt(n);return{lower:mean-half,upper:mean+half,half};}
export function testNormal(xbar:number,mu0:number,sigma:number,n:number,alpha:number,twoSided:boolean,mu1:number) {
 const se=sigma/Math.sqrt(n),z=(xbar-mu0)/se,p=twoSided?2*(1-normalCdf(Math.abs(z))):1-normalCdf(z),critical=normalQuantile(1-alpha/(twoSided?2:1));
 const upper=mu0+critical*se,lower=twoSided?mu0-critical*se:-Infinity;
 const power=1-normalCdf((upper-mu1)/se)+(twoSided?normalCdf((lower-mu1)/se):0);
 return{se,z,p,critical,lower,upper,power,reject:p<=alpha};
}
