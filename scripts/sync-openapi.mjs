import { access, copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const source = path.resolve(frontendRoot, '../backend/openapi/openapi.json');
const targetDir = path.resolve(frontendRoot, 'openapi');
const target = path.resolve(targetDir, 'openapi.json');

async function run() {
  await access(source);
  await mkdir(targetDir, { recursive: true });
  await copyFile(source, target);
  console.log(`OpenAPI spec synced: ${target}`);
}

run().catch((error) => {
  console.error('Failed to sync OpenAPI spec:', error);
  process.exitCode = 1;
});
