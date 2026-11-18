// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildProjectPlan, fabricColour, formatMinutes, MEDIUMS, planAsText, scaleMinutes, type Medium } from '@/lib/plan';
import { SIZES } from '@/lib/sizes';
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

describe('size', () => {
  it('scales line work with length, surface work faster, and leaves prep alone', () => {
    expect(scaleMinutes(20, 'fixed', 2)).toBe(20);
    expect(scaleMinutes(20, 'edge', 2)).toBe(40);
    const area = scaleMinutes(20, 'area', 2);
    expect(area).toBeGreaterThan(40);
    expect(area).toBeLessThan(80);
    expect(scaleMinutes(20, 'area', 1)).toBe(20);
  });

  it('a bigger hoop takes longer and the reference size matches having no size', () => {
    const base = { medium: 'embroidery' as Medium, palette, valueSteps: 3, difficulty: 'beginner' as const, regions: 200 };
    const plain = buildProjectPlan(base).totalMinutes;
    expect(buildProjectPlan({ ...base, size: SIZES.embroidery.reference }).totalMinutes).toBe(plain);
    expect(buildProjectPlan({ ...base, size: 12 }).totalMinutes).toBeGreaterThan(plain);
    expect(buildProjectPlan({ ...base, size: 4 }).totalMinutes).toBeLessThan(plain);
  });

  it('keeps fixed steps the same at any size', () => {
    const finish = (size: number) =>
      buildProjectPlan({ medium: 'embroidery', palette, valueSteps: 3, difficulty: 'beginner', size }).steps.find((s) => s.title === 'Finish')!.minutes;
    expect(finish(4)).toBe(finish(12));
  });
});

describe('embroidery fabric', () => {
  const withBackground: PaletteColor[] = [
    { hex: '#f0f0ec', rgb: [240, 240, 236], share: 0.7, name: 'DMC 762 Pearl Gray VY LT' },
    { hex: '#c72b3b', rgb: [199, 43, 59], share: 0.2, name: 'DMC 321 Red' },
    { hex: '#1e1108', rgb: [30, 17, 8], share: 0.1, name: 'DMC 3371 Black Brown' },
  ];

  it('treats a dominant background as fabric: no thread, no fill step', () => {
    const plan = buildProjectPlan({ medium: 'embroidery', palette: withBackground, valueSteps: 3, difficulty: 'beginner' });
    expect(plan.materials[0]).toBe('Cotton or linen fabric close to DMC 762 Pearl Gray VY LT');
    expect(plan.materials).not.toContain('DMC 762 Pearl Gray VY LT stranded thread');
    expect(plan.steps.map((s) => s.title)).not.toContain('Fill DMC 762 Pearl Gray VY LT');
    expect(plan.steps.map((s) => s.title)).toContain('Fill DMC 321 Red');
  });

  it('only calls a colour fabric when it covers most of the picture', () => {
    expect(fabricColour(withBackground)?.name).toBe('DMC 762 Pearl Gray VY LT');
    expect(fabricColour(palette)?.name).toBe('Yellow ochre');
    expect(fabricColour(palette.map((c) => ({ ...c, share: 1 / 3 })))).toBeUndefined();
  });
});

describe('plan as text', () => {
  it('formats minutes for people', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(135)).toBe('2 h 15 min');
  });

  it('lists materials as checkboxes and numbers the steps', () => {
    const plan = buildProjectPlan({ medium: 'acrylic', palette, valueSteps: 3, difficulty: 'beginner' });
    const text = planAsText('River valley', plan);
    expect(text.split('\n')[0]).toBe('River valley');
    expect(text).toContain('- [ ] Gesso');
    expect(text).toContain(`1. ${plan.steps[0].title} (`);
    expect(text).toContain(`Steps (about ${formatMinutes(plan.totalMinutes)})`);
  });
});

