# Scripts Quick Reference

## One-Command Setup
```bash
node scripts/seed-all.js
```
This runs everything you need for a complete database setup.

---

## Script Overview

| Script | Purpose | When to Use |
|--------|---------|-----------|
| `seed-all.js` | Master orchestrator | Complete database setup |
| `seed-journeys.js` | Create journeys from JSON config | Adding new journeys |
| `seed-default-journey.js` | Default journey migration | Backward compatibility |
| `init-behavioral-journey.js` | Interview prep setup | IC SWE interview journeys |
| `seed-questions.js` | Base questions | Utility/legacy |
| `seed-behavioral-interview.js` | Interview data | Interview prep data |
| `seed-ic-questions.js` | IC questions | IC-specific setup |
| `seed-em-questions.js` | EM questions | EM-specific setup |

---

## Adding a New Journey

### 1. Edit JSON Config
Edit `journeys/data/seed-journeys.json`:
```json
{
  "journeys": [
    {
      "id": "my-journey",
      "title": "My New Journey",
      "description": "...",
      "duration_weeks": 16,
      "cadence": "weekly",
      "questions": [...]
    }
  ]
}
```

### 2. Run the Seed Script
```bash
node scripts/seed-journeys.js
```

That's it! 🎉

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Seed scripts | `backend/scripts/` | All seeding operations |
| Journey data | `backend/journeys/data/seed-journeys.json` | Journey configurations |
| Interview configs | `backend/journeys/templates/` | IC/EM interview templates |
| Signals | `backend/journeys/signals/competency-signals.json` | Competency definitions |

---

## Common Tasks

### Setup from scratch
```bash
node scripts/seed-all.js
```

### Add a new journey
1. Add to `journeys/data/seed-journeys.json`
2. Run `node scripts/seed-journeys.js`

### Setup interview prep only
```bash
node scripts/init-behavioral-journey.js
```

### Check what's in database
```bash
sqlite3 levelup.db "SELECT title, duration_weeks FROM journeys;"
```

### Debug a script
```bash
# Run with verbose output
node scripts/seed-journeys.js 2>&1 | tee seed-output.log
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module" | Run from `backend/` directory |
| Duplicates being created | Scripts check existing data - this is normal |
| Import path errors | Check relative paths in the script |
| JSON parsing error | Validate `seed-journeys.json` is valid JSON |
| Database locked | Stop other processes using the DB |

---

## Key Principles

✓ **Config-driven** - All journey data in JSON, not hardcoded
✓ **Non-destructive** - Scripts check for existing data before creating
✓ **Documented** - Every script has comments and clear logging
✓ **Organized** - All scripts in one folder for easy management
✓ **Composable** - Can run scripts individually or all together

---

## Documentation

- **README.md** - Full documentation for each script
- **MIGRATION_GUIDE.md** - How to update code that uses these scripts
- **CLEANUP_SUMMARY.md** - What changed and why
- **QUICK_REFERENCE.md** - This file (quick answers)

---

## API Endpoints (For Reference)

Once journeys are seeded, these endpoints are available:

```
GET  /api/journeys              - List all journeys
GET  /api/journeys/:id          - Get journey details
POST /api/journeys/:id/enroll   - Enroll user in journey
GET  /api/my-journeys           - Get user's journeys
GET  /api/my-journeys/:id/tasks - Get tasks for journey
```

---

## Need Help?

1. Check the relevant documentation file above
2. Look at the script comments in the file itself
3. Check the console output for error messages
4. Verify your `seed-journeys.json` is valid JSON

Happy seeding! 🚀
