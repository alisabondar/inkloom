// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildProjectPlan, MEDIUMS, type Medium } from '@/lib/plan';
import type { PaletteColor } from '@/lib/processing';

const palette: PaletteColor[] = [
  { hex: '#cc9838', rgb: [204, 152, 56], share: 0.5, name: 'Yellow ochre' },
  { hex: '#283296', rgb: [40, 50, 160], share: 0.3, name: 'Ultramarine' },
  { hex: '#8a360f', rgb: [138, 54, 15], share: 0.2, name: 'Burnt sienna' },
];

describe('buildProjectPlan', () => {
  it.each(MEDIUMS.map((m) => m.id))('builds a plan for %s', (medium: Medium) => {
    const plan = buildProjectPlan({ medium, palette, valueSteps: 4, difficulty: 'intermediate', regions: 40 });
    expect(plan.materials.length).toBeGreaterThan(0);
    expect(plan.steps.length).toBeGreaterThan(2);
    expect(plan.totalMinutes).toBe(plan.steps.reduce((s, x) => s + x.minutes, 0));
    for (const step of plan.steps) expect(step.minutes).toBeGreaterThan(0);
  });

  it('references palette names for colour mediums', () => {
    for (const medium of ['watercolor', 'acrylic', 'paint-by-number', 'embroidery'] as Medium[]) {
      const text = JSON.stringify(buildProjectPlan({ medium, palette, valueSteps: 4, difficulty: 'beginner' }));
      for (const c of palette) expect(text).toContain(c.name);
    }
  });

  it('orders watercolor steps transfer -> mask -> lightest wash -> darker values', () => {
    const titles = buildProjectPlan({ medium: 'watercolor', palette, valueSteps: 4, difficulty: 'beginner' }).steps.map(
      (s) => s.title,
    );
    expect(titles[0]).toMatch(/transfer/i);
    expect(titles[1]).toMatch(/mask/i);
    expect(titles[2]).toMatch(/lightest/i);
    expect(titles.indexOf('Value 2 of 4')).toBeLessThan(titles.indexOf('Value 4 of 4'));
  });

  it('paints largest paint-by-number regions first', () => {
    const steps = buildProjectPlan({ medium: 'paint-by-number', palette, valueSteps: 3, difficulty: 'beginner' }).steps;
    expect(steps[1].title).toContain('Yellow ochre');
    expect(steps[3].title).toContain('Burnt sienna');
  });

  it('embroidery backstitches outlines before fills', () => {
    const titles = buildProjectPlan({ medium: 'embroidery', palette, valueSteps: 3, difficulty: 'beginner' }).steps.map(
      (s) => s.title,
    );
    expect(titles[0]).toMatch(/transfer/i);
    expect(titles[1]).toMatch(/backstitch/i);
    expect(titles).toContain('Fill Ultramarine');
  });

  it('scales time with difficulty, regions and value steps', () => {
    const base = { medium: 'paint-by-number' as Medium, palette, valueSteps: 3, regions: 40 };
    const easy = buildProjectPlan({ ...base, difficulty: 'beginner' }).totalMinutes;
    const hard = buildProjectPlan({ ...base, difficulty: 'advanced' }).totalMinutes;
    expect(hard).toBeGreaterThan(easy);
    const more = buildProjectPlan({ ...base, regions: 400, difficulty: 'beginner' }).totalMinutes;
    expect(more).toBeGreaterThan(easy);
    const w3 = buildProjectPlan({ medium: 'watercolor', palette, valueSteps: 3, difficulty: 'beginner' }).totalMinutes;
    const w7 = buildProjectPlan({ medium: 'watercolor', palette, valueSteps: 7, difficulty: 'beginner' }).totalMinutes;
    expect(w7).toBeGreaterThan(w3);
  });
});
