import type { Difficulty, PaletteColor } from '@/lib/processing';

// 'paint-by-number' is on the backlog (see BACKLOG.md): it stays in the type so existing templates
// still open, but it is no longer offered in MEDIUMS.
export type Medium = 'pencil' | 'watercolor' | 'acrylic' | 'paint-by-number' | 'embroidery' | 'tattoo';

export const MEDIUMS: { id: Medium; label: string; outputs: string[]; description: string }[] = [
  {
    id: 'pencil',
    label: 'Pencil',
    outputs: ['line-art', 'value-study'],
    description: 'Graphite drawing built up from a line drawing and a value map.',
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    outputs: ['line-art', 'value-study', 'palette'],
    description: 'Transparent washes, light to dark, with a matched paint palette.',
  },
  {
    id: 'acrylic',
    label: 'Acrylic',
    outputs: ['line-art', 'value-study', 'palette'],
    description: 'Opaque layers blocked in dark to light on a toned ground.',
  },
  {
    id: 'embroidery',
    label: 'Embroidery',
    outputs: ['line-art', 'palette'],
    description: 'Hoop-ready outline with thread colours matched to the palette.',
  },
  {
    id: 'tattoo',
    label: 'Tattoo flash',
    outputs: ['line-art', 'value-study'],
    description: 'Clean linework stencil with shading zones from the value study.',
  },
];

export interface PlanStep {
  title: string;
  detail: string;
  minutes: number;
}

export interface ProjectPlan {
  materials: string[];
  steps: PlanStep[];
  totalMinutes: number;
}

const DIFFICULTY_FACTOR: Record<Difficulty, number> = { beginner: 1, intermediate: 1.6, advanced: 2.4 };

const list = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

