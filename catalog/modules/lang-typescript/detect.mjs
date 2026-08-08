export default function detect({ dependency }) {
  const evidence = dependency('typescript');
  return {
    applies: evidence.length > 0,
    reason: 'The target declares TypeScript in its package manifest.',
    evidence,
  };
}
