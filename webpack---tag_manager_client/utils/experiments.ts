import { boolString } from '../types';

export function isExperimentOpen(
  experiments: Record<string, boolString> | undefined,
  spec: string,
): boolean {
  return !!(experiments && experiments[spec] === 'true');
}
