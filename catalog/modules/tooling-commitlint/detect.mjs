export default function detect({ dependency }) {
  const evidence = dependency('@commitlint/cli');
  return {
    applies: evidence.length > 0,
    reason: 'The target declares commitlint in its package manifest.',
    evidence,
  };
}
