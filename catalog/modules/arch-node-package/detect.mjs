export default function detect({ packageJson }) {
  return {
    applies: Boolean(packageJson),
    reason: 'The target contains a Node package manifest.',
    evidence: packageJson
      ? [{
        kind: 'file',
        value: 'package.json',
      }]
      : [],
  };
}
