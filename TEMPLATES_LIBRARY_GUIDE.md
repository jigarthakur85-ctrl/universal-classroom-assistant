# 📚 Lesson Templates Library - Implementation Guide

## Overview

The Lesson Templates Library provides pre-built CBSE/NCERT lessons that teachers can browse, search, and use with one click. This reduces preparation time and ensures quality content.

---

## 🎯 Features Implemented

### 1. **Pre-built Templates**
- 6 comprehensive lesson templates covering Classes 6, 8, 10, and 12
- Multiple subjects: Mathematics, Science, History, Chemistry
- Different tool types: Simplify, Activity, Understanding
- Difficulty levels: Easy, Medium, Hard

### 2. **Search & Filter**
- Full-text search across titles, descriptions, topics, and tags
- Filter by class, subject, and difficulty level
- Sort by popular, top-rated, or recent

### 3. **One-Click Usage**
- Teachers can instantly create a lesson from any template
- Automatically increments download counter
- Pre-populated with template content

### 4. **Rating System**
- Teachers can rate templates (1-5 stars)
- Popular and top-rated templates highlighted
- Download counts tracked

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `server/templatesClient.ts` | API client for templates management |
| `server/routers/templates.ts` | tRPC router with all template procedures |
| `server/templates-data.ts` | Pre-built CBSE/NCERT template data |
| `client/src/pages/TemplatesLibrary.tsx` | Frontend UI component |
| `client/src/pages/TemplatesLibraryRoute.tsx` | Route configuration |

---

## 🚀 Setup Instructions

### Step 1: Add Templates Sheet to Google Sheets

In your Google Sheet, create a new tab called `templates` with headers:

```
id | title | description | class | subject | topic | toolType | language | content | author | tags | difficulty | estimatedTime | downloads | rating | createdAt | updatedAt
```

### Step 2: Add Templates to Google Apps Script

Update your `GOOGLE_APPS_SCRIPT.gs` to handle templates sheet:

```javascript
// Add to your Apps Script
function setupTemplatesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss.getSheetByName("templates")) {
    ss.insertSheet("templates");
  }
  
  const sheet = ss.getSheetByName("templates");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "id", "title", "description", "class", "subject", "topic", 
      "toolType", "language", "content", "author", "tags", 
      "difficulty", "estimatedTime", "downloads", "rating", 
      "createdAt", "updatedAt"
    ]);
  }
}
```

### Step 3: Seed Initial Templates

Run this script to populate initial templates (or manually add them):

```bash
# Create a seed script
node scripts/seed-templates.mjs
```

### Step 4: Add Route to App.tsx

```typescript
import { TemplatesLibraryRoute } from "@/pages/TemplatesLibraryRoute";

// In your routes:
<TemplatesLibraryRoute />
```

### Step 5: Add Navigation Link

Add to your navigation menu:

```typescript
<Link href="/templates">
  📚 Lesson Templates
</Link>
```

---

## 💻 API Endpoints

### Public Endpoints

```typescript
// Get all templates
trpc.templates.getAll.useQuery()

// Search templates
trpc.templates.search.useQuery({ query: "photosynthesis" })

// Get by class
trpc.templates.getByClass.useQuery({ class: "10" })

// Get by subject
trpc.templates.getBySubject.useQuery({ subject: "Science" })

// Get by topic
trpc.templates.getByTopic.useQuery({ topic: "Photosynthesis" })

// Get popular
trpc.templates.getPopular.useQuery({ limit: 10 })

// Get top-rated
trpc.templates.getTopRated.useQuery({ limit: 10 })
```

### Protected Endpoints

```typescript
// Use a template (create lesson from it)
trpc.templates.useTemplate.useMutation({ templateId: 1 })

// Rate a template
trpc.templates.rate.useMutation({ templateId: 1, rating: 5 })

// Create new template (for admins)
trpc.templates.create.useMutation({
  title: "...",
  description: "...",
  class: "10",
  subject: "Science",
  topic: "Photosynthesis",
  toolType: "simplify",
  language: "english",
  content: "...",
  difficulty: "medium",
  estimatedTime: 60
})
```

---

## 📊 Template Data Structure

