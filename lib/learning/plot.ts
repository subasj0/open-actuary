export type PlotDomain={lo:number;hi:number};

// Keep a comparison scale until more room is required; never discard an outlier.
export function samplingComparisonDomain(previous:PlotDomain|null,mean:number,largestSE:number,values:number[]):PlotDomain {
 const lo=Math.min(previous?.lo??mean-4*largestSE,...values);
 const hi=Math.max(previous?.hi??mean+4*largestSE,...values);
 return previous&&lo===previous.lo&&hi===previous.hi?previous:{lo,hi};
}

// Reserve enough room for every permitted n/confidence on this standardized batch.
export function coverageComparisonExtent(standardized:number[],largestSE:number,largestCritical:number) {
 return (Math.max(...standardized.map(Math.abs))+largestCritical)*largestSE*1.05;
}

// Fit the current sampling distribution for shape inspection without removing data.
export function samplingShapeDomain(mean:number,se:number,values:number[]):PlotDomain {
 return samplingComparisonDomain(null,mean,se,values);
}
