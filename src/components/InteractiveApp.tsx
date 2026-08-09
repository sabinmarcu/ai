import {
  Box,
  Text,
  useApp,
} from 'ink';
import { ModuleList } from './ModuleList.js';
import type { ModuleListItem } from './ModuleList.js';

export type InteractiveAppProps = {
  modules: ModuleListItem[];
};

export function InteractiveApp({ modules }: InteractiveAppProps) {
  const { exit } = useApp();

  return (
    <Box flexDirection="column">
      <Text bold>AI Stack</Text>
      <Text dimColor>
        {modules.filter((module) => module.effective).length}
        {' effective modules of '}
        {modules.length}
      </Text>
      <Box marginTop={1}>
        <ModuleList modules={modules} onExit={exit} />
      </Box>
    </Box>
  );
}
