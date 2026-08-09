import {
  Box,
  Text,
} from 'ink';
import type { ModuleListItem } from './ModuleList.js';

export type ModuleDetailsProps = {
  module: ModuleListItem;
};

function TreeBranch({
  children,
  last = false,
}: {
  children: React.ReactNode;
  last?: boolean;
}) {
  return <Text color="gray">  {last ? '└─ ' : '├─ '}{children}</Text>;
}

function TreeList({
  items,
  last = false,
  label,
}: {
  items: string[];
  last?: boolean;
  label: string;
}) {
  return (
    <Box flexDirection="column">
      <TreeBranch last={last}>{label}</TreeBranch>
      {items.map((item, index) => (
        <Text key={item} color="gray">
          {'  '}
          {last ? '   ' : '│  '}
          {index === items.length - 1 ? '└─ ' : '├─ '}
          {item}
        </Text>
      ))}
    </Box>
  );
}

export function ModuleDetails({ module }: ModuleDetailsProps) {
  const sections: Array<{ items: string[]; label: string }> = [];
  const selected = module.selected || module.selectedByPresets.length > 0;

  if (selected && module.selectionReasons.length > 0) {
    sections.push({
      label: 'Selected because',
      items: module.selectionReasons,
    });
  } else if (module.effective && module.dependedOnBy.length > 0) {
    sections.push({
      label: 'Included by',
      items: module.dependedOnBy,
    });
  } else if (!module.effective && module.dependsOn.length > 0) {
    sections.push({
      label: 'Selecting this will also include',
      items: module.dependsOn,
    });
  }

  return (
    <Box flexDirection="column">
      {sections.map((section, index) => (
        <TreeList
          key={section.label}
          label={section.label}
          items={section.items}
          last={index === sections.length - 1}
        />
      ))}
    </Box>
  );
}
