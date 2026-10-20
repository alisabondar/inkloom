// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  PROFILE_FIELDS: 'id',
  supabaseAdmin: {},
  createAuthClient: () => ({ auth: { getUser: vi.fn(), refreshSession: vi.fn() } }),
  createUserClient: vi.fn(),
}));

import { GET as getUser } from '../get-user/route';
import { POST as updateUser } from '../update-user/route';
import { POST as uploadAvatar } from '../upload-avatar/route';
import { POST as changePassword } from '../change-password/route';
import { GET as exportUserData } from '../export-user-data/route';
import { POST as deleteAccount } from '../delete-account/route';
import { POST as saveTemplate } from '../save-template/route';
import { GET as getTemplates } from '../get-templates/route';
import { POST as generateTemplate } from '../generate-template/route';

const handlers = {
  'get-user': getUser,
  'update-user': updateUser,
  'upload-avatar': uploadAvatar,
  'change-password': changePassword,
  'export-user-data': exportUserData,
  'delete-account': deleteAccount,
  'save-template': saveTemplate,
  'get-templates': getTemplates,
  'generate-template': generateTemplate,
};

describe('user-scoped routes without a session', () => {
  it.each(Object.entries(handlers))('%s returns 401 even when a user id is supplied', async (name, handler) => {
    const req = new NextRequest(`http://localhost/api/${name}?id=1`, {
      method: 'POST',
      body: JSON.stringify({ id: '1', user_id: '1' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(req);
    expect(response.status).toBe(401);
  });
});