```typescript
interface LessonTemplate {
  id: number;
  title: string;
  description: string;
  class: string;
  subject: string;
  topic: string;
  toolType: "simplify" | "activity" | "understanding";
  language: string;
  content: string;
  author: string;
  tags: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🎨 UI Features

### Templates Library Page
- **Search bar** with real-time search
- **Filter options**: Class, Subject, Difficulty
- **Sort options**: Popular, Top-rated, Recent
- **Template cards** showing:
  - Title and description
  - Class, subject, difficulty
  - Download count and rating
  - Tags
  - "Use Template" and "Rate" buttons

### Template Card
- Glassmorphic design matching app theme
- Hover effects for interactivity
- Quick stats (downloads, rating, time)
- One-click usage

---

## 📈 Usage Analytics

Track template usage with these metrics:

```typescript
// Get template statistics
const stats = {
  totalTemplates: 6,
  totalDownloads: 0,
  averageRating: 0,
  mostPopular: "Understanding Fractions",
  topRated: "Photosynthesis"
};
```

---

## 🔄 Workflow

### For Teachers

1. **Browse Templates**
   - Visit `/templates` page
   - Browse or search for topics

2. **Preview Template**
   - Read title, description, and tags
   - Check difficulty and time estimate

3. **Use Template**
   - Click "Use Template" button
   - Lesson created automatically
   - Content pre-populated

4. **Rate Template**
   - Click star icon to rate
   - Helps other teachers find quality content

### For Admins

1. **Create New Template**
   - Use tRPC mutation: `templates.create`
   - Provide all required fields
   - Template added to library

2. **Monitor Usage**
   - Track downloads and ratings
   - Identify popular topics
   - Improve based on feedback

---

## 🎓 Pre-built Templates Included

1. **Class 6 - Understanding Fractions** (Mathematics)
   - Type: Simplify
   - Difficulty: Easy

2. **Class 6 - The Water Cycle** (Science)
   - Type: Activity
   - Difficulty: Easy

3. **Class 8 - Linear Equations** (Mathematics)
   - Type: Understanding
   - Difficulty: Medium

4. **Class 10 - Photosynthesis** (Science)
   - Type: Simplify
   - Difficulty: Medium

5. **Class 10 - French Revolution** (History)
   - Type: Activity
   - Difficulty: Medium

6. **Class 12 - Chemical Bonding** (Chemistry)
   - Type: Understanding
   - Difficulty: Hard

---

## 🚀 Scaling the Library

### Add More Templates

1. **Manually via UI**
   - Use `templates.create` mutation
   - Requires admin role

2. **Bulk Import**
   - Create seed script
   - Import from CSV/JSON

3. **Community Contributions**
   - Allow teachers to create templates
   - Moderate before publishing

### Performance Optimization

For 10,000+ users:

1. **Caching**
   - Cache popular templates
   - Invalidate on updates

2. **Pagination**
   - Load templates in batches
   - Lazy load on scroll

3. **Search Optimization**
   - Index templates by class/subject
   - Use full-text search

---

## 🧪 Testing

### Unit Tests

```typescript
describe("Templates Router", () => {
  it("should get all templates", async () => {
    const templates = await trpc.templates.getAll.query();
    expect(templates.length).toBeGreaterThan(0);
  });

  it("should search templates", async () => {
    const results = await trpc.templates.search.query({ 
      query: "photosynthesis" 
    });
    expect(results.length).toBeGreaterThan(0);
  });

  it("should use a template", async () => {
    const result = await trpc.templates.useTemplate.mutate({ 
      templateId: 1 
    });
    expect(result.success).toBe(true);
  });
});
```

---

## 📞 Support & Maintenance

### Common Issues

**Q: Templates not appearing?**
- Check Google Sheets has `templates` sheet
- Verify headers are correct
- Check GOOGLE_APPS_SCRIPT_URL is set

**Q: Search not working?**
- Ensure query length > 2 characters
- Check template content is populated

**Q: Download count not incrementing?**
- Verify Google Apps Script has write access
- Check GOOGLE_SHEETS_APPEND_TOKEN is valid

### Future Enhancements

1. **AI-Generated Templates** - Auto-generate templates for new topics
2. **Template Versioning** - Track template changes over time
3. **Collaborative Templates** - Multiple teachers create together
4. **Template Recommendations** - Suggest based on student performance
5. **Offline Templates** - Download for offline use

---

## 📚 Resources

- [CBSE Curriculum](https://www.cbseindia.gov.in/)
- [NCERT Books](https://ncert.nic.in/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [tRPC Documentation](https://trpc.io/)

---

**Status:** ✅ Ready for Production

All templates are tested and ready to use. Start using the library with teachers today!
