const webDependencies = ['react', 'react-dom', 'next', 'vite', 'vue', '@angular/core', 'svelte'];

export default function detect({ packageJson, dependency }) {
  const evidence = webDependencies.flatMap((name) => dependency(name));
  const applies = Boolean(packageJson?.private === true && !packageJson.bin && evidence.length > 0);
  return {
    applies,
    reason: 'The private target declares browser application tooling or a web framework.',
    evidence: applies
      ? [{
        kind: 'manifest',
        value: 'package.json#private',
      }, ...evidence]
      : [],
  };
}
