'use client';

import Link from 'next/link';
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, HandNote, LayerCard, PaintTin, Paper, SnapSlider, Stepper, Tape, type SnapStop } from '@/components/studio';
import { lineArt, settingsForDifficulty, type Difficulty, type RasterImage } from '@/lib/processing';
import { buildProjectPlan, MEDIUMS } from '@/lib/plan';
import type { TemplateCard } from '@/lib/db/queries';
import type { WorkspaceLayer } from '@/lib/db/types';
import type { ActionState } from '@/lib/validation';
import { deleteTemplateAction, setVisibilityAction, updateWorkspaceSettingsAction } from '@/app/actions/templates';
import { processAll, type ProcessParams, type ProcessResult, type WorkerRequest, type WorkerResponse } from './processing';
import styles from './Workspace.module.css';

const MAX_SIDE = 1024;
const SAVE_DELAY = 800;
const PROCESS_DELAY = 120;
const SINGLE_TOOL_MEDIUMS = ['pencil', 'tattoo'];

// Presets are the difficulty levels, named by how the template looks.
const PRESETS: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Simple', hint: 'main shapes' },
  { id: 'intermediate', label: 'Balanced', hint: 'shapes + key details' },
  { id: 'advanced', label: 'Detailed', hint: 'fine detail' },
];
const DETAIL_STOPS: SnapStop[] = [
  { value: 0.15, label: 'Very few' },
  { value: 0.3, label: 'Few' },
  { value: 0.55, label: 'Some' },
  { value: 0.8, label: 'Many' },
  { value: 0.95, label: 'All' },
];
const WEIGHT_STOPS: SnapStop[] = [
  { value: 1, label: 'Fine' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'Bold' },
  { value: 4, label: 'Marker' },
];
const VALUE_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9];
const PALETTE_OPTIONS = [3, 4, 5, 6, 8, 10, 12, 14, 16];
const GRID_OPTIONS = [0, 2, 3, 4, 5, 6, 8, 10, 12];
const THUMB_SIZE = 220;

function downscale(img: RasterImage, maxSide: number): RasterImage {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return img;
  ctx.drawImage(rasterToCanvas(img), 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width: data.width, height: data.height, data: data.data };
}
const LAYER_ORDER: { id: WorkspaceLayer; label: string }[] = [
  { id: 'lines', label: 'Line art' },
  { id: 'values', label: 'Values' },
  { id: 'numbers', label: 'Paint by number' },
  { id: 'grid', label: 'Grid' },
  { id: 'colour', label: 'Colour ref' },
];
const DEFAULT_LAYERS: Record<WorkspaceLayer, boolean> = { lines: true, values: false, numbers: false, grid: false, colour: false };

export interface Settings extends ProcessParams {
  gridSize: number;
  layers: Record<WorkspaceLayer, boolean>;
}

export function initialSettings(template: Pick<TemplateCard, 'settings' | 'difficulty'>): Settings {
  const saved = template.settings ?? {};
  const preset = settingsForDifficulty(template.difficulty);
  return {
    detail: saved.detail ?? preset.detail,
    weight: saved.weight ?? preset.weight,
    valueSteps: saved.valueSteps ?? preset.valueSteps,
    paletteSize: saved.paletteSize ?? preset.paletteSize,
    gridSize: saved.gridSize ?? 0,
    layers: { ...DEFAULT_LAYERS, ...(saved.layers ?? {}) },
  };
}

function rasterToCanvas(img: RasterImage): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx?.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
  return canvas;
}

const rasterToUrl = (img: RasterImage) => rasterToCanvas(img).toDataURL('image/png');

function loadRaster(src: string): Promise<{ raster: RasterImage; url: string }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unavailable'));
      ctx.drawImage(image, 0, 0, width, height);
      const { data } = ctx.getImageData(0, 0, width, height);
      resolve({ raster: { width, height, data }, url: canvas.toDataURL('image/png') });
    };
    image.onerror = () => reject(new Error('Could not load the concept image'));
    image.src = src;
  });
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'inkloom';
}

