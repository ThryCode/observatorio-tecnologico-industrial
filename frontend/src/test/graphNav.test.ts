import { describe, it, expect } from 'vitest';
import { buildGalaxy, buildSystem, primaryType, nodeLabel } from '@/lib/graphNav';
import type { GraphQueryResponse } from '@/types';

function makeGraph(): GraphQueryResponse {
  const nodes = [
    { id: 's1', labels: ['IndustrialSector'], props: { nombre: 'Agroindustria' } },
    { id: 's2', labels: ['IndustrialSector'], props: { nombre: 'Farmacéutica' } },
    { id: 'o1', labels: ['Organization'], props: { nombre: 'Organización A' } },
    { id: 'o2', labels: ['Organization'], props: { nombre: 'Organización B' } },
    { id: 't1', labels: ['Technology'], props: { nombre: 'Tecnología X' } },
    { id: 'p1', labels: ['Patent'], props: { title: 'Patente 1' } },
    { id: 'pe1', labels: ['Person'], props: { nombre: 'Pérez, G.' } },
  ];
  const edges = [
    { source: 'o1', target: 's1', type: 'BELONGS_TO_SECTOR' },
    { source: 'o2', target: 's1', type: 'BELONGS_TO_SECTOR' },
    { source: 't1', target: 's2', type: 'BELONGS_TO_SECTOR' },
    { source: 'pe1', target: 'p1', type: 'IS_AUTHOR_OF' },
  ];
  return { nodes, edges, total_nodes: nodes.length, total_edges: edges.length };
}

describe('primaryType', () => {
  it('resuelve el tipo prioritario', () => {
    expect(primaryType(['Organization', 'IndustrialSector'])).toBe('Organization');
    expect(primaryType(['Unknown'])).toBe('Unknown');
  });
});

describe('nodeLabel', () => {
  it('prioriza nombre, title y patent_number', () => {
    expect(nodeLabel({ nombre: 'A', title: 'B' })).toBe('A');
    expect(nodeLabel({ title: 'B' })).toBe('B');
    expect(nodeLabel({ patent_number: 'P123' })).toBe('P123');
    expect(nodeLabel({})).toBe('Nodo');
  });
});

describe('buildGalaxy', () => {
  it('muestra solo los sectores', () => {
    const galaxy = buildGalaxy(makeGraph());
    const types = galaxy.nodes.map((n) => n.nodeType);
    expect(types).toEqual(['IndustrialSector', 'IndustrialSector']);
    expect(galaxy.nodes.map((n) => n.id)).toEqual(['s1', 's2']);
  });

  it('no incluye aristas ni entidades', () => {
    const galaxy = buildGalaxy(makeGraph());
    expect(galaxy.edges).toHaveLength(0);
    expect(galaxy.nodes.some((n) => n.nodeType !== 'IndustrialSector')).toBe(false);
  });

  it('no calcula contadores de ocultos (feature eliminada)', () => {
    const galaxy = buildGalaxy(makeGraph());
    expect('hiddenCounts' in galaxy).toBe(false);
  });
});

describe('buildSystem', () => {
  it('muestra el centro y sus vecinos directos', () => {
    const graph = makeGraph();
    const system = buildSystem(graph, 's1', new Set());
    const ids = system.nodes.map((n) => n.id);
    expect(ids).toContain('s1');
    expect(ids).toContain('o1');
    expect(ids).toContain('o2');
    expect(ids).not.toContain('t1');
  });

  it('expande la vecindad al marcar un nodo', () => {
    const graph = makeGraph();
    const system = buildSystem(graph, 's1', new Set(['o1']));
    const ids = system.nodes.map((n) => n.id);
    expect(ids).toContain('o1');
  });

  it('muestra las aristas entre nodos visibles', () => {
    const graph = makeGraph();
    const system = buildSystem(graph, 's1', new Set());
    expect(system.edges.some((e) => e.source === 'o1' && e.target === 's1')).toBe(true);
    expect(system.edges.length).toBe(2);
  });

  it('oculta vecinos de segundo nivel hasta expandir', () => {
    const graph = makeGraph();
    const system = buildSystem(graph, 's1', new Set());
    expect(system.nodes.map((n) => n.id)).not.toContain('t1');
  });
});
