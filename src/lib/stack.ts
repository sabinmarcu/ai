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

export const STACK_VERSION = 2;

const stackConfigBaseSchema = z.object({
  version: z.literal(STACK_VERSION),
  createdAt: z.string().datetime(),
  presets: z.array(z.string()),
  modules: z.array(z.string()),
});

const stackConfigSchema = z.discriminatedUnion('assetMode', [
  stackConfigBaseSchema.extend({
    assetMode: z.literal('materialized'),
  }).strict(),
  stackConfigBaseSchema.extend({
    assetMode: z.literal('source'),
    catalogRoot: z.string().min(1),
  }).strict(),
]);

export const STACK_PATH = path.join('.ai', 'stack.yml');

export async function readStack(cwd: string): Promise<StackConfig | null> {
  const stackFile = path.join(cwd, STACK_PATH);

  try {
    const raw = await readFile(stackFile, 'utf8');
    const parsed = parse(raw);
    return stackConfigSchema.parse(parsed) as StackConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export async function writeStack(cwd: string, stack: StackConfig): Promise<void> {
  const stackDirectory = path.join(cwd, '.ai');
  const stackFile = path.join(cwd, STACK_PATH);
  const validatedStack = stackConfigSchema.parse(stack);
  await mkdir(stackDirectory, { recursive: true });
  await writeFile(stackFile, stringify(validatedStack), 'utf8');
}
