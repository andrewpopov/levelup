import db from './database.js';

/**
 * IC Software Engineer Question Packs
 *
 * Seeds 39 behavioral interview questions organized by 8 competency categories:
 * A. Ownership, Impact & Execution (5 questions)
 * B. Ambiguity & Problem Solving (5 questions)
 * C. Collaboration & Communication (5 questions)
 * D. Conflict, Pushback & Influence (5 questions)
 * E. Quality, Craft & Reliability (5 questions)
 * F. Learning, Feedback & Growth (5 questions)
 * G. Product Sense & Customer Focus (5 questions)
 * H. Motivation & Culture Fit (4 questions)
 */

const IC_QUESTIONS = {
  'A. Ownership, Impact & Execution': [
    {
      question: 'Tell me about a time you took ownership of a project that was struggling.',
      signals: ['ownership', 'execution', 'leadership'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe a situation where you had to push back on a deadline or requirement.',
      signals: ['ownership', 'conflict', 'execution'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about your biggest technical achievement and its impact on the business.',
      signals: ['ownership', 'execution', 'craft', 'product_sense'],
      difficulty: 'hard',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you approach scoping a large, undefined project?',
      signals: ['ownership', 'execution', 'ambiguity'],
      difficulty: 'medium',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to deliver results with limited resources.',
      signals: ['ownership', 'execution', 'problem_solving'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'B. Ambiguity & Problem Solving': [
    {
      question: 'Describe a time when requirements were unclear and how you handled it.',
      signals: ['ambiguity', 'ownership', 'product_sense'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a complex problem you solved and your approach.',
      signals: ['ambiguity', 'craft', 'learning'],
      difficulty: 'hard',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you approach investigating a vague bug report?',
      signals: ['ambiguity', 'problem_solving', 'craft'],
      difficulty: 'easy',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to make a decision without complete information.',
      signals: ['ambiguity', 'ownership', 'leadership'],
      difficulty: 'medium',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe a situation where you had to learn a new domain or technology quickly.',
      signals: ['ambiguity', 'learning', 'craft'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'C. Collaboration & Communication': [
    {
      question: 'Tell me about a time you had to work effectively with a difficult team member.',
      signals: ['collaboration', 'conflict', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe a time you mentored or helped grow another engineer.',
      signals: ['collaboration', 'leadership', 'learning'],
      difficulty: 'medium',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you communicate a technical decision to non-technical stakeholders?',
      signals: ['collaboration', 'communication', 'product_sense'],
      difficulty: 'medium',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to collaborate across teams or departments.',
      signals: ['collaboration', 'leadership', 'execution'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe your approach to code reviews and giving feedback.',
      signals: ['collaboration', 'craft', 'communication'],
      difficulty: 'easy',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'D. Conflict, Pushback & Influence': [
    {
      question: 'Tell me about a time you disagreed with your manager or a senior engineer.',
      signals: ['conflict', 'communication', 'leadership'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe a time you had to convince the team to adopt a new approach.',
      signals: ['conflict', 'leadership', 'influence'],
      difficulty: 'hard',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a major technical disagreement you had and how it was resolved.',
      signals: ['conflict', 'collaboration', 'craft'],
      difficulty: 'medium',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you handle feedback that you initially disagree with?',
      signals: ['conflict', 'learning', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you influenced a decision you didn\'t have authority over.',
      signals: ['conflict', 'leadership', 'influence'],
      difficulty: 'hard',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'E. Quality, Craft & Reliability': [
    {
      question: 'Tell me about a time you prioritized code quality over speed.',
      signals: ['craft', 'ownership', 'execution'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe a production incident you were involved in and how it was handled.',
      signals: ['craft', 'execution', 'learning'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to pay down technical debt.',
      signals: ['craft', 'ownership', 'execution'],
      difficulty: 'medium',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you ensure your code is maintainable and well-documented?',
      signals: ['craft', 'collaboration', 'communication'],
      difficulty: 'easy',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a system you designed that had to handle significant scale.',
      signals: ['craft', 'execution', 'problem_solving'],
      difficulty: 'hard',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'F. Learning, Feedback & Growth': [
    {
      question: 'Tell me about a time you received critical feedback and how you responded.',
      signals: ['learning', 'communication', 'ownership'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe your approach to staying current with new technologies.',
      signals: ['learning', 'craft', 'ambiguity'],
      difficulty: 'easy',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a significant skill gap you identified and how you closed it.',
      signals: ['learning', 'ownership', 'execution'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you approach learning from failures or mistakes?',
      signals: ['learning', 'ownership', 'craft'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a project where you learned the most and why.',
      signals: ['learning', 'craft', 'execution'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'G. Product Sense & Customer Focus': [
    {
      question: 'Describe a time you influenced a product decision based on user data.',
      signals: ['product_sense', 'execution', 'collaboration'],
      difficulty: 'hard',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to balance technical purity with customer needs.',
      signals: ['product_sense', 'conflict', 'ownership'],
      difficulty: 'hard',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you think about the customer when making technical decisions?',
      signals: ['product_sense', 'leadership', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you pushed back on a feature request and why.',
      signals: ['product_sense', 'ownership', 'conflict'],
      difficulty: 'medium',
      applicable_roles: ['sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe your involvement in a product launch or major feature rollout.',
      signals: ['product_sense', 'execution', 'collaboration'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'H. Motivation & Culture Fit': [
    {
      question: 'What motivates you most in your engineering work?',
      signals: ['motivation', 'product_sense', 'learning'],
      difficulty: 'easy',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you went above and beyond your job description.',
      signals: ['ownership', 'motivation', 'leadership'],
      difficulty: 'medium',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you approach work-life balance and staying healthy in tech?',
      signals: ['motivation', 'learning', 'ownership'],
      difficulty: 'easy',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about your ideal team and work environment.',
      signals: ['motivation', 'collaboration', 'learning'],
      difficulty: 'easy',
      applicable_roles: ['swe', 'sr_swe', 'staff'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ]
};

async function seedICQuestions() {
  console.log('Seeding IC Software Engineer Question Packs...\n');

  let questionsAdded = 0;

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT,
          question_text TEXT NOT NULL,
          signals TEXT,
          difficulty TEXT,
          applicable_roles TEXT,
          company_types TEXT,
          journey_type TEXT DEFAULT 'ic-swe',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating questions table:', err);
          return reject(err);
        }

        let categoriesProcessed = 0;
        const categories = Object.keys(IC_QUESTIONS);

        categories.forEach((category) => {
          const questions = IC_QUESTIONS[category];

          let questionsProcessed = 0;

          questions.forEach((q) => {
            db.run(
              `INSERT INTO questions (
                category,
                question_text,
                signals,
                difficulty,
                applicable_roles,
                company_types,
                journey_type
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                category,
                q.question,
                JSON.stringify(q.signals),
                q.difficulty,
                JSON.stringify(q.applicable_roles),
                JSON.stringify(q.company_types),
                'ic-swe'
              ],
              (err) => {
                if (err) {
                  console.error('Error inserting question:', err);
                } else {
                  questionsAdded++;
                }

                questionsProcessed++;
                if (questionsProcessed === questions.length) {
                  categoriesProcessed++;
                  console.log(`✓ Seeded ${questions.length} questions for "${category}"`);

                  if (categoriesProcessed === categories.length) {
                    console.log(`\n${'='.repeat(60)}`);
                    console.log(`✓ IC QUESTIONS SEEDED!`);
                    console.log(`${'='.repeat(60)}`);
                    console.log(`Total Questions: ${questionsAdded}`);
                    console.log(`Categories: ${categories.length}`);
                    console.log(`Journey Type: IC Software Engineer`);
                    console.log(`${'='.repeat(60)}\n`);
                    resolve(questionsAdded);
                  }
                }
              }
            );
          });
        });
      });
    });
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedICQuestions()
    .then((count) => {
      console.log(`Successfully seeded ${count} IC questions`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed IC questions:', error);
      process.exit(1);
    });
}

export default seedICQuestions;
