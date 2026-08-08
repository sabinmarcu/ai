export default function detect({ dependency }) {
  const evidence = dependency('husky');
  return {
    applies: evidence.length > 0,
    reason: 'The target declares Husky in its package manifest.',
    evidence,
  };
}