interface Layers { colour: string; lines: string; values: string; numbers: string; width: number; height: number }

/** Paints the visible layers in sheet order: paper, colour, values, regions, lines, grid. */
async function composite(layers: Layers, visible: Record<WorkspaceLayer, boolean>, gridSize: number): Promise<string> {
  const { width, height } = layers;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, width, height);
  const order: (keyof Layers & WorkspaceLayer)[] = ['colour', 'values', 'numbers', 'lines'];
  for (const id of order) {
    if (!visible[id]) continue;
    const img = new Image();
    img.src = layers[id];
    await img.decode().catch(() => undefined);
    ctx.globalCompositeOperation = id === 'colour' ? 'source-over' : 'multiply';
    ctx.globalAlpha = id === 'values' && visible.colour ? 0.6 : 1;
    ctx.drawImage(img, 0, 0, width, height);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (visible.grid && gridSize > 0) {
    ctx.strokeStyle = 'rgba(18, 119, 111, 0.55)';
    ctx.lineWidth = Math.max(1, width / 600);
    ctx.beginPath();
    for (let i = 1; i < gridSize; i++) {
      const x = (width * i) / gridSize;
      const y = (height * i) / gridSize;
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();
  }
  return canvas.toDataURL('image/png');
}

function useProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const seq = useRef(0);
  const pending = useRef(new Map<number, (r: WorkerResponse) => void>());

  useEffect(() => {
    if (typeof Worker === 'undefined') return;
    try {
      const worker = new Worker(new URL('./processing.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        pending.current.get(e.data.id)?.(e.data);
        pending.current.delete(e.data.id);
      };
      worker.onerror = () => { workerRef.current = null; worker.terminate(); };
      workerRef.current = worker;
      return () => worker.terminate();
    } catch {
      workerRef.current = null;
    }
  }, []);

  return useCallback((image: RasterImage, params: ProcessParams) => {
    const id = ++seq.current;
    const worker = workerRef.current;
    const run = (): Promise<{ id: number; result: ProcessResult }> =>
      new Promise((resolve, reject) => {
        // Fallback: main thread, deferred a frame so the slider repaints first.
        requestAnimationFrame(() => {
          try { resolve({ id, result: processAll(image, params) }); } catch (err) { reject(err); }
        });
      });
    if (!worker) return { id, latest: () => seq.current, done: run() };
    const done = new Promise<{ id: number; result: ProcessResult }>((resolve, reject) => {
      pending.current.set(id, (r) => (r.result ? resolve({ id, result: r.result }) : reject(new Error(r.error))));
      const msg: WorkerRequest = { id, image, params };
      worker.postMessage(msg);
    }).catch(() => run());
    return { id, latest: () => seq.current, done };
  }, []);
}

export interface WorkspaceProps { template: TemplateCard; isOwner: boolean }

export function Workspace({ template, isOwner }: WorkspaceProps) {
  const [deleteState, deleteAction] = useActionState(deleteTemplateAction, {} as ActionState);
  const [settings, setSettings] = useState<Settings>(() => initialSettings(template));
  const [difficulty, setDifficulty] = useState<Difficulty>(template.difficulty);
  const [source, setSource] = useState<{ raster: RasterImage; url: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<(ProcessResult & { urls: Omit<Layers, 'colour' | 'width' | 'height'> }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(template.is_public);
  const [view, setView] = useState<'sheet' | 'plan'>('sheet');
  const [fineTune, setFineTune] = useState(false);
  const [printUrl, setPrintUrl] = useState<string>('');
  const process = useProcessor();
  const dirty = useRef(false);

  const mediumLabel = MEDIUMS.find((m) => m.id === template.medium)?.label ?? template.medium;
  // Pencil and tattoo stencils use a single tool, so a colour palette doesn't apply.
  const usesPaints = !SINGLE_TOOL_MEDIUMS.includes(template.medium);
  const slug = slugify(template.title);

  useEffect(() => {
    if (!template.conceptUrl) { setLoadError('This template has no concept image.'); return; }
    let live = true;
    loadRaster(template.conceptUrl).then(
      (s) => live && setSource(s),
      (e: Error) => live && setLoadError(e.message),
    );
    return () => { live = false; };
  }, [template.conceptUrl]);

  const { detail, weight, valueSteps, paletteSize } = settings;
  useEffect(() => {
    if (!source) return;
    setBusy(true);
    const timer = window.setTimeout(() => {
      const job = process(source.raster, { detail, weight, valueSteps, paletteSize });
      job.done.then(({ id, result: r }) => {
        if (id !== job.latest()) return;
        setResult({ ...r, urls: { lines: rasterToUrl(r.lines), values: rasterToUrl(r.values), numbers: rasterToUrl(r.numbers) } });
        setBusy(false);
      }, () => setBusy(false));
    }, PROCESS_DELAY);
    return () => window.clearTimeout(timer);
  }, [source, detail, weight, valueSteps, paletteSize, process]);

  // 8.4: debounce saving to the template (owner only).
  useEffect(() => {
    if (!isOwner || !dirty.current) return;
    setSaveNote('saving…');
    const timer = window.setTimeout(async () => {
      const res = await updateWorkspaceSettingsAction({
        id: template.id,
        detail: settings.detail,
        weight: settings.weight,
        valueSteps: settings.valueSteps,
        paletteSize: settings.paletteSize,
        gridSize: settings.gridSize,
        layers: JSON.stringify(settings.layers),
      }).catch(() => ({ ok: false, error: 'Could not save' }));
      setSaveNote(res.ok ? 'saved ✓' : res.error ?? 'not saved');
    }, SAVE_DELAY);
    return () => window.clearTimeout(timer);
  }, [settings, isOwner, template.id]);

  const update = (patch: Partial<Settings>) => {
    dirty.current = true;
    setSettings((s) => ({ ...s, ...patch }));
  };
  const toggleLayer = (id: WorkspaceLayer) => {
    dirty.current = true;
    setSettings((s) => {
      const layers = { ...s.layers, [id]: !s.layers[id] };
      // Turning the grid on with no cells picks a sensible default.
      return { ...s, layers, gridSize: id === 'grid' && layers.grid && s.gridSize === 0 ? 4 : s.gridSize };
    });
  };
  const applyDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    update(settingsForDifficulty(d));
  };

  const palette = useMemo(() => result?.palette ?? [], [result]);

  // Live line-art previews of this template for each preset card.
  const presetThumbs = useMemo(() => {
    if (!source) return {} as Partial<Record<Difficulty, string>>;
    const small = downscale(source.raster, THUMB_SIZE);
    const ratio = small.width / source.raster.width;
    return Object.fromEntries(PRESETS.map(({ id }) => {
      const preset = settingsForDifficulty(id);
      return [id, rasterToUrl(lineArt(small, { detail: preset.detail, weight: Math.max(1, Math.round(preset.weight * ratio * 2)) }))];
    })) as Partial<Record<Difficulty, string>>;
  }, [source]);

  const activePreset = settingsForDifficulty(difficulty);
  const isCustom = settings.detail !== activePreset.detail
    || settings.weight !== activePreset.weight
    || settings.valueSteps !== activePreset.valueSteps
    || (usesPaints && settings.paletteSize !== activePreset.paletteSize);
  const presetLabel = PRESETS.find((p) => p.id === difficulty)?.label ?? difficulty;
  const plan = useMemo(
    () => buildProjectPlan({ medium: template.medium, palette, valueSteps: settings.valueSteps, difficulty, regions: result?.regions }),
    [template.medium, palette, settings.valueSteps, difficulty, result?.regions],
  );

  const layerData: Layers | null = source && result
    ? { colour: source.url, ...result.urls, width: source.raster.width, height: source.raster.height }
    : null;

  // Keep a flattened copy ready for the print pack.
  useEffect(() => {
    if (!layerData) return;
    let live = true;
    composite(layerData, settings.layers, settings.gridSize).then((url) => live && setPrintUrl(url));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, source, settings.layers, settings.gridSize]);

  const downloadPng = async () => {
    if (!layerData) return;
    const url = await composite(layerData, settings.layers, settings.gridSize);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-template.png`;
    a.click();
  };

  const toggleVisibility = async () => {
    const next = !isPublic;
    setIsPublic(next);
    const res = await setVisibilityAction({ id: template.id, isPublic: next }).catch(() => ({ ok: false }));
    if (!res.ok) setIsPublic(!next);
  };

  const thumbs: Partial<Record<WorkspaceLayer, string>> = {
    lines: result?.urls.lines,
    values: result?.urls.values,
    numbers: result?.urls.numbers,
    colour: source?.url,
  };
  // Washi tape holding the sheet is tinted with the template's own palette.
  const tapeColors = [...(palette.length ? palette.map((p) => p.hex) : []), '#e7b45c', '#7fb9a8', '#d97b4a', '#9db7c9'].slice(0, 4);
  const aspect = source ? `${source.raster.width} / ${source.raster.height}` : '4 / 3';
  const grid = settings.layers.grid && settings.gridSize > 0 ? settings.gridSize : 0;
  const hours = Math.floor(plan.totalMinutes / 60);
  const mins = plan.totalMinutes % 60;
  const timeLabel = hours ? `${hours} h ${mins ? `${mins} min` : ''}` : `${mins} min`;

  return (
    <div className={styles.root}>
      <div className={styles.screen}>
        <header className={styles.top}>
          <div className={styles.crumbs}>
            <Link href={isOwner ? '/projects' : '/gallery'}>{isOwner ? 'My projects' : 'Gallery'}</Link> / <b>{template.title}</b>{' '}
            <em>{mediumLabel} · {isCustom ? 'custom' : presetLabel.toLowerCase()}</em>
            {!isOwner && template.makerUsername && <span className={styles.maker}> by @{template.makerUsername}</span>}
          </div>
          <div className={styles.views} role="tablist" aria-label="Workspace view">
            <Chip role="tab" aria-selected={view === 'sheet'} active={view === 'sheet'} onClick={() => setView('sheet')}>Sheet</Chip>
            <Chip role="tab" aria-selected={view === 'plan'} active={view === 'plan'} onClick={() => setView('plan')}>Plan</Chip>
          </div>
        </header>

        <aside className={styles.left} aria-label="Layers and palette">
          <h2 className={styles.lbl}>Layers</h2>
          <div className={styles.layers}>
            {LAYER_ORDER.map((l) => (
              <LayerCard
                key={l.id}
                label={l.label}
                active={settings.layers[l.id]}
                onToggle={() => toggleLayer(l.id)}
                thumbnail={l.id === 'grid' ? <span className={styles.gridThumb} /> : thumbs[l.id] ?? <span className={styles.blankThumb} />}
              />
            ))}
          </div>
          {usesPaints && <h2 className={styles.lbl}>Paints</h2>}
          {!usesPaints ? null : palette.length ? (
            <>
              <PaintTin colors={palette} label={`${palette.length} colours · matched`} />
              <ul className={styles.shares}>
                {palette.map((c) => (
                  <li key={c.hex + c.name}>
                    <span className={styles.dot} style={{ background: c.hex }} aria-hidden="true" />
                    {c.name} <i>{Math.round(c.share * 100)}%</i>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <HandNote>mixing the paints…</HandNote>
          )}
        </aside>

        <main className={styles.desk}>
          {view === 'sheet' ? (
            <div className={styles.sheetWrap}>
              <Paper className={styles.sheet}>
                <Tape className={styles.tapeTL} angle={-36} size="sm" color={tapeColors[0]} />
                <Tape className={styles.tapeTR} angle={36} size="sm" color={tapeColors[1]} />
                <Tape className={styles.tapeBL} angle={36} size="sm" color={tapeColors[2]} />
                <Tape className={styles.tapeBR} angle={-36} size="sm" color={tapeColors[3]} />
                <div className={styles.stack} style={{ aspectRatio: aspect }} role="img" aria-label={`${template.title}: ${LAYER_ORDER.filter((l) => settings.layers[l.id]).map((l) => l.label).join(', ') || 'no layers'} visible`}>
                  {/* eslint-disable @next/next/no-img-element */}
                  {source && settings.layers.colour && <img src={source.url} alt="" className={styles.layerImg} />}
                  {result && settings.layers.values && <img src={result.urls.values} alt="" className={`${styles.layerImg} ${styles.multiply}`} style={{ opacity: settings.layers.colour ? 0.6 : 1 }} />}
                  {result && settings.layers.numbers && <img src={result.urls.numbers} alt="" className={`${styles.layerImg} ${styles.multiply}`} />}
                  {result && settings.layers.lines && <img src={result.urls.lines} alt="" className={`${styles.layerImg} ${styles.multiply}`} />}
                  {/* eslint-enable @next/next/no-img-element */}
                  {grid > 0 && <div className={styles.gridOverlay} data-testid="grid-overlay" style={{ backgroundSize: `${100 / grid}% ${100 / grid}%` }} />}
                  {!source && !loadError && <HandNote className={styles.loading}>laying out the paper…</HandNote>}
                  {loadError && <p className={styles.error} role="alert">{loadError}</p>}
                </div>
              </Paper>
              {busy && <HandNote className={styles.busy}>redrawing…</HandNote>}
            </div>
          ) : (
            <PlanSheet plan={plan} />
          )}
        </main>

        <aside className={styles.right} aria-label="Settings and export">
          <div className={styles.clip} aria-hidden="true" />
          <Paper className={styles.clipboard} tooth>
            <h2 className={styles.lbl}>Starting point</h2>
            <div className={styles.presets} role="group" aria-label="Starting point">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.preset} ${difficulty === p.id && !isCustom ? styles.presetActive : ''}`}
                  aria-pressed={difficulty === p.id && !isCustom}
                  onClick={() => applyDifficulty(p.id)}
                >
                  <span className={styles.presetThumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {presetThumbs[p.id] ? <img src={presetThumbs[p.id]} alt="" /> : null}
                  </span>
                  <span className={styles.presetLabel}>{p.label}</span>
                  <span className={styles.presetHint}>{p.hint}</span>
                </button>
              ))}
            </div>
            {isCustom && <p className={styles.customNote}>Custom · based on {presetLabel}. Pick a card to reset.</p>}

            <button
              type="button"
              className={styles.fineToggle}
              aria-expanded={fineTune}
              aria-controls="ws-fine-tune"
              onClick={() => setFineTune((open) => !open)}
            >
              <span>Fine-tune <small className={styles.fineHint}>lines, shading{usesPaints ? ', paints' : ''}, grid</small></span>
              <span aria-hidden="true">{fineTune ? '▴' : '▾'}</span>
            </button>
            {fineTune && (
              <div id="ws-fine-tune" className={styles.fine}>
                <SnapSlider id="ws-detail" label="Line detail" stops={DETAIL_STOPS} value={settings.detail} onChange={(v) => update({ detail: v })} />
                <SnapSlider id="ws-weight" label="Line weight" stops={WEIGHT_STOPS} value={settings.weight} onChange={(v) => update({ weight: v })} color="var(--studio-ink)" />
                <Stepper label="Shading" options={VALUE_OPTIONS} value={settings.valueSteps} format={(v) => `${v} tones`} onChange={(v) => update({ valueSteps: v })} />
                {usesPaints && <Stepper label="Paints" options={PALETTE_OPTIONS} value={settings.paletteSize} format={(v) => `${v} colours`} onChange={(v) => update({ paletteSize: v })} />}
                <Stepper label="Grid" options={GRID_OPTIONS} value={settings.gridSize} format={(v) => (v ? `${v}×${v}` : 'Off')} onChange={(v) => update({ gridSize: v, layers: { ...settings.layers, grid: v > 0 } })} />
              </div>
            )}
            <p className={styles.time}>About <b>{timeLabel}</b> of {mediumLabel.toLowerCase()} work</p>
            {saveNote && isOwner && <HandNote className={styles.saved}><span role="status">{saveNote}</span></HandNote>}
            {!isOwner && <HandNote className={styles.saved}>tweak away · changes stay with you</HandNote>}
            <div className={styles.exports}>
              <Button onClick={downloadPng} disabled={!layerData}>Download PNG</Button>
              <Button variant="paper" onClick={() => window.print()} disabled={!layerData}>Print pack</Button>
            </div>
            {isOwner && (
              <div className={styles.owner} data-testid="owner-controls">
                <Button variant="mint" size="sm" aria-pressed={isPublic} onClick={toggleVisibility}>
                  {isPublic ? 'Public · make private' : 'Private · make public'}
                </Button>
                {deleteState.error && <p className={styles.error} role="alert">{deleteState.error}</p>}
                <form
                  action={deleteAction}
                  onSubmit={(e) => { if (!window.confirm('Delete this template? This cannot be undone.')) e.preventDefault(); }}
                >
                  <input type="hidden" name="id" value={template.id} />
                  <Button type="submit" variant="paper" size="sm">Delete</Button>
                </form>
              </div>
            )}
          </Paper>
        </aside>
      </div>

      <PrintPack
        title={template.title}
        mediumLabel={mediumLabel}
        imageUrl={printUrl}
        palette={palette}
        valueSteps={settings.valueSteps}
        plan={plan}
      />
    </div>
  );
}

