function isPublishableLibrary(packageJson) {
  const scripts = packageJson?.scripts;
  return Boolean(
    packageJson?.name
    && packageJson.private !== true
    && !(scripts && typeof scripts === 'object' && typeof scripts.start === 'string'),
  );
}

export default function detect({ packageJson, dependency }) {
  const evidence = dependency('@types/node');
  const applies = isPublishableLibrary(packageJson) && evidence.length > 0;
  return {
    applies,
    reason: 'The publishable target declares Node.js type definitions.',
    evidence,
  };
}
