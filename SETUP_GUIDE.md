# Universal Classroom Assistant - Google Sheets Setup Guide

## 🎯 Complete Setup (10 minutes)

### Step 1: Create Google Sheet (2 minutes)

1. Go to https://sheets.google.com
2. Click **"+ New"** → **"Spreadsheet"**
3. Name it: **"Universal Classroom Assistant"**
4. Copy the **Spreadsheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   ```

### Step 2: Setup Google Apps Script (3 minutes)

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete any default code
3. Copy entire code from `GOOGLE_APPS_SCRIPT.gs` (in this project)
4. Paste it into the editor
5. Click **"Run"** → Select function **"setupSheets"**
6. Authorize when prompted
7. Check logs - should see "✅ Sheets setup complete!"

### Step 3: Deploy Apps Script (2 minutes)

1. Click **"Deploy"** → **"New Deployment"**
2. Select type: **"Web app"**
3. Execute as: **Your email**
4. Who has access: **"Anyone"**
5. Click **"Deploy"**
6. Copy the **Deployment URL** (looks like):
   ```
   https://script.google.com/macros/d/{SCRIPT_ID}/usercontent
   ```

### Step 4: Configure Environment Variables (2 minutes)

Add these to your `.env` file:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/{SCRIPT_ID}/usercontent
```

Replace `{SCRIPT_ID}` with your actual script ID from the deployment URL.

### Step 5: Update Database Import

In `server/routers.ts`, update the import:

```typescript
// Change from:
// import * as db from "./db";

// To:
import * as db from "./appsScriptClient";
```

### Step 6: Test Locally

```bash
cd /home/ubuntu/universal-classroom-assistant
pnpm dev
```

Visit http://localhost:3000 and test:
- Create a lesson
- Refine it
- Check if data appears in Google Sheet

---

## 📊 Google Sheet Structure

### Lessons Sheet
| id | userId | class | subject | topic | toolType | language | content | createdAt | updatedAt |
|----|--------|-------|---------|-------|----------|----------|---------|-----------|-----------|
| 1 | 1 | 10 | Math | Algebra | simplify | english | ... | 2026-04-20 | 2026-04-20 |

### Refinements Sheet
| id | lessonId | refinementType | content | createdAt |
|----|----------|----------------|---------|-----------|
| 2 | 1 | Make simpler | ... | 2026-04-20 |

### Answers Sheet
| id | lessonId | questionNumber | answer | createdAt |
|----|----------|----------------|--------|-----------|
| 3 | 1 | 1 | ... | 2026-04-20 |

### Users Sheet
| id | openId | email | name | role | createdAt |
|----|--------|-------|------|------|-----------|
| 1 | user123 | test@example.com | John | user | 2026-04-20 |

---

## 🚀 Deploy to Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project

### Step 2: Connect GitHub
1. Click **"New"** → **"GitHub Repo"**
2. Select **"universal-classroom-assistant"**
3. Railway auto-detects it's a Node.js app

### Step 3: Add Environment Variables
1. Go to **"Variables"** tab
2. Add:
   ```
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/{SCRIPT_ID}/usercontent
   ```
3. Railway auto-deploys on changes

### Step 4: Get Live URL
1. Go to **"Settings"** tab
2. Copy the **Railway domain**
3. Your app is live! 🎉

---

## 🌐 Setup Custom Domain

### Option 1: Railway Custom Domain
1. In Railway → **"Settings"** → **"Domain"**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., classassistant.com)
4. Update DNS records as shown

### Option 2: Use Free Domain
1. Go to https://freenom.com
2. Register free domain (.tk, .ml, etc.)
3. Add DNS records pointing to Railway

---

## ✅ Verification Checklist

- [ ] Google Sheet created
- [ ] Apps Script deployed
- [ ] Environment variables set
- [ ] Local testing successful
- [ ] Railway deployment successful
- [ ] Custom domain working
- [ ] App is live!

---

## 🆘 Troubleshooting

### "GOOGLE_APPS_SCRIPT_URL not configured"
→ Add to `.env` file and restart dev server

### "Apps Script GET error"
→ Check deployment URL is correct and public access is enabled

### "Data not saving to Sheet"
→ Check Apps Script has authorization to edit sheet

### "Railway deployment failed"
→ Check logs: Railway → Deployments → View logs

---

## 📞 Support

For issues:
1. Check Google Apps Script logs (Extensions → Apps Script → Execution log)
2. Check Railway logs (Railway → Deployments → View logs)
3. Verify all environment variables are set correctly