function PlanSheet({ plan }: { plan: ReturnType<typeof buildProjectPlan> }) {
  return (
    <Paper className={styles.planSheet} tape as="section">
      <h2 className={styles.planTitle}>Project plan</h2>
      <h3 className={styles.lbl}>Materials</h3>
      <ul className={styles.materials}>
        {plan.materials.map((m) => (
          <li key={m}><label><input type="checkbox" /> {m}</label></li>
        ))}
      </ul>
      <h3 className={styles.lbl}>Steps</h3>
      <ol className={styles.steps}>
        {plan.steps.map((s) => (
          <li key={s.title}><b>{s.title}</b> <i>{s.minutes} min</i><p>{s.detail}</p></li>
        ))}
      </ol>
    </Paper>
  );
}

function valueScale(steps: number) {
  return Array.from({ length: steps }, (_, i) => {
    const v = Math.round(255 * (1 - i / Math.max(1, steps - 1)));
    return `rgb(${v}, ${v}, ${v})`;
  });
}

function PrintPack(props: {
  title: string;
  mediumLabel: string;
  imageUrl: string;
  palette: ProcessResult['palette'];
  valueSteps: number;
  plan: ReturnType<typeof buildProjectPlan>;
}) {
  const { title, mediumLabel, imageUrl, palette, valueSteps, plan } = props;
  return (
    <div className={styles.print} aria-hidden="true">
      <section className={styles.printPage}>
        <h1>{title}</h1>
        <p>{mediumLabel} template · Inkloom</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {imageUrl && <img src={imageUrl} alt={`${title} template`} className={styles.printImage} />}
      </section>
      <section className={styles.printPage}>
        <h2>Palette</h2>
        <ul className={styles.printSwatches}>
          {palette.map((c, i) => (
            <li key={c.hex + i}><span style={{ background: c.hex }} />{i + 1}. {c.name} <small>{c.hex} · {Math.round(c.share * 100)}%</small></li>
          ))}
        </ul>
        <h2>Value scale</h2>
        <div className={styles.printScale}>
          {valueScale(valueSteps).map((c, i) => <span key={i} style={{ background: c }}>{i + 1}</span>)}
        </div>
      </section>
      <section className={styles.printPage}>
        <h2>Project plan</h2>
        <h3>Materials</h3>
        <ul>{plan.materials.map((m) => <li key={m}>☐ {m}</li>)}</ul>
        <h3>Steps · about {plan.totalMinutes} min</h3>
        <ol>{plan.steps.map((s) => <li key={s.title}><b>{s.title}</b> ({s.minutes} min): {s.detail}</li>)}</ol>
      </section>
    </div>
  );
}
