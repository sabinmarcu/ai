import { render } from 'ink-testing-library';
import {
  expect,
  test,
  vi,
} from 'vitest';
import { ModuleList } from './ModuleList.js';
import type { ModuleListItem } from './ModuleList.js';

const modules: ModuleListItem[] = [
  {
    id: 'arch/first',
    name: 'First',
    category: 'architecture',
    description: 'First module',
    dependedOnBy: [],
    dependsOn: ['lang/second'],
    effective: true,
    selected: true,
    selectedByPresets: [],
    selectionReasons: ['react found in package.json (dependencies)'],
  },
  {
    id: 'lang/second',
    name: 'Second',
    category: 'language',
    description: 'Second module',
    dependedOnBy: ['arch/first'],
    dependsOn: [],
    effective: true,
    selected: false,
    selectedByPresets: [],
    selectionReasons: [],
  },
  {
    id: 'tooling/third',
    name: 'Third',
    category: 'tooling',
    description: 'Third module',
    dependedOnBy: [],
    dependsOn: [],
    effective: true,
    selected: false,
    selectedByPresets: ['preset/tooling'],
    selectionReasons: ['Selected by preset: preset/tooling'],
  },
  {
    id: 'web/fourth',
    name: 'Fourth',
    category: 'web',
    description: 'Fourth module',
    dependedOnBy: [],
    dependsOn: ['lang/second'],
    effective: false,
    selected: false,
    selectedByPresets: [],
    selectionReasons: [],
  },
];

function selectedModule(frame: string | undefined): string | undefined {
  return frame?.match(/^› [●○] (\S+)/mu)?.[1];
}

test('navigates modules with vim and arrow bindings', async () => {
  const { lastFrame, stdin } = render(
    <ModuleList modules={modules} onExit={vi.fn()} />,
  );

  expect(selectedModule(lastFrame())).toBe('arch/first');

  stdin.write('j');
  await vi.waitFor(() => expect(selectedModule(lastFrame())).toBe('lang/second'));

  stdin.write('\u001B[B');
  await vi.waitFor(() => expect(selectedModule(lastFrame())).toBe('tooling/third'));

  stdin.write('k');
  await vi.waitFor(() => expect(selectedModule(lastFrame())).toBe('lang/second'));

  stdin.write('G');
  await vi.waitFor(() => expect(selectedModule(lastFrame())).toBe('web/fourth'));

  stdin.write('g');
  await vi.waitFor(() => expect(selectedModule(lastFrame())).toBe('arch/first'));

  stdin.write('\u001B[A');
  await vi.waitFor(() => expect(selectedModule(lastFrame())).toBe('arch/first'));
});

test('quits with q', () => {
  const onExit = vi.fn();
  const { stdin } = render(<ModuleList modules={modules} onExit={onExit} />);

  stdin.write('q');

  expect(onExit).toHaveBeenCalledOnce();
});

test('shows a Unicode detail tree beneath the active module', async () => {
  const { lastFrame, stdin } = render(
    <ModuleList modules={modules} onExit={vi.fn()} />,
  );

  expect(lastFrame()).toContain('› ● arch/first  selected\n  └─ Selected because');
  expect(lastFrame()).toContain('└─ react found in package.json (dependencies)');
  expect(lastFrame()).not.toContain('Selecting this will also include');

  stdin.write('j');
  await vi.waitFor(() => {
    expect(lastFrame()).toContain('› ● lang/second  dependency\n  └─ Included by');
    expect(lastFrame()).toContain('└─ arch/first');
  });

  stdin.write('j');
  await vi.waitFor(() => {
    expect(lastFrame()).toContain('› ● tooling/third  preset\n  └─ Selected because');
    expect(lastFrame()).toContain('└─ Selected by preset: preset/tooling');
  });

  stdin.write('j');
  await vi.waitFor(() => {
    expect(lastFrame()).toContain('› ○ web/fourth  available\n  └─ Selecting this will also include');
    expect(lastFrame()).toContain('└─ lang/second');
  });
});
