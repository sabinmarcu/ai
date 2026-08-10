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
  const [grouped, setGrouped] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredModules = normalizedQuery.length === 0
    ? modules
    : modules.filter((module) => (
      module.id.toLowerCase().includes(normalizedQuery)
        || module.name.toLowerCase().includes(normalizedQuery)
        || module.description.toLowerCase().includes(normalizedQuery)
    ));

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      onExit();
      return;
    }

    if (key.escape) {
      setSearching(false);
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    if (searching) {
      if (key.return) {
        setSearching(false);
        return;
      }
      if (key.backspace || key.delete) {
        setQuery((current) => current.slice(0, -1));
        setSelectedIndex(0);
        return;
      }
      if (!key.ctrl && !key.meta && input.length > 0) {
        setQuery((current) => current + input);
        setSelectedIndex(0);
      }
      return;
    }

    if (input === '/') {
      setSearching(true);
      return;
    }

    if (input === 'q') {
      onExit();
      return;
    }

    if (input === 't') {
      setGrouped((current) => !current);
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex((currentIndex) => Math.max(0, currentIndex - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex((currentIndex) => Math.min(filteredModules.length - 1, currentIndex + 1));
      return;
    }

    if (input === 'g' && !key.shift) {
      setSelectedIndex(0);
      return;
    }

    if (input === 'G' || (input === 'g' && key.shift)) {
      setSelectedIndex(Math.max(0, filteredModules.length - 1));
    }
  });

  if (modules.length === 0) {
    return <Text>No catalog modules found.</Text>;
  }

  const viewportHeight = Math.max(1, (stdout.rows ?? 24) - 12);
  const windowStart = Math.min(selectedIndex, Math.max(0, filteredModules.length - viewportHeight));
  const visibleModules = filteredModules.slice(windowStart, windowStart + viewportHeight);

  return (
    <Box flexDirection="column">
      {filteredModules.length === 0 && <Text dimColor>No modules match “{query}”.</Text>}
      {visibleModules.map((module, index) => {
        const absoluteIndex = windowStart + index;
        const type = module.id.split('/')[0] ?? module.id;
        const previousModule = filteredModules[absoluteIndex - 1];
        const previousType = previousModule?.id.split('/')[0] ?? previousModule?.id;
        const showGroup = grouped && (index === 0 || type !== previousType);

        return (
          <Box key={module.id} flexDirection="column">
            {showGroup && <Text bold dimColor>{type}</Text>}
            <ModuleRow
              module={module}
              selected={absoluteIndex === selectedIndex}
            />
          </Box>
        );
      })}
      <Box marginTop={1}>
        {searching
          ? <Text>/{query}<Text color="cyan">█</Text>  <Text dimColor>enter lock  esc clear</Text></Text>
          : (
              <Text dimColor>
                ↑/k up  ↓/j down  g/G first/last  t {grouped ? 'simple' : 'grouped'}  / search{query ? ` “${query}”  esc clear` : ''}  q quit
              </Text>
          )}
      </Box>
    </Box>
  );
}
