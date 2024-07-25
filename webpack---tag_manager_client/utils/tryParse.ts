import { error } from './logger';

export function tryParse(str: string) {
  let res: any = str;
  try {
    res = JSON.parse(str);
  } catch (e) {
    error('Parse error in string');
    error((e as any).message);
  }
  return res;
}

export function dumbClone(obj: any) {
  return tryParse(JSON.stringify(obj));
}
