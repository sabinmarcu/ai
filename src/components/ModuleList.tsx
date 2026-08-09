import {
  Box,
  Text,
  useInput,
  useStdout,
} from 'ink';
import { useState } from 'react';
import { ModuleRow } from './ModuleRow.js';

export type ModuleListItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  dependedOnBy: string[];
  dependsOn: string[];
  effective: boolean;
  selected: boolean;
  selectedByPresets: string[];
  selectionReasons: string[];
};

export type ModuleListProps = {
  modules: ModuleListItem[];
  onExit(): void;
};

export function ModuleList({
  modules,
  onExit,
}: ModuleListProps) {
  const { stdout } = useStdout();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      onExit();
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex((currentIndex) => Math.max(0, currentIndex - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex((currentIndex) => Math.min(modules.length - 1, currentIndex + 1));
      return;
    }

    if (input === 'g' && !key.shift) {
      setSelectedIndex(0);
      return;
    }

    if (input === 'G' || (input === 'g' && key.shift)) {
      setSelectedIndex(Math.max(0, modules.length - 1));
    }
  });

  if (modules.length === 0) {
    return <Text>No catalog modules found.</Text>;
  }

  const viewportHeight = Math.max(1, (stdout.rows ?? 24) - 12);
  const windowStart = Math.min(selectedIndex, Math.max(0, modules.length - viewportHeight));
  const visibleModules = modules.slice(windowStart, windowStart + viewportHeight);

  return (
    <Box flexDirection="column">
      {visibleModules.map((module, index) => (
        <ModuleRow
          key={module.id}
          module={module}
          selected={windowStart + index === selectedIndex}
        />
      ))}
      <Box marginTop={1}>
        <Text dimColor>↑/k up  ↓/j down  g/G first/last  q quit</Text>
      </Box>
    </Box>
  );
}
