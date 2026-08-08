export default function detect({ dependency }) {
  const evidence = dependency('lint-staged');
  return {
    applies: evidence.length > 0,
    reason: 'The target declares lint-staged in its package manifest.',
    evidence,
  };
}
