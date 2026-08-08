export default function detect({ packageJson, target }) {
  const applies = target.kind === 'repository' && Boolean(packageJson);
  return {
    applies,
    reason: 'The repository root contains a Node package manifest.',
    evidence: applies
      ? [{
        kind: 'file',
        value: 'package.json',
      }]
      : [],
  };
}
