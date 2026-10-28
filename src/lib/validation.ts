// Small typed validators for Server Action inputs (no external schema library is available).
import type { Difficulty } from '@/lib/processing';
import { MEDIUMS, type Medium } from '@/lib/plan';

type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };
export type Field<T> = (raw: unknown) => FieldResult<T>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: Partial<Record<keyof T & string, string>> };

const ok = <T,>(value: T): FieldResult<T> => ({ ok: true, value });
const fail = (error: string): FieldResult<never> => ({ ok: false, error });

function asText(raw: unknown): string | null {
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  return null;
}

interface StringOptions { min?: number; max?: number; pattern?: RegExp; message?: string; label?: string }

export function string(options: StringOptions = {}): Field<string> {
  const { min = 1, max = 10_000, pattern, label = 'This field' } = options;
  return (raw) => {
    const text = asText(raw)?.trim() ?? '';
    if (text.length < min) return fail(min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`);
    if (text.length > max) return fail(`${label} must be at most ${max} characters`);
    if (pattern && !pattern.test(text)) return fail(options.message || `${label} is invalid`);
    return ok(text);
  };
}

export function optional<T>(field: Field<T>): Field<T | null> {
  return (raw) => {
    const text = asText(raw);
    if (raw === undefined || raw === null || (text !== null && text.trim() === '')) return ok(null);
    return field(raw);
  };
}

export function email(label = 'Email'): Field<string> {
  return string({ label, max: 320, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' });
}

export function oneOf<T extends string>(values: readonly T[], label = 'Value'): Field<T> {
  return (raw) => {
    const text = asText(raw)?.trim();
    return text && (values as readonly string[]).includes(text) ? ok(text as T) : fail(`${label} must be one of: ${values.join(', ')}`);
  };
}

export function boolean(): Field<boolean> {
  return (raw) => ok(raw === true || raw === 'true' || raw === 'on' || raw === '1');
}

export function number(options: { min?: number; max?: number; integer?: boolean; label?: string } = {}): Field<number> {
  const { min = -Infinity, max = Infinity, integer = false, label = 'Value' } = options;
  return (raw) => {
    const value = typeof raw === 'number' ? raw : Number(asText(raw));
    if (!Number.isFinite(value)) return fail(`${label} must be a number`);
    if (integer && !Number.isInteger(value)) return fail(`${label} must be a whole number`);
    if (value < min || value > max) return fail(`${label} must be between ${min} and ${max}`);
    return ok(value);
  };
}

export function uuid(label = 'Id'): Field<string> {
  return string({ label, pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, message: `${label} is invalid` });
}

export function imageFile(options: { maxBytes: number; types?: readonly string[]; label?: string }): Field<File> {
  const { maxBytes, types, label = 'Image' } = options;
  const megabytes = Math.round(maxBytes / (1024 * 1024));
  return (raw) => {
    if (typeof File === 'undefined' || !(raw instanceof File) || raw.size === 0) return fail(`Choose ${label.toLowerCase()} to upload`);
    const typeOk = types ? types.includes(raw.type) : raw.type.startsWith('image/');
    if (!typeOk) return fail(types ? 'Use a JPG, PNG, WebP or GIF image' : `${label} must be an image`);
    if (raw.size > maxBytes) return fail(`${label} must be ${megabytes} MB or smaller`);
    return ok(raw);
  };
}

export function object<S extends Record<string, Field<unknown>>>(shape: S) {
  type Out = { [K in keyof S]: S[K] extends Field<infer T> ? T : never };
  return (input: FormData | Record<string, unknown>): ValidationResult<Out> => {
    const read = (key: string) => (input instanceof FormData ? input.get(key) : input[key]);
    const data: Record<string, unknown> = {};
    const fieldErrors: Record<string, string> = {};
    for (const [key, field] of Object.entries(shape)) {
      const result = field(read(key));
      if (result.ok) data[key] = result.value;
      else fieldErrors[key] = result.error;
    }
    return Object.keys(fieldErrors).length
      ? { ok: false, fieldErrors: fieldErrors as Partial<Record<keyof Out & string, string>> }
      : { ok: true, data: data as Out };
  };
}

// State returned by Server Actions to forms (works with React's useActionState).
export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string | undefined>;
}

const DIFFICULTIES: readonly Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const USERNAME = /^[a-z0-9_.]{3,24}$/i;
const MEDIUM_IDS = MEDIUMS.map((m) => m.id) as Medium[];

export const signUpSchema = object({
  email: email(),
  password: string({ label: 'Password', min: 8, max: 128 }),
  first_name: string({ label: 'First name', max: 60 }),
  username: optional(string({ label: 'Username', pattern: USERNAME, message: 'Use 3–24 letters, numbers, dots or underscores' })),
});

export const signInSchema = object({
  identifier: string({ label: 'Email or username', max: 320 }),
  password: string({ label: 'Password', max: 128 }),
});

export const resetRequestSchema = object({ email: email() });

export const newPasswordSchema = object({ password: string({ label: 'Password', min: 8, max: 128 }) });

export const changePasswordSchema = object({
  currentPassword: string({ label: 'Current password', max: 128 }),
  newPassword: string({ label: 'New password', min: 8, max: 128 }),
});

export const profileSchema = object({
  email: email(),
  first_name: string({ label: 'First name', max: 60 }),
  username: optional(string({ label: 'Username', pattern: USERNAME, message: 'Use 3–24 letters, numbers, dots or underscores' })),
  favorite_medium: optional(oneOf(MEDIUM_IDS, 'Favourite medium')),
});

export const startGenerationSchema = object({
  idea: string({ label: 'Idea', min: 3, max: 1000 }),
  medium: oneOf(MEDIUM_IDS, 'Medium'),
  title: optional(string({ label: 'Title', max: 120 })),
});

export const saveTemplateSchema = object({
  generationId: uuid('Concept'),
  title: string({ label: 'Title', max: 120 }),
  difficulty: oneOf(DIFFICULTIES, 'Difficulty'),
});

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export const avatarSchema = object({ avatar: imageFile({ maxBytes: 5 * 1024 * 1024, label: 'Avatar' }) });

export const referencePhotoSchema = object({
  photo: imageFile({ maxBytes: 8 * 1024 * 1024, types: PHOTO_TYPES, label: 'Photo' }),
  medium: oneOf(MEDIUM_IDS, 'Medium'),
  title: optional(string({ label: 'Title', max: 120 })),
  idea: optional(string({ label: 'Idea', max: 1000 })),
});

export const templateIdSchema = object({ id: uuid('Template') });

export const visibilitySchema = object({ id: uuid('Template'), isPublic: boolean() });

export const workspaceSettingsSchema = object({
  id: uuid('Template'),
  detail: number({ min: 0, max: 1, label: 'Detail' }),
  weight: number({ min: 1, max: 4, label: 'Line weight' }),
  valueSteps: number({ min: 2, max: 9, integer: true, label: 'Value steps' }),
  paletteSize: number({ min: 3, max: 16, integer: true, label: 'Palette size' }),
  gridSize: number({ min: 0, max: 12, integer: true, label: 'Grid' }),
  layers: string({ label: 'Layers', max: 500 }),
});
