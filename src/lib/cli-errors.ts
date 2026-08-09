import { Cli } from 'clipanion';

function errorCauses(error: Error): string[] {
  const causes: string[] = [];
  let { cause } = error;
  while (cause !== undefined) {
    causes.push(cause instanceof Error ? cause.message : String(cause));
    cause = cause instanceof Error ? cause.cause : undefined;
  }
  return causes;
}

export class AiCli extends Cli {
  override error(...parameters: Parameters<Cli['error']>): string {
    const [error, options = {}] = parameters;
    if (!(error instanceof Error) || 'clipanion' in error || error.name !== 'Error') {
      return super.error(...parameters);
    }

    const format = this.format(options.colored);
    const details = errorCauses(error)
      .map((cause) => `  ${format.error('Caused by:')} ${cause}\n`)
      .join('');
    return `${format.error('Error:')} ${error.message}\n${details}`;
  }
}
