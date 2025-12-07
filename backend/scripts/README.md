# Backend Scripts

This folder contains database seeding and initialization scripts for the LevelUp application.

## Quick Start

To set up the entire database from scratch:

```bash
node scripts/seed-all.js
```

This will run all seeding operations in the correct order.

---

## Available Scripts

### 1. `seed-all.js` - Master Orchestrator (RECOMMENDED FOR NEW SETUP)
Runs all seeding scripts in the correct order for a complete database setup.

**Usage:**
```bash
node scripts/seed-all.js
```

**What it does:**
- Runs all seeding operations in sequence
- Provides a comprehensive summary
- Handles errors gracefully
- Exits with appropriate status codes

**Output:**
- Summary of all journeys, questions, and tasks created
- IDs of created journeys for reference

---

### 2. `seed-journeys.js` - Main Journey Seeding
Loads journey data from `journeys/data/seed-journeys.json` and creates journeys, questions, categories, and tasks.

**Usage:**
```bash
node scripts/seed-journeys.js
```

**What it does:**
- Reads journey configurations from JSON seed data
- Creates journey records
- Creates question categories
- Creates individual questions with details
- Creates journey tasks linked to questions
- Checks for existing data to avoid duplicates

**Output:**
- Total journeys created
- Total questions created
- Total tasks created

---

### 3. `seed-default-journey.js` - Default Journey Migration
Creates or migrates the default "A Year of Conversations" journey. Maintains backward compatibility.

**Usage:**
```bash
node scripts/seed-default-journey.js
```

**What it does:**
- Creates default journey if it doesn't exist
- Creates tasks from existing questions
- Auto-enrolls all existing users
- Migrates user progress from old format to journey tasks
- Calculates completion percentages

**When to use:**
- During initial setup or database migrations
- For backward compatibility with existing systems

---

### 4. `init-behavioral-journey.js` - Behavioral Interview Journey
Initializes the behavioral interview prep system for software engineers.

**Usage:**
```bash
node scripts/init-behavioral-journey.js
```

**What it does:**
- Loads competency signal definitions
- Creates IC SWE journey from config template
- Loads and verifies story slots (SPARC framework)
- Seeds micro-prompts for interview guidance

**Output:**
- Signal definitions loaded
- Journey ID created
- Story slots with signals and frameworks

---

### 5. `seed-questions.js` - Base Question Seeding
Seeds base questions and question categories (legacy/utility script).

**Usage:**
```bash
node scripts/seed-questions.js
```

---

### 6. `seed-ic-questions.js` - IC-Specific Questions
Populates IC-specific questions for software engineers.

**Usage:**
```bash
node scripts/seed-ic-questions.js
```

---

### 7. `seed-em-questions.js` - EM-Specific Questions
Populates EM (Engineering Manager) specific questions.

**Usage:**
```bash
node scripts/seed-em-questions.js
```

---

### 8. `seed-behavioral-interview.js` - Behavioral Interview Data
Seeds behavioral interview specific data and configurations.

**Usage:**
```bash
node scripts/seed-behavioral-interview.js
```

---

## Seed Data Structure

Seed data is organized in: `journeys/data/seed-journeys.json`

**Format:**
```json
{
  "journeys": [
    {
      "id": "unique-id",
      "title": "Journey Title",
      "description": "Journey description",
      "type": "relationship|behavioral|other",
      "duration_weeks": 32,
      "cadence": "weekly",
      "is_active": true,
      "is_default": true,
      "questions": [
        {
          "week": 1,
          "category": "Category Name",
          "title": "Question Title",
          "prompt": "Main question prompt",
          "details": ["detail 1", "detail 2", ...]
        }
      ]
    }
  ]
}
```

**Key Fields:**
- `id`: Unique identifier for the journey
- `type`: "relationship" for couples guides, "behavioral" for interview prep
- `cadence`: "weekly", "biweekly", "daily", "monthly"
- `questions`: Array of question objects with week, category, title, prompt, and details

---

## Execution Order

For a complete setup, run scripts in this order:

1. **seed-journeys.js** - Creates base journeys from JSON config
2. **seed-default-journey.js** (optional) - Migrates existing data
3. **init-behavioral-journey.js** - Sets up interview prep system

---

## Database Requirements

These scripts require the following tables:
- `journeys`
- `journey_tasks`
- `question_categories`
- `questions`
- `question_details`
- `users` (for enrollment)
- `user_journeys` (for progress tracking)
- `user_task_progress`

---

## Error Handling

All scripts:
- Check for existing data to avoid duplicates
- Use transactions where possible
- Provide detailed console output
- Exit with code 0 on success, 1 on failure

---

## Configuration Files

Related configuration files:

| File | Purpose |
|------|---------|
| `journeys/data/seed-journeys.json` | Journey, question, and category definitions |
| `journeys/templates/ic-swe-journey.json` | IC SWE behavioral interview config |
| `journeys/templates/em-journey.json` | EM behavioral interview config |
| `journeys/signals/competency-signals.json` | Signal definitions and mapping |

---

## Development Notes

When adding new journeys:

1. Add journey definition to `journeys/data/seed-journeys.json`
2. Run `seed-journeys.js` to create in database
3. Use `journeyConfigService` for template-based journeys
4. Always include proper error handling and validation

For template-based journeys, create a JSON config in `journeys/templates/` and update `journeyConfigService` to load it.
