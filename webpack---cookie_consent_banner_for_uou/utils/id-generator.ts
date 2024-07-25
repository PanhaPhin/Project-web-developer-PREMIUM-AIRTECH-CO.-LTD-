const prefix = 'policy.banner.id';
let index = 0;
export const generateId = (): string => {
  const id = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 10);

  return `${prefix}_${++index}_${id}`;
};
