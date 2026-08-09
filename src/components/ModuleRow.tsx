import {
  Box,
  Text,
} from 'ink';
import { ModuleDetails } from './ModuleDetails.js';
import type { ModuleListItem } from './ModuleList.js';

export type ModuleRowProps = {
  module: ModuleListItem;
  selected: boolean;
};

function moduleState(module: ModuleListItem): string {
  if (module.selected) return 'selected';
  if (module.selectedByPresets.length > 0) return 'preset';
  if (module.effective) return 'dependency';
  return 'available';
}

export function ModuleRow({
  module,
  selected,
}: ModuleRowProps) {
  const state = moduleState(module);

  return (
    <Box flexDirection="column">
      <Text
        bold={selected}
        color={selected ? 'cyan' : undefined}
        dimColor={!selected && !module.effective}
      >
        {selected ? '› ' : '  '}
        {module.effective ? '●' : '○'}
        {' '}
        {module.id}
        {'  '}
        <Text dimColor>{state}</Text>
      </Text>
      {selected && <ModuleDetails module={module} />}
    </Box>
  );
}
