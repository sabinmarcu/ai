function isPublishableLibrary(packageJson) {
  const scripts = packageJson?.scripts;
  return Boolean(
    packageJson?.name
    && packageJson.private !== true
    && !packageJson.bin
    && !(scripts && typeof scripts === 'object' && typeof scripts.start === 'string'),
  );
}

export default function detect({ packageJson, dependency }) {
  const nodeTypeEvidence = dependency('@types/node');
  const applies = isPublishableLibrary(packageJson) && nodeTypeEvidence.length === 0;
  return {
    applies,
    reason: 'The publishable target does not declare Node.js type definitions.',
    evidence: applies
      ? [{
        kind: 'manifest',
        value: 'package.json#name',
      }]
      : [],
  };
}
