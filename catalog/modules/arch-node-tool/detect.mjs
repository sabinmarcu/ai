export default function detect({ packageJson }) {
  const applies = Boolean(packageJson?.bin);
  return {
    applies,
    reason: 'The target declares an executable package entrypoint.',
    evidence: applies
      ? [{
        kind: 'manifest',
        value: 'package.json#bin',
      }]
      : [],
  };
}