export function buildProjectPlan(input: {
  medium: Medium;
  palette: PaletteColor[];
  valueSteps: number;
  difficulty: Difficulty;
  regions?: number;
}): ProjectPlan {
  const { medium, palette, difficulty } = input;
  const valueSteps = Math.max(2, Math.round(input.valueSteps));
  const factor = DIFFICULTY_FACTOR[difficulty];
  const regions = Math.max(0, input.regions ?? palette.length * 8);
  const byShare = [...palette].sort((a, b) => b.share - a.share);
  const byLightness = [...palette].sort((a, b) => lightness(b) - lightness(a));
  const names = byShare.map((c) => c.name);
  const uniqueNames = [...new Set(names)];
  const paletteText = uniqueNames.length ? list(uniqueNames) : 'your chosen colours';
  const lightest = byLightness[0]?.name ?? 'the lightest colour';
  const darkest = byLightness[byLightness.length - 1]?.name ?? 'the darkest colour';
  const m = (base: number) => Math.max(5, Math.round(base * factor));

  let materials: string[];
  let steps: PlanStep[];

  switch (medium) {
    case 'pencil':
      materials = ['Drawing paper', 'Graphite pencils (2H, HB, 2B, 4B, 6B)', 'Kneaded eraser', 'Blending stump', 'Ruler for grid transfer'];
      steps = [
        { title: 'Grid and transfer', detail: 'Grid the line art and lightly transfer the main contours with a 2H pencil.', minutes: m(20) },
        { title: 'Map the values', detail: `Mark the ${valueSteps} value zones from the value study with light hatching.`, minutes: m(10 + valueSteps * 3) },
        ...valueLayers(valueSteps, m, (i) => `Build value ${i} with softer pencils, keeping lighter zones clean.`),
        { title: 'Lift highlights and refine edges', detail: 'Use the kneaded eraser to lift highlights, then sharpen key edges.', minutes: m(15) },
      ];
      break;
    case 'watercolor':
      materials = ['Cold-press watercolor paper (300 gsm)', 'Masking fluid', 'Round brushes (sizes 4, 8, 12)', 'Two water jars', ...uniqueNames.map((n) => `${n} watercolor`)];
      steps = [
        { title: 'Transfer the lines', detail: 'Grid the line art and transfer it lightly in pencil so it disappears under washes.', minutes: m(20) },
        { title: 'Mask the highlights', detail: 'Apply masking fluid to the lightest value areas and let it dry fully.', minutes: m(10) },
        { title: 'Wash the lightest value first', detail: `Lay a broad wash of ${lightest} over everything except masked areas.`, minutes: m(15) },
        ...valueLayers(valueSteps, m, (i) => `Glaze value ${i} on dry paper, mixing from ${paletteText}.`),
        { title: 'Darkest accents', detail: `Add the darkest accents with ${darkest}, then remove the masking fluid.`, minutes: m(15) },
      ];
      break;
    case 'acrylic':
      materials = ['Stretched canvas or panel', 'Gesso', 'Flat and filbert brushes', 'Palette knife', 'Stay-wet palette', ...uniqueNames.map((n) => `${n} acrylic`)];
      steps = [
        { title: 'Tone the ground', detail: 'Cover the canvas with a thin mid-value wash and let it dry.', minutes: m(15) },
        { title: 'Transfer the lines', detail: 'Grid the line art onto the canvas with thinned paint or chalk.', minutes: m(20) },
        { title: 'Block in the darks', detail: `Block in the darkest shapes with ${darkest}.`, minutes: m(20) },
        ...valueLayers(valueSteps, m, (i) => `Paint value ${i} opaquely, working from dark towards light with ${paletteText}.`),
        { title: 'Highlights and details', detail: `Finish with ${lightest} highlights and crisp edges.`, minutes: m(20) },
      ];
      break;
    case 'paint-by-number':
      materials = ['Printed numbered canvas or template', 'Fine detail brushes (sizes 0, 2, 4)', 'Water cup and paper towel', ...byShare.map((c, i) => `#${i + 1} ${c.name} (${c.hex})`)];
      steps = [
        { title: 'Print and prepare', detail: `Print the numbered template and set out the ${palette.length} paints in number order.`, minutes: m(10) },
        ...byShare.map((c, i) => ({
          title: `Paint #${i + 1} ${c.name}`,
          detail: `Fill every region numbered ${i + 1} with ${c.name}; it covers about ${Math.round(c.share * 100)}% of the picture, so do it ${i === 0 ? 'first' : 'next'}.`,
          minutes: m(5 + (regions * c.share) / 2),
        })),
        { title: 'Touch up outlines', detail: 'Fix any missed spots and cover visible numbers with a second coat.', minutes: m(15) },
      ];
      break;
    case 'embroidery':
      materials = ['Cotton or linen fabric', 'Embroidery hoop', 'Water-soluble transfer pen', 'Embroidery needles', ...uniqueNames.map((n) => `${n} stranded thread`)];
      steps = [
        { title: 'Transfer the design', detail: 'Trace the line art onto the fabric with a water-soluble pen and hoop it tight.', minutes: m(20) },
        { title: 'Backstitch the outlines', detail: `Backstitch every outline in ${darkest} thread.`, minutes: m(30 + regions / 4) },
        ...byShare.map((c) => ({
          title: `Fill ${c.name}`,
          detail: `Satin- or long-and-short-stitch the ${c.name} areas with thread matched to ${c.hex}.`,
          minutes: m(10 + (regions * c.share) / 2),
        })),
        { title: 'Finish', detail: 'Rinse out the transfer marks, press face-down and trim the hoop.', minutes: m(15) },
      ];
      break;
    case 'tattoo':
      materials = ['Stencil paper', 'Thermal or hand-trace stencil transfer', 'Fine liners (0.3, 0.5, 0.8)', 'Grey wash markers', 'Practice skin'];
      steps = [
        { title: 'Clean the linework', detail: 'Trace the line art onto tracing paper, simplifying broken lines.', minutes: m(25) },
        { title: 'Make the stencil', detail: 'Transfer the cleaned lines to stencil paper.', minutes: m(10) },
        { title: 'Line on practice skin', detail: 'Pull the outlines in one confident pass per line.', minutes: m(30) },
        ...valueLayers(valueSteps, m, (i) => `Shade value ${i} zone with grey wash, light to dark.`),
      ];
      break;
  }

  const totalMinutes = steps.reduce((sum, s) => sum + s.minutes, 0);
  return { materials, steps, totalMinutes };
}

function lightness(c: PaletteColor): number {
  const [r, g, b] = c.rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** One step per value beyond the first (lightest) value. */
function valueLayers(valueSteps: number, m: (base: number) => number, detail: (i: number) => string): PlanStep[] {
  const out: PlanStep[] = [];
  for (let i = 2; i <= valueSteps; i++) {
    out.push({ title: `Value ${i} of ${valueSteps}`, detail: detail(i), minutes: m(15) });
  }
  return out;
}
