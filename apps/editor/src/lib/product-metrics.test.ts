// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../types';

const captured: { event: string; props: unknown }[] = [];

vi.mock('./analytics', () => ({
  track: (event: string, props: unknown) => captured.push({ event, props }),
}));

import {
  hasActivatedProject,
  isSubstantialProject,
  measureProject,
  recordActivation,
  recordSubstantialProject,
  setProjectOrigin,
} from './product-metrics';

function project(nodes = 5, connections = 4): Project {
  const root = {
    id: 'root',
    name: 'Root',
    category: 'root' as const,
    properties: {},
    position: { x: 0, y: 0 },
  };
  const blocks = Object.fromEntries([
    ['root', root],
    ...Array.from({ length: nodes }, (_, index) => [
      `node-${index}`,
      {
        id: `node-${index}`,
        name: 'Wait',
        category: 'action' as const,
        properties: {},
        position: { x: index, y: 0 },
      },
    ]),
  ]);
  const edges = Object.fromEntries(
    Array.from({ length: connections }, (_, index) => [
      `edge-${index}`,
      {
        id: `edge-${index}`,
        source: index === 0 ? 'root' : `node-${index - 1}`,
        target: `node-${index}`,
      },
    ])
  );

  return {
    id: 'project-1',
    name: 'Test',
    trees: {
      main: {
        id: 'main',
        title: 'Main',
        blocks,
        connections: edges,
        rootId: 'root',
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    },
    nodes: {},
    selectedTreeId: 'main',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

beforeEach(() => {
  localStorage.clear();
  captured.length = 0;
});

describe('project activation metrics', () => {
  it('excludes root blocks and applies the substantial threshold', () => {
    const candidate = project();
    const metrics = measureProject(candidate);

    expect(metrics.node_count).toBe(5);
    expect(metrics.connection_count).toBe(4);
    expect(isSubstantialProject(candidate)).toBe(true);
    expect(isSubstantialProject(project(4, 4))).toBe(false);
    expect(isSubstantialProject(project(5, 3))).toBe(false);
  });

  it('records substantial and activation events only once per project', () => {
    const candidate = project();
    setProjectOrigin(candidate.id, 'new');

    expect(recordSubstantialProject(candidate)).toBe(true);
    expect(recordSubstantialProject(candidate)).toBe(false);
    expect(recordActivation(candidate, 'save')).toBe(true);
    expect(recordActivation(candidate, 'export')).toBe(false);
    expect(hasActivatedProject()).toBe(true);

    expect(captured.map((item) => item.event)).toEqual([
      'project_became_substantial',
      'activation_completed',
    ]);
    expect(captured[1]?.props).toMatchObject({ trigger: 'save', origin: 'new' });
  });

  it('does not activate a small project', () => {
    expect(recordActivation(project(2, 1), 'save')).toBe(false);
    expect(captured).toHaveLength(0);
  });
});
