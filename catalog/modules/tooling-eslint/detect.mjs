const configFiles = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
];

export default function detect({ dependency, exists }) {
  const evidence = dependency('eslint');
  if (evidence.length === 0) {
    return {
      applies: false,
      reason: 'The target does not declare ESLint in its package manifest.',
      evidence: [],
    };
  }

  for (const configFile of configFiles) {
    if (exists(configFile)) {
      evidence.push({
        kind: 'file',
        value: configFile,
      });
    }
  }

  return {
    applies: true,
    reason: 'The target declares ESLint in its package manifest.',
    evidence,
  };
}
