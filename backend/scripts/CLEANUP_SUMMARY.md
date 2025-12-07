# Scripts Cleanup & Organization Summary

## What Was Accomplished

### ✓ New Folder Structure
Created `backend/scripts/` folder with all seeding and initialization scripts organized centrally.

**New files created:**
- `scripts/seed-journeys.js` - Refactored to use JSON configuration (replaces hardcoded data)
- `scripts/seed-all.js` - Master orchestrator script for complete database setup
- `scripts/README.md` - Comprehensive documentation
- `scripts/MIGRATION_GUIDE.md` - Guide for updating code that uses these scripts
- `scripts/CLEANUP_SUMMARY.md` - This file

**Moved to scripts/ folder:**
- `seed-default-journey.js` - Default journey migration
- `init-behavioral-journey.js` - Behavioral interview system init
- `seed-questions.js` - Base question seeding
- `seed-behavioral-interview.js` - Behavioral interview data
- `seed-ic-questions.js` - IC-specific questions
- `seed-em-questions.js` - EM-specific questions

### ✓ Unified Seed Data
Created `journeys/data/seed-journeys.json` with all journey configurations in one place.

**Benefits:**
- All 32 weeks of questions now in JSON format (previously hardcoded in Python script)
- Easy to add new journeys without modifying code
- Consistent structure with behavioral journey configs
- Single source of truth for journey data

### ✓ Improved Template Usage
All journey seeding now follows consistent pattern:
- Config-driven (JSON configuration files)
- Template-based (templates in `journeys/templates/`)
- Service-based (journeyConfigService handles complex logic)

### ✓ Better Documentation
Three comprehensive documentation files:
1. **README.md** - Usage guide for each script
2. **MIGRATION_GUIDE.md** - How to update your code
3. **CLEANUP_SUMMARY.md** - This summary (what changed and why)

---

## File Organization

```
backend/
├── scripts/
│   ├── README.md                    [NEW] Documentation
│   ├── MIGRATION_GUIDE.md           [NEW] Update guide
│   ├── CLEANUP_SUMMARY.md           [NEW] This file
│   ├── seed-all.js                  [NEW] Master orchestrator
│   ├── seed-journeys.js             [NEW] Refactored from seed-relationship-journey.js
│   ├── seed-default-journey.js      [MOVED]
│   ├── init-behavioral-journey.js   [MOVED]
│   ├── seed-questions.js            [MOVED]
│   ├── seed-behavioral-interview.js [MOVED]
│   ├── seed-ic-questions.js         [MOVED]
│   └── seed-em-questions.js         [MOVED]
│
├── journeys/
│   ├── data/
│   │   └── seed-journeys.json       [NEW] All journey configurations
│   ├── templates/
│   │   ├── ic-swe-journey.json      [EXISTING]
│   │   └── em-journey.json          [EXISTING]
│   └── signals/
│       └── competency-signals.json  [EXISTING]
│
└── [OLD SCRIPTS - Still at root, consider deleting]
    ├── seed-questions.js
    ├── seed-default-journey.js
    ├── seed-relationship-journey.js
    ├── seed-behavioral-interview.js
    ├── seed-ic-questions.js
    └── seed-em-questions.js
```

---

## Key Changes & Why

### 1. Centralized Scripts Folder
**Why:** Better organization and cleaner file structure
**What changed:** All seeding scripts now in `scripts/` instead of scattered at root

### 2. JSON Seed Configuration
**Why:** Easier to maintain, easier to add new journeys
**What changed:** Hardcoded questions → JSON configuration file
- `seed-journeys.json`: 32 weeks of relationship questions + metadata
- Follows same pattern as behavioral interview configs

### 3. Master Orchestrator Script
**Why:** Simpler setup process, automated dependency ordering
**What changed:**
- Old: Run `seed-default-journey.js`, then `seed-behavioral-interview.js`, etc.
- New: Run `seed-all.js` once

### 4. Refactored seed-journeys.js
**Why:** Consistent pattern, config-driven approach
**What changed:**
- Reads from JSON config instead of hardcoding 409 lines of data
- Works with `journeyConfigService` like behavioral journeys do
- Easier to maintain and extend

---

## Usage

### New Setup Process
```bash
cd backend
node scripts/seed-all.js
```

### Old Process (Still Works)
```bash
# Can still run individual scripts
node scripts/seed-journeys.js
node scripts/seed-default-journey.js
node scripts/init-behavioral-journey.js
```

---

## Backward Compatibility

✓ **Old scripts still work** - They're still at root level
✓ **New scripts are cleaner** - Use the organized `scripts/` folder
✓ **No breaking changes** - All imports/functionality remain the same

### Action Items (Optional)

1. **Update CI/CD pipelines** to use `scripts/seed-all.js` instead of individual scripts
2. **Update documentation** to reference `scripts/` folder
3. **Delete old scripts** once migration is complete (optional cleanup)

---

## Next Steps

### For Development
1. Run `node scripts/seed-all.js` for complete database setup
2. Check `scripts/README.md` for detailed documentation on each script
3. Add new journeys to `journeys/data/seed-journeys.json`

### For Deployment
1. Update deployment scripts to use `scripts/seed-all.js`
2. Update any references in documentation
3. Test complete setup in staging environment

### For Production
1. Before running seeds, backup database
2. Run `node scripts/seed-all.js`
3. Verify all journeys created: `SELECT * FROM journeys;`
4. Monitor logs for any errors

---

## Summary Table

| Aspect | Before | After |
|--------|--------|-------|
| Scripts location | Root level (messy) | `scripts/` folder (organized) |
| Journey data | Hardcoded in JS (409 lines) | JSON config (easy to edit) |
| Setup process | Multiple scripts | Single `seed-all.js` |
| Documentation | None | 3 comprehensive guides |
| New journeys | Modify code | Update JSON, run script |
| Maintainability | Difficult | Easy |

---

## Questions?

- See `README.md` for script documentation
- See `MIGRATION_GUIDE.md` for updating your code
- Check `journeys/data/seed-journeys.json` for journey structure

All scripts are well-commented and include error handling. Happy seeding! 🚀
