import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const electronRebuildCli = join(
  rootDir,
  'node_modules',
  '@electron',
  'rebuild',
  'lib',
  'cli.js',
);

const result = spawnSync(process.execPath, [electronRebuildCli, '-f', '-w', 'better-sqlite3'], {
  cwd: rootDir,
  encoding: 'utf8',
  env: process.env,
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
const rebuildFailed =
  /Rebuild Failed/i.test(combinedOutput) ||
  /failed to rebuild/i.test(combinedOutput) ||
  /node-gyp failed/i.test(combinedOutput) ||
  /An unhandled error occurred inside electron-rebuild/i.test(combinedOutput);

if (result.status !== 0 || rebuildFailed) {
  console.error('[ERROR] better-sqlite3 native rebuild failed.');
  process.exit(result.status && result.status !== 0 ? result.status : 1);
}

const nativeBinary = join(
  rootDir,
  'node_modules',
  'better-sqlite3',
  'build',
  'Release',
  'better_sqlite3.node',
);

if (!existsSync(nativeBinary)) {
  console.error(`[ERROR] Native binary not found after rebuild: ${nativeBinary}`);
  process.exit(1);
}
