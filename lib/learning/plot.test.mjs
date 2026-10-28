import assert from 'node:assert/strict';
import {test} from 'node:test';
import {coverageComparisonExtent,samplingComparisonDomain,samplingShapeDomain} from './plot.ts';
import {gaussian,interval,moments,normalQuantile,sampleMeans,seeded,testNormal} from './math.ts';

test('same-batch coverage uses one domain, halves drawn lengths at four times n, and includes every permitted interval',()=>{
 for(const seed of [78,79,80,240]){
  const rng=seeded(seed),zs=Array.from({length:50},()=>gaussian(rng));
  const extent=coverageComparisonExtent(zs,20/Math.sqrt(5),normalQuantile(.995));
  const x=(v)=>55+(v-(100-extent))/(2*extent)*580;
  const rows=(n,c)=>zs.map(z=>{const mean=100+20/Math.sqrt(n)*z;return interval(mean,20,n,c);});
  const a=rows(25,.95),b=rows(100,.95);
  assert.equal(a.filter(v=>v.lower<=100&&100<=v.upper).length,b.filter(v=>v.lower<=100&&100<=v.upper).length);
  a.forEach((v,i)=>assert.ok(Math.abs((x(v.upper)-x(v.lower))/2-(x(b[i].upper)-x(b[i].lower)))<1e-10));
  for(let n=5;n<=200;n++)for(const c of [.9,.95,.99])for(const v of rows(n,c)){
   assert.ok(x(v.lower)>=55&&x(v.upper)<=635,'no endpoint clips');
  }
 }
 assert.ok(Math.abs(interval(100,20,25,.95).half*2-15.6797023)<1e-6);
});

test('sampling retains a comparison scale at n=4 and 64, expands for outliers, and never drops plotted values',()=>{
 for(const kind of ['normal','exponential','bernoulli']){
  const m=moments(kind),largestSE=m.sd/Math.sqrt(2);
  let domain=samplingComparisonDomain(null,m.mean,largestSE,sampleMeans(kind,4,200,43));
  const initial=domain;
  domain=samplingComparisonDomain(domain,m.mean,largestSE,sampleMeans(kind,64,200,43));
  assert.equal(domain,initial,'intended comparison must keep its axis');
  const plotWidth=(sd)=>sd/(domain.hi-domain.lo)*584;
  assert.equal(plotWidth(m.sd/8)*4,plotWidth(m.sd/2));
  for(const n of [2,4,64,100]){
   const values=sampleMeans(kind,n,500,44);
   domain=samplingComparisonDomain(domain,m.mean,largestSE,values);
   assert.ok(values.every(v=>v>=domain.lo&&v<=domain.hi));
  }
  const expanded=samplingComparisonDomain(domain,m.mean,largestSE,[domain.hi+10]);
  assert.equal(expanded.hi,domain.hi+10);assert.equal(expanded.lo,domain.lo);
 }
});

test('published numerical test examples remain unchanged',()=>{
 const a=testNormal(106,100,20,25,.05,false,108),b=testNormal(106,100,20,100,.05,false,108);
 assert.equal(a.z,1.5);assert.equal(b.z,3);
 assert.ok(Math.abs(a.p-.06680723)<1e-7);assert.ok(Math.abs(b.p-.00134997)<1e-7);
 assert.ok(Math.abs(a.power-.63876003)<1e-7);
});


test('shape inspection fits current SE without dropping any observation or mutating comparison scale',()=>{
 for(const kind of ['normal','exponential','bernoulli']){
  const m=moments(kind),values=sampleMeans(kind,64,200,43),se=m.sd/8;
  const comparison=samplingComparisonDomain(null,m.mean,m.sd/Math.sqrt(2),values);
  const before={...comparison},shape=samplingShapeDomain(m.mean,se,values);
  assert.ok(values.every(v=>v>=shape.lo&&v<=shape.hi));
  assert.ok(shape.lo<=m.mean-4*se&&shape.hi>=m.mean+4*se);
  assert.ok((shape.hi-shape.lo)<(comparison.hi-comparison.lo));
  assert.ok(4*se/((shape.hi-shape.lo)/22)>8,'central normal-reference span has enough histogram bins');
  assert.deepEqual(comparison,before);
  const outliers=[shape.lo-100,shape.hi+100];
  const expanded=samplingShapeDomain(m.mean,se,[...values,...outliers]);
  assert.ok(outliers.every(v=>v>=expanded.lo&&v<=expanded.hi));
 }
});
