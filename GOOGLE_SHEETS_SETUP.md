# Google Sheets Database Setup Guide

## Step 1: Create Google Sheet

1. Go to https://sheets.google.com
2. Create new spreadsheet: "Universal Classroom Assistant"
3. Create these sheets (tabs):
   - `lessons`
   - `refinements`
   - `answers`
   - `users`

## Step 2: Setup Lessons Sheet

Headers (Row 1):
```
id | userId | class | subject | topic | toolType | language | content | createdAt | updatedAt
```

Example data:
```
1 | user1 | 10 | Mathematics | Algebra | simplify | english | Content here... | 2026-04-20 | 2026-04-20
```

## Step 3: Setup Refinements Sheet

Headers (Row 1):
```
id | lessonId | refinementType | content | createdAt
```

## Step 4: Setup Answers Sheet

Headers (Row 1):
```
id | lessonId | questionNumber | answer | createdAt
```

## Step 5: Setup Users Sheet

Headers (Row 1):
```
id | openId | email | name | role | createdAt
```

## Step 6: Get Google Sheets API Credentials

### Get Spreadsheet ID:
1. Open your sheet
2. URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. Copy the ID

### Get API Key:
1. Go to https://console.cloud.google.com
2. Create new project: "Universal Classroom Assistant"
3. Enable "Google Sheets API"
4. Create API Key (Credentials → API Key)
5. Copy the key

### Get OAuth Token (for writing):
1. Use Google OAuth 2.0 Playground: https://developers.google.com/oauthplayground
2. Select "Google Sheets API v4"
3. Authorize and get refresh token

## Step 7: Set Environment Variables

```bash
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_API_KEY=your_api_key
GOOGLE_SHEETS_APPEND_TOKEN=your_oauth_token
```

## Step 8: Share Sheet with Service Account

1. Create Service Account in Google Cloud Console
2. Download JSON key
3. Share sheet with service account email
4. Use JSON key for authentication

---

**Note:** For 10,000 users, consider upgrading to PostgreSQL for better performance.
