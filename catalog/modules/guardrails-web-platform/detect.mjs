const webDependencies = ['react-dom', 'next', 'vite', '@angular/core', 'svelte'];

export default function detect({ dependency }) {
  const evidence = webDependencies.flatMap((name) => dependency(name));
  return {
    applies: evidence.length > 0,
    reason: 'The target declares web platform tooling in its package manifest.',
    evidence,
  };
}
