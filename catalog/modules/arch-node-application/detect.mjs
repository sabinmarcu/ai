const webDependencies = ['react', 'react-dom', 'next', 'vite', 'vue', '@angular/core', 'svelte'];

export default function detect({ packageJson, dependency }) {
  const scripts = packageJson?.scripts;
  const hasStartScript = Boolean(
    scripts
    && typeof scripts === 'object'
    && typeof scripts.start === 'string',
  );
  const hasBinary = Boolean(packageJson?.bin);
  const hasWebDependency = webDependencies.some((name) => dependency(name).length > 0);
  const applies = hasStartScript && !hasBinary && !hasWebDependency;

  return {
    applies,
    reason: 'The target declares a production Node.js server or service entrypoint.',
    evidence: applies
      ? [{
        kind: 'manifest',
        value: 'package.json#scripts.start',
      }]
      : [],
  };
}
