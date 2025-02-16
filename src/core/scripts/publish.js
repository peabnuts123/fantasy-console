import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

/** @typedef {import('../package.json') PackageJson } */

// CONFIG
/** Path to package.json */
const PackageJsonPath = 'package.json';
/** Path to a backup copy of package.json, created by this script. */
const PackageJsonBackupPath = 'package.json.bak';
/**
 * Fields to remove from package.json before publishing.
 * @type {(keyof PackageJson)[]}
 */
const FieldsToRemoveFromPackageJson = ['scripts', 'devDependencies'];


// Backup package.json
await fs.cp(PackageJsonPath, PackageJsonBackupPath);
console.log(`NOTE: Creating temporary backup: ${PackageJsonBackupPath}. This file will be removed upon completion, even if an error occurs.`);

try {
  // Read package.json
  const packageJsonRaw = await fs.readFile(PackageJsonPath, 'utf-8');
  /** @type {PackageJson} */
  const PackageJson = JSON.parse(packageJsonRaw);

  console.log(`Publishing package '${PackageJson.name}@${PackageJson.version}'`);

  // Remove development-only fields
  console.log(`Removing fields from package.json: `, FieldsToRemoveFromPackageJson);
  FieldsToRemoveFromPackageJson.forEach((fieldName) => {
    delete PackageJson[fieldName];
  });

  // Overwrite package.json on disk
  await fs.writeFile(PackageJsonPath, JSON.stringify(PackageJson, null, 2));

  // Publish package
  const npmProcess = spawn('npm', ['publish'], { stdio: 'inherit' });
  await new Promise((resolve, reject) => {
    npmProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`command exited with code ${code}`));
      }
    });
  });

  console.log(`Successfully published package '${PackageJson.name}@${PackageJson.version}'`);
} finally {
  // Ensure backup is cleaned up and package.json is restored
  await fs.rename(PackageJsonBackupPath, PackageJsonPath);
}
