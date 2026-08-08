export default function detect({ dependency }) {
  const evidence = dependency('react');
  return {
    applies: evidence.length > 0,
    reason: 'The target declares React in its package manifest.',
    evidence,
  };
}
