#!/usr/bin/env node

/**
 * Automated Google Sheets Setup Script
 * Creates Google Sheet and deploys Apps Script
 * 
 * Usage: node setup-google-sheets.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Universal Classroom Assistant - Google Sheets Setup\n');

// Step 1: Read Apps Script code
console.log('📝 Step 1: Preparing Google Apps Script code...');
const appsScriptPath = path.join(__dirname, 'GOOGLE_APPS_SCRIPT.gs');
const appsScriptCode = fs.readFileSync(appsScriptPath, 'utf-8');
console.log('✅ Apps Script code ready\n');

// Step 2: Create setup instructions
console.log('📋 Step 2: Creating setup instructions...');

const setupInstructions = `
# 🎯 GOOGLE SHEETS SETUP - MANUAL STEPS

## Step 1: Create Google Sheet (2 minutes)

1. Go to: https://sheets.google.com
2. Click "+ New" → "Spreadsheet"
3. Name: "Universal Classroom Assistant"
4. **COPY THE SPREADSHEET ID** from URL:
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit

## Step 2: Setup Google Apps Script (3 minutes)

1. In your Google Sheet, click: Extensions → Apps Script
2. Delete any default code
3. Copy ALL code from below and paste it:

---START OF CODE---
${appsScriptCode}
---END OF CODE---

4. Click "Run" button
5. Select function: "setupSheets"
6. Click "Run" and authorize when prompted
7. Check logs - should see "✅ Sheets setup complete!"

## Step 3: Deploy Apps Script (2 minutes)

1. Click "Deploy" → "New Deployment"
2. Select type: "Web app"
3. Execute as: Your email
4. Who has access: "Anyone"
5. Click "Deploy"
6. **COPY THE DEPLOYMENT URL** (looks like):
   https://script.google.com/macros/d/{SCRIPT_ID}/usercontent

## Step 4: Set Environment Variable

Add to your .env file:

GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/{SCRIPT_ID}/usercontent

Replace {SCRIPT_ID} with your actual script ID

## Step 5: Restart Server

npm run dev

---

⚠️ IMPORTANT: You MUST complete these steps manually because:
- Google Sheets API requires OAuth authentication
- Apps Script deployment requires manual authorization
- We cannot automate browser interactions

Once you complete these steps, your app will be fully functional!
`;

const instructionsPath = path.join(__dirname, 'GOOGLE_SHEETS_SETUP_INSTRUCTIONS.md');
fs.writeFileSync(instructionsPath, setupInstructions);
console.log('✅ Setup instructions created\n');

// Step 3: Create environment template
console.log('📝 Step 3: Creating .env template...');

const envTemplate = `# Google Sheets Configuration
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/{SCRIPT_ID}/usercontent

# Replace {SCRIPT_ID} with your actual script ID from deployment URL
`;

const envPath = path.join(__dirname, '.env.google-sheets');
fs.writeFileSync(envPath, envTemplate);
console.log('✅ .env template created\n');

// Step 4: Create quick reference
console.log('📋 Step 4: Creating quick reference...');

const quickRef = `# Quick Reference

## Google Apps Script Code
Location: GOOGLE_APPS_SCRIPT.gs

## Setup Instructions
Location: GOOGLE_SHEETS_SETUP_INSTRUCTIONS.md

## Environment Template
Location: .env.google-sheets

## Database Client
Location: server/appsScriptClient.ts

## After Setup:
1. Update .env with GOOGLE_APPS_SCRIPT_URL
2. Restart dev server: npm run dev
3. Test by creating a lesson
4. Check Google Sheet for new data
`;

const quickRefPath = path.join(__dirname, 'QUICK_REFERENCE.md');
fs.writeFileSync(quickRefPath, quickRef);
console.log('✅ Quick reference created\n');

// Summary
console.log('═══════════════════════════════════════════════════');
console.log('✅ SETUP FILES CREATED SUCCESSFULLY!\n');
console.log('📁 Files created:');
console.log('  1. GOOGLE_SHEETS_SETUP_INSTRUCTIONS.md');
console.log('  2. .env.google-sheets (template)');
console.log('  3. QUICK_REFERENCE.md\n');
console.log('📖 Next steps:');
console.log('  1. Open: GOOGLE_SHEETS_SETUP_INSTRUCTIONS.md');
console.log('  2. Follow the manual steps (takes ~10 minutes)');
console.log('  3. Copy the GOOGLE_APPS_SCRIPT_URL to .env');
console.log('  4. Restart dev server: npm run dev\n');
console.log('═══════════════════════════════════════════════════\n');
