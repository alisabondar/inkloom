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

const summary = { linked: 0, linkedExisting: 0, needsPasswordReset: 0, failed: 0 };

// Supabase has no lookup-by-email admin call, so page through Auth users once and index them.
let authUsersByEmail = null;
async function findAuthUserByEmail(email) {
  if (!authUsersByEmail) {
    authUsersByEmail = new Map();
    for (let page = 1; ; page++) {
      const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError) throw listError;
      data.users.forEach((authUser) => authUsersByEmail.set(authUser.email?.toLowerCase(), authUser));
      if (data.users.length < 1000) break;
    }
  }
  return authUsersByEmail.get(email.toLowerCase()) || null;
}

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

  let authUserId;
  let reusedExisting = false;

  const existing = await findAuthUserByEmail(row.email);

  if (existing) {
    // An Auth account already exists for this email: link it, and carry the app password over so sign-in keeps working.
    if (canKeepPassword) {
      const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, { password: row.password });
      if (updateError) {
        console.error(`Failed to set password on existing auth user for ${row.email}:`, updateError.message);
        summary.failed++;
        continue;
      }
    }
    authUserId = existing.id;
    reusedExisting = true;
  } else {
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
    authUserId = created.user.id;
  }

  const { error: linkError } = await admin
    .from('user')
    .update({ auth_id: authUserId })
    .eq('id', row.id);

  if (linkError) {
    console.error(`Found auth user for ${row.email} but failed to link it:`, linkError.message);
    summary.failed++;
    continue;
  }

  summary.linked++;
  if (reusedExisting) {
    summary.linkedExisting++;
    console.log(`${row.email}: linked to existing auth user${canKeepPassword ? ' (password set from app account)' : ''}`);
  }
  if (!canKeepPassword) summary.needsPasswordReset++;
}

console.log(dryRun ? `[dry run] ${rows.length} rows would be migrated.` : summary);
if (summary.failed) process.exit(1);
