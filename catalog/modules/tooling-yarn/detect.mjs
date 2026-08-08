export default function detect({ exists, packageJson }) {
  const packageManager = packageJson?.packageManager;
  const evidence = [];

  if (typeof packageManager === 'string' && packageManager.startsWith('yarn@')) {
    evidence.push({
      kind: 'manifest',
      value: `packageManager:${packageManager}`,
    });
  }
  if (exists('yarn.lock')) {
    evidence.push({
      kind: 'file',
      value: 'yarn.lock',
    });
  }
  if (exists('.yarnrc.yml')) {
    evidence.push({
      kind: 'file',
      value: '.yarnrc.yml',
    });
  }

  return {
    applies: evidence.length > 0,
    reason: 'The target uses Yarn.',
    evidence,
  };
}
