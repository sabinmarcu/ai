import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  parse,
  stringify,
} from 'yaml';
import type { StackConfig } from '../types.js';

const stackConfigSchema = z.object({
  version: z.number().int().positive(),
  createdAt: z.string(),
  presets: z.array(z.string()),
  modules: z.array(z.string()),
});

export const STACK_PATH = path.join('.ai', 'stack.yml');

export async function readStack(cwd: string): Promise<StackConfig | null> {
  const stackFile = path.join(cwd, STACK_PATH);

  try {
    const raw = await readFile(stackFile, 'utf8');
    const parsed = parse(raw);
    return stackConfigSchema.parse(parsed) as StackConfig;
  } catch {
    return null;
  }
}

export async function writeStack(cwd: string, stack: StackConfig): Promise<void> {
  const stackDirectory = path.join(cwd, '.ai');
  const stackFile = path.join(cwd, STACK_PATH);
  await mkdir(stackDirectory, { recursive: true });
  await writeFile(stackFile, stringify(stack), 'utf8');
}
