# 🚀 Universal Classroom Assistant - Complete Deployment Guide

## Status: Ready for Google Sheets Integration

Your app is already deployed on Railway! Now we need to connect Google Sheets as the database.

---

## 📋 Quick Setup (15 minutes)

### Phase 1: Google Sheet Creation (3 minutes)

**Step 1.1:** Go to https://sheets.google.com

**Step 1.2:** Create new spreadsheet
- Click "+ New" → "Spreadsheet"
- Name it: `Universal Classroom Assistant`

**Step 1.3:** Create sheet tabs
- Right-click on "Sheet1" → Rename to `lessons`
- Add new sheets: `refinements`, `answers`, `users`

**Step 1.4:** Setup headers

In `lessons` sheet, Row 1:
```
id | userId | class | subject | topic | toolType | language | content | createdAt | updatedAt
```

In `refinements` sheet, Row 1:
```
id | lessonId | refinementType | content | createdAt
```

In `answers` sheet, Row 1:
```
id | lessonId | questionNumber | answer | createdAt
```

In `users` sheet, Row 1:
```
id | openId | email | name | role | createdAt
```

**Step 1.5:** Copy Spreadsheet ID
- From URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
- Save this ID for later

---

### Phase 2: Google Apps Script Deployment (5 minutes)

**Step 2.1:** Open Apps Script
- In your Google Sheet: Extensions → Apps Script

**Step 2.2:** Copy the code
- Location: `GOOGLE_APPS_SCRIPT.gs` (in this project)
- Copy ALL the code

**Step 2.3:** Paste into Apps Script
- Delete default code in Apps Script editor
- Paste the code you copied

**Step 2.4:** Run setup function
- Click "Run" button
- Select function: `setupSheets`
- Authorize when prompted
- Check logs - should see "✅ Sheets setup complete!"

**Step 2.5:** Deploy as web app
- Click "Deploy" → "New Deployment"
- Type: "Web app"
- Execute as: Your email
- Access: "Anyone"
- Click "Deploy"
- Copy the deployment URL

**Step 2.6:** Save deployment URL
```
https://script.google.com/macros/d/{SCRIPT_ID}/usercontent
```

---

### Phase 3: Configure Environment (3 minutes)

**Step 3.1:** Update .env file

Add this line to `.env`:
```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/{SCRIPT_ID}/usercontent
```

Replace `{SCRIPT_ID}` with your actual script ID from deployment URL.

**Step 3.2:** Restart dev server
```bash
npm run dev
```

---

### Phase 4: Configure Railway (2 minutes)

**Step 4.1:** Go to Railway dashboard
- https://railway.app/project/e7...

**Step 4.2:** Add environment variable
- Click "Variables" tab
- Add new variable:
  - Key: `GOOGLE_APPS_SCRIPT_URL`
  - Value: `https://script.google.com/macros/d/{SCRIPT_ID}/usercontent`

**Step 4.3:** Deploy
- Railway auto-deploys when you save variables

---

### Phase 5: Test Everything (2 minutes)

**Step 5.1:** Test locally
```bash
npm run dev
```
- Visit http://localhost:3000
- Login
- Create a lesson
- Check if data appears in Google Sheet

**Step 5.2:** Test on Railway
- Visit your Railway URL
- Create a lesson
- Check if data appears in Google Sheet

---

## 🎯 Your App URLs

| Environment | Status | URL |
|-------------|--------|-----|
| Local Dev | Running | http://localhost:3000 |
| Railway | Active | https://universal-classroom-assistant-production.up.railway.app |
| Manus | Active | https://classassist-6sywpf3f.manus.space |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `GOOGLE_APPS_SCRIPT.gs` | Apps Script code (copy to Google) |
| `server/appsScriptClient.ts` | Database client for React |
| `GOOGLE_SHEETS_SETUP_INSTRUCTIONS.md` | Detailed setup steps |
| `SETUP_GUIDE.md` | Alternative guide |

---

## ✅ Verification Checklist

- [ ] Google Sheet created
- [ ] All 4 sheets created (lessons, refinements, answers, users)
- [ ] Headers added to all sheets
- [ ] Apps Script deployed
- [ ] Deployment URL copied
- [ ] .env updated with GOOGLE_APPS_SCRIPT_URL
- [ ] Railway variables updated
- [ ] Local test successful
- [ ] Railway test successful
- [ ] Data appears in Google Sheet

---

## 🆘 Troubleshooting

### "GOOGLE_APPS_SCRIPT_URL not configured"
→ Add to .env and restart server

### "Apps Script error"
→ Check Apps Script logs (Extensions → Apps Script → Execution log)

### "Data not saving"
→ Verify Apps Script is deployed as "Anyone" access

### "Railway deployment failed"
→ Check Railway logs (Deployments → View logs)

---

## 🎉 Success!

Once everything is set up:
1. Teachers can use the app at your Railway URL
2. All data is stored in Google Sheets (free!)
3. No database costs
4. Scales to 10,000+ users

---

## 📞 Support

For issues:
1. Check Google Apps Script execution logs
2. Check Railway deployment logs
3. Verify all environment variables are set
4. Test locally first before testing on Railway

---

**Ready to deploy?** Follow the steps above! 🚀
