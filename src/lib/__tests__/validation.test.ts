// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  boolean,
  number,
  object,
  oneOf,
  optional,
  profileSchema,
  saveTemplateSchema,
  signUpSchema,
  startGenerationSchema,
  string,
  workspaceSettingsSchema,
} from '../validation';

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe('field validators', () => {
  it('trims strings and enforces length', () => {
    const field = string({ label: 'Name', min: 2, max: 5 });
    expect(field('  ab ')).toEqual({ ok: true, value: 'ab' });
    expect(field('a')).toEqual({ ok: false, error: 'Name must be at least 2 characters' });
    expect(field('abcdef')).toEqual({ ok: false, error: 'Name must be at most 5 characters' });
    expect(string({ label: 'Name' })('')).toEqual({ ok: false, error: 'Name is required' });
  });

  it('treats blank optional values as null', () => {
    expect(optional(string())('  ')).toEqual({ ok: true, value: null });
    expect(optional(string())(undefined)).toEqual({ ok: true, value: null });
  });

  it('checks enums, booleans, and numbers', () => {
    expect(oneOf(['a', 'b'] as const)('b')).toEqual({ ok: true, value: 'b' });
    expect(oneOf(['a', 'b'] as const)('c').ok).toBe(false);
    expect(boolean()('on')).toEqual({ ok: true, value: true });
    expect(boolean()(null)).toEqual({ ok: true, value: false });
    expect(number({ min: 0, max: 1 })('0.5')).toEqual({ ok: true, value: 0.5 });
    expect(number({ integer: true })(1.5).ok).toBe(false);
    expect(number()('abc').ok).toBe(false);
  });

  it('collects every field error', () => {
    const schema = object({ a: string({ label: 'A' }), b: number({ min: 1, label: 'B' }) });
    expect(schema({ a: '', b: 0 })).toEqual({ ok: false, fieldErrors: { a: 'A is required', b: 'B must be between 1 and Infinity' } });
  });
});

describe('action schemas', () => {
  it('validates sign-up input', () => {
    expect(signUpSchema(form({ email: 'a@b.co', password: 'longenough', first_name: 'Ada', username: '' }))).toEqual({
      ok: true,
      data: { email: 'a@b.co', password: 'longenough', first_name: 'Ada', username: null },
    });
    const bad = signUpSchema(form({ email: 'nope', password: 'short', first_name: '', username: 'a b' }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.fieldErrors).sort()).toEqual(['email', 'first_name', 'password', 'username']);
  });

  it('only accepts known mediums and difficulties', () => {
    expect(startGenerationSchema(form({ idea: 'a fox in a teacup', medium: 'watercolor' })).ok).toBe(true);
    expect(startGenerationSchema(form({ idea: 'a fox in a teacup', medium: 'crayon' })).ok).toBe(false);
    expect(profileSchema(form({ email: 'a@b.co', first_name: 'Ada', favorite_medium: 'crayon' })).ok).toBe(false);
    expect(saveTemplateSchema(form({ generationId: '6f1d2c4e-0000-4000-8000-000000000000', title: 'Fox', difficulty: 'expert' })).ok).toBe(false);
  });

  it('bounds workspace settings', () => {
    const base = { id: '6f1d2c4e-0000-4000-8000-000000000000', detail: 0.5, weight: 2, valueSteps: 5, paletteSize: 8, gridSize: 4, layers: '{}' };
    expect(workspaceSettingsSchema(base).ok).toBe(true);
    expect(workspaceSettingsSchema({ ...base, valueSteps: 12 }).ok).toBe(false);
    expect(workspaceSettingsSchema({ ...base, id: 'not-a-uuid' }).ok).toBe(false);
  });
});
