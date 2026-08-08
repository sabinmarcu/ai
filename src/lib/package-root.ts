import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function getPackageRoot(): string {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDirectory, '..', '..');
}
