// One-off: creates a Supabase Auth user for every "user" row without an auth_id, then links the row.
// Usage: node --env-file=.env.local scripts/migrate-users-to-auth.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes('--dry-run');
const MIN_PASSWORD_LENGTH = 6;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: rows, error } = await admin
  .from('user')
  .select('id, email, password, auth_id')
  .is('auth_id', null);

if (error) {
  if (/fetch failed/i.test(error.message)) {
    // Network failure: the request never reached Supabase.
    console.error(`Could not reach ${supabaseUrl}.`, error.details || error.message);
    console.error('Check NEXT_PUBLIC_SUPABASE_URL, your network/VPN, and that the project is not paused in the Supabase dashboard.');
  } else {
    console.error('Failed to read "user" rows. Did you apply 0001_link_user_to_auth.sql?', error.message);
  }
  process.exit(1);
}

const summary = { linked: 0, needsPasswordReset: 0, failed: 0 };

for (const row of rows) {
  if (!row.email) {
    console.warn(`Skipping user ${row.id}: no email.`);
    summary.failed++;
    continue;
  }

  // Existing passwords were stored in plain text, so they can be carried over as-is into Supabase Auth (which hashes them).
  const canKeepPassword = typeof row.password === 'string' && row.password.length >= MIN_PASSWORD_LENGTH;

  if (dryRun) {
    console.log(`[dry run] ${row.email}: would create auth user${canKeepPassword ? '' : ' (password reset needed)'}`);
    continue;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: row.email,
    password: canKeepPassword ? row.password : undefined,
    email_confirm: true,
  });

  if (createError || !created.user) {
    console.error(`Failed for ${row.email}:`, createError?.message);
    summary.failed++;
    continue;
  }

  const { error: linkError } = await admin
    .from('user')
    .update({ auth_id: created.user.id })
    .eq('id', row.id);

  if (linkError) {
    console.error(`Created auth user for ${row.email} but failed to link it:`, linkError.message);
    summary.failed++;
    continue;
  }

  summary.linked++;
  if (!canKeepPassword) summary.needsPasswordReset++;
}

console.log(dryRun ? `[dry run] ${rows.length} rows would be migrated.` : summary);
if (summary.failed) process.exit(1);
