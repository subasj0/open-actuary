import type {Progress} from './types';
export const progressKey=(account:string,lesson:string)=>'oa-progress:v2:'+encodeURIComponent(account)+':'+lesson;
export function progressForRevision(record:Progress,revision:number):Progress{
 return record.lessonRevision===revision?record:{...record,lessonRevision:revision,completed:false,attempts:{}};
}
