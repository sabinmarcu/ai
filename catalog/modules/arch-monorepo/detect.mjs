export default function detect({ packageJson, target }) {
  const applies = target.kind === 'repository' && Boolean(packageJson?.workspaces);
  return {
    applies,
    reason: 'The repository package manifest declares workspaces.',
    evidence: applies
      ? [{
        kind: 'manifest',
        value: 'package.json#workspaces',
      }]
      : [],
  };
}
