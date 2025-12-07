# Scripts Migration Guide

This document outlines the changes made to organize seeding and initialization scripts.

## What Changed

### Folder Structure

**Before:**
```
backend/
├── seed-questions.js
├── seed-default-journey.js
├── seed-relationship-journey.js
├── seed-behavioral-interview.js
├── seed-ic-questions.js
├── seed-em-questions.js
└── ... other root-level scripts
```

**After:**
```
backend/
├── scripts/
│   ├── README.md
│   ├── MIGRATION_GUIDE.md
│   ├── seed-all.js (NEW - Master orchestrator)
│   ├── seed-journeys.js (NEW - Refactored from seed-relationship-journey.js)
│   ├── seed-default-journey.js
│   ├── init-behavioral-journey.js
│   ├── seed-questions.js
│   ├── seed-behavioral-interview.js
│   ├── seed-ic-questions.js
│   └── seed-em-questions.js
└── journeys/
    └── data/
        └── seed-journeys.json (NEW - Unified seed configuration)
```

## Key Improvements

### 1. **Centralized Seed Data**
- **Before:** Question data was hardcoded in `seed-relationship-journey.js` (409 lines)
- **After:** All journey data lives in `journeys/data/seed-journeys.json` - easier to update and maintain

### 2. **New Master Script**
- **New:** `scripts/seed-all.js` orchestrates all seeding operations in correct order
- Provides unified summary of all changes
- Replaces need to run multiple scripts individually

### 3. **Consistent Pattern**
- `seed-journeys.js` follows the same pattern as behavioral journey (config-driven)
- All journeys can now be defined in JSON configuration files
- Easy to add new journeys without changing code

### 4. **Better Organization**
- All scripts in dedicated `scripts/` folder
- Clear separation from main backend code
- Documentation in README and this guide

## How to Update Your Code

### If you import or run seed scripts:

**Old:**
```javascript
import seedRelationshipJourney from '../seed-relationship-journey.js';
// or
node seed-relationship-journey.js
```

**New:**
```javascript
import seedJourneys from '../scripts/seed-journeys.js';
// or
node scripts/seed-journeys.js
```

### Running migrations:

**Old:** Run individual scripts in sequence
```bash
node seed-default-journey.js
node seed-behavioral-interview.js
node seed-ic-questions.js
```

**New:** Run the orchestrator
```bash
node scripts/seed-all.js
```

### Adding new journeys:

**Old:** Create a new seed script file

**New:**
1. Add journey definition to `journeys/data/seed-journeys.json`
2. Run `node scripts/seed-journeys.js`

Example:
```json
{
  "id": "my-new-journey",
  "title": "My New Journey",
  "description": "...",
  "type": "relationship",
  "duration_weeks": 16,
  "cadence": "weekly",
  "questions": [...]
}
```

## Configuration Files Location

All journey/interview configurations now use consistent structure:

| Configuration | Location | Purpose |
|---|---|---|
| Seed data | `journeys/data/seed-journeys.json` | Journey, question, and category definitions |
| IC SWE | `journeys/templates/ic-swe-journey.json` | IC software engineer interview config |
| EM | `journeys/templates/em-journey.json` | Engineering manager interview config |
| Signals | `journeys/signals/competency-signals.json` | Competency signals and company archetypes |

## Backward Compatibility

- Old root-level scripts are **still available** but should be considered **deprecated**
- New code should use scripts from `scripts/` folder
- Old scripts will continue to work but won't be updated
- Consider removing old scripts after migration is complete

## Migration Timeline

### Phase 1 (Now): Setup new structure
- ✓ Created `scripts/` folder
- ✓ Created `seed-journeys.json` configuration
- ✓ Created new/refactored seed scripts
- ✓ Created documentation

### Phase 2 (Recommended): Update imports
- Update any code importing seed scripts to use new paths
- Update CI/CD pipelines to use `scripts/seed-all.js`
- Test that all journeys are created correctly

### Phase 3 (Optional): Cleanup
- Delete old root-level seed scripts (if no longer needed)
- Update documentation
- Archive this migration guide

## Testing the New Structure

### Quick verification:
```bash
# Test the main journey seeding
node scripts/seed-journeys.js

# Test the complete setup
node scripts/seed-all.js

# Verify database has journeys
sqlite3 levelup.db "SELECT COUNT(*) FROM journeys;"
```

### What to check:
- All journeys are created without errors
- No duplicate data is inserted
- Question categories match expected structure
- Tasks are properly linked to questions

## Troubleshooting

### Issue: "Cannot find module"
- Check that you're running from the `backend/` directory
- Verify the import paths are correct (relative to the script location)

### Issue: Database already has journeys
- All scripts check for existing data and skip if found
- This is by design to prevent duplicates
- To reseed, clear the database first

### Issue: Seed data not loading
- Verify `journeys/data/seed-journeys.json` exists
- Check the JSON is valid (use a JSON validator)
- Ensure the path in `seed-journeys.js` is correct

## Questions?

See `scripts/README.md` for detailed documentation on each script.
