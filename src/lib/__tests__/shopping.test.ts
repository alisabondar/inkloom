// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { copyText, nearestDmc, shoppingListText, shoppingPalette } from '@/lib/shopping';
import type { PaletteColor } from '@/lib/processing';

const color = (rgb: [number, number, number], name: string): PaletteColor => ({
  rgb,
  name,
  share: 0.5,
  hex: '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join(''),
});

describe('nearestDmc', () => {
  it('matches exact chart colours to their number', () => {
    expect(nearestDmc([0, 0, 0]).code).toBe('310');
    expect(nearestDmc([199, 43, 59]).code).toBe('321');
    expect(nearestDmc([255, 255, 255]).code).toBe('B5200');
  });

  it('finds a close thread for an off-chart colour', () => {
    expect(nearestDmc([40, 60, 120]).name).toMatch(/blue/i);
  });
});

describe('shoppingPalette', () => {
  const palette = [color([40, 50, 160], 'Ultramarine'), color([60, 66, 78], "Payne's grey")];

  it('names embroidery colours after DMC threads with a floss search link', () => {
    const [first] = shoppingPalette('embroidery', palette);
    expect(first.code).toMatch(/^DMC \S+$/);
    expect(first.name.startsWith(first.code!)).toBe(true);
    expect(first.shopUrl).toContain('michaels.com/search?q=DMC');
    expect(decodeURIComponent(first.shopUrl!)).toContain('embroidery floss');
  });

  it('keeps paint names, adds pigment codes where there is one, and links a search for the medium', () => {
    const [ultra, paynes] = shoppingPalette('acrylic', palette);
    expect(ultra.name).toBe('Ultramarine');
    expect(ultra.code).toBe('PB29');
    expect(decodeURIComponent(ultra.shopUrl!)).toContain('Ultramarine acrylic paint');
    expect(paynes.code).toBeUndefined();
    expect(shoppingPalette('watercolor', palette)[0].shopUrl).toContain('watercolor');
  });

  it('leaves single-tool mediums alone', () => {
    expect(shoppingPalette('pencil', palette)).toEqual(palette);
  });

  it('merges colours that match the same thread or paint, adding up their shares', () => {
    const blues = [color([150, 195, 230], 'Sky blue'), color([148, 192, 228], 'Sky blue')];
    const paints = shoppingPalette('acrylic', blues);
    expect(paints).toHaveLength(1);
    expect(paints[0].share).toBeCloseTo(1);
    expect(shoppingPalette('embroidery', blues)).toHaveLength(1);
    expect(shoppingPalette('paint-by-number', blues)).toHaveLength(2);
  });
});

describe('copying', () => {
  it('copies the thread, or the paint with its pigment code', () => {
    const [thread] = shoppingPalette('embroidery', [color([199, 43, 59], 'Cadmium red')]);
    expect(copyText(thread)).toBe('DMC 321 Red');
    const [ultra, paynes] = shoppingPalette('acrylic', [color([40, 50, 160], 'Ultramarine'), color([60, 66, 78], "Payne's grey")]);
    expect(copyText(ultra)).toBe('Ultramarine (PB29)');
    expect(copyText(paynes)).toBe("Payne's grey");
  });

  it('builds a shopping list with the fabric on its own line', () => {
    const threads = shoppingPalette('embroidery', [color([240, 240, 236], 'Ivory'), color([199, 43, 59], 'Cadmium red')]);
    const list = shoppingListText('Wreath', threads, threads[0]).split('\n');
    expect(list[0]).toBe('Wreath: shopping list');
    expect(list[1]).toMatch(/^Fabric close to DMC /);
    expect(list).toContain('- [ ] DMC 321 Red');
    expect(list.filter((l) => l.startsWith('- [ ]'))).toHaveLength(1);
  });
});

