#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Read index.js
const indexPath = path.join(__dirname, '..', 'src', 'index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Update version in VERSION_INFO
const versionRegex = /version:\s*'[^']*'/;
const nameRegex = /name:\s*'[^']*'/;
const descriptionRegex = /description:\s*'[^']*'/;

indexContent = indexContent.replace(versionRegex, `version: '${packageJson.version}'`);
indexContent = indexContent.replace(nameRegex, `name: '${packageJson.name}'`);
indexContent = indexContent.replace(descriptionRegex, `description: '${packageJson.description}'`);

// Write back to index.js
fs.writeFileSync(indexPath, indexContent);

console.log(`✅ Updated version info in src/index.js to v${packageJson.version}`);
