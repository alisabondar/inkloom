# Backlog

Features taken out of the product until they can be done properly.

## Paint by number

Removed from the medium list and the workspace layers (October 2026). The current version only drew region outlines from a quantized palette, with no numbers, so it wasn't usable as a paint-by-number template.

What it needs to come back:

- **Clean regions:** merge tiny regions into neighbours (minimum area scaled to print size), and smooth the boundaries so they are paintable with a brush.
- **Numbers inside regions:** place each colour number at the region's pole of inaccessibility (the point farthest from its edges), sized to fit, and skip regions too small to label (merge them instead).
- **A legend:** numbered swatches with the colour name and mix, on the template and in the print pack.
- **A region-count control:** "Fewer areas / More areas" instead of palette size.

Still in the code for existing templates: the `paint-by-number` medium type, its prompt style (`src/lib/ai/prompt.ts`), its plan steps (`src/lib/plan.ts`), and region processing (`src/lib/processing/regions.ts`).
