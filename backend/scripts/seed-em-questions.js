import db from './database.js';

/**
 * EM (Engineering Manager) Question Packs
 *
 * Seeds 37 behavioral interview questions organized by 9 competency categories:
 * A. Leadership Philosophy & Values (4 questions)
 * B. People Management & Performance (5 questions)
 * C. Conflict & Difficult Situations (4 questions)
 * D. Execution, Planning & Delivery (5 questions)
 * E. Cross-Functional Leadership (4 questions)
 * F. Hiring & Team Building (4 questions)
 * G. Strategy & Technical Leadership (4 questions)
 * H. Diversity & Inclusion (3 questions)
 * I. Meta & Self-Reflection (4 questions)
 */

const EM_QUESTIONS = {
  'A. Leadership Philosophy & Values': [
    {
      question: 'What is your leadership philosophy and how do you practice it?',
      signals: ['leadership', 'people_management', 'learning'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a decision where you prioritized team values over metrics.',
      signals: ['leadership', 'people_management', 'execution'],
      difficulty: 'hard',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you define and build psychological safety on your team?',
      signals: ['leadership', 'people_management', 'collaboration'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about your approach to transparency and communication with your team.',
      signals: ['leadership', 'collaboration', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'B. People Management & Performance': [
    {
      question: 'Tell me about a time you had to manage an underperforming employee.',
      signals: ['people_management', 'conflict', 'communication'],
      difficulty: 'hard',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you approach giving feedback to high performers vs. struggling team members?',
      signals: ['people_management', 'communication', 'leadership'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you successfully developed a direct report into a stronger engineer or leader.',
      signals: ['people_management', 'leadership', 'learning'],
      difficulty: 'hard',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you balance supporting your team while holding them accountable?',
      signals: ['people_management', 'execution', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about your approach to career development conversations with direct reports.',
      signals: ['people_management', 'leadership', 'learning'],
      difficulty: 'easy',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'C. Conflict & Difficult Situations': [
    {
      question: 'Tell me about a time you had to have a difficult conversation with a direct report.',
      signals: ['conflict', 'people_management', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Describe a time when you had conflict with a peer manager or your own manager.',
      signals: ['conflict', 'collaboration', 'leadership'],
      difficulty: 'hard',
      applicable_roles: ['sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to navigate conflict between two team members.',
      signals: ['conflict', 'people_management', 'leadership'],
      difficulty: 'hard',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you handle situations where team members don\'t get along?',
      signals: ['conflict', 'people_management', 'collaboration'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'D. Execution, Planning & Delivery': [
    {
      question: 'Tell me about a time you had to deliver results with an unprepared or understaffed team.',
      signals: ['execution', 'people_management', 'leadership'],
      difficulty: 'hard',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you approach setting goals and OKRs for your team?',
      signals: ['execution', 'leadership', 'collaboration'],
      difficulty: 'medium',
      applicable_roles: ['sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time your team missed a major deadline or goal.',
      signals: ['execution', 'people_management', 'learning'],
      difficulty: 'hard',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you balance short-term execution with long-term team health?',
      signals: ['execution', 'leadership', 'people_management'],
      difficulty: 'hard',
      applicable_roles: ['sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about how you track and improve team productivity and velocity.',
      signals: ['execution', 'leadership', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'E. Cross-Functional Leadership': [
    {
      question: 'Tell me about a time you had to influence or align with a manager outside your chain of command.',
      signals: ['leadership', 'collaboration', 'communication'],
      difficulty: 'hard',
      applicable_roles: ['sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you approach working with product and design teams?',
      signals: ['collaboration', 'leadership', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a cross-org initiative you led and the challenges you faced.',
      signals: ['leadership', 'execution', 'collaboration'],
      difficulty: 'hard',
      applicable_roles: ['sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you advocate for your team\'s needs when resources are scarce?',
      signals: ['leadership', 'people_management', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'F. Hiring & Team Building': [
    {
      question: 'Tell me about your process for hiring engineers and how you evaluate candidates.',
      signals: ['people_management', 'leadership', 'execution'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you approach building a diverse and inclusive team?',
      signals: ['people_management', 'leadership', 'learning'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to reduce headcount or reorganize your team.',
      signals: ['people_management', 'leadership', 'conflict'],
      difficulty: 'hard',
      applicable_roles: ['sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you onboard new team members and set them up for success?',
      signals: ['people_management', 'leadership', 'communication'],
      difficulty: 'easy',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'G. Strategy & Technical Leadership': [
    {
      question: 'Tell me about a significant technical direction you set for your team.',
      signals: ['leadership', 'execution', 'learning'],
      difficulty: 'hard',
      applicable_roles: ['sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you maintain technical credibility while managing your team?',
      signals: ['leadership', 'learning', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to make a strategic trade-off for the business.',
      signals: ['leadership', 'execution', 'people_management'],
      difficulty: 'hard',
      applicable_roles: ['sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you stay current with technical trends while managing people?',
      signals: ['leadership', 'learning', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'H. Diversity & Inclusion': [
    {
      question: 'Tell me about your approach to building inclusive teams and addressing bias.',
      signals: ['people_management', 'leadership', 'learning'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you ensure equal opportunities for growth and advancement on your team?',
      signals: ['people_management', 'leadership', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you had to address a DEI issue or uncomfortable moment on the team.',
      signals: ['leadership', 'conflict', 'learning'],
      difficulty: 'hard',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ],

  'I. Meta & Self-Reflection': [
    {
      question: 'What is the biggest leadership lesson you\'ve learned?',
      signals: ['learning', 'leadership', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about a time you received feedback about your leadership that was hard to hear.',
      signals: ['learning', 'leadership', 'communication'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'How do you stay mentally healthy and avoid burnout in a demanding role?',
      signals: ['learning', 'leadership', 'execution'],
      difficulty: 'easy',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    },
    {
      question: 'Tell me about your vision for your team and career as a manager.',
      signals: ['leadership', 'execution', 'learning'],
      difficulty: 'medium',
      applicable_roles: ['em', 'sr_em', 'staff_em'],
      company_types: ['faang', 'hypergrowth', 'enterprise']
    }
  ]
};

async function seedEMQuestions() {
  console.log('Seeding Engineering Manager Question Packs...\n');

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
          journey_type TEXT DEFAULT 'em',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating questions table:', err);
          return reject(err);
        }

        let categoriesProcessed = 0;
        const categories = Object.keys(EM_QUESTIONS);

        categories.forEach((category) => {
          const questions = EM_QUESTIONS[category];

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
                'em'
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
                    console.log(`✓ EM QUESTIONS SEEDED!`);
                    console.log(`${'='.repeat(60)}`);
                    console.log(`Total Questions: ${questionsAdded}`);
                    console.log(`Categories: ${categories.length}`);
                    console.log(`Journey Type: Engineering Manager`);
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
  seedEMQuestions()
    .then((count) => {
      console.log(`Successfully seeded ${count} EM questions`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed EM questions:', error);
      process.exit(1);
    });
}

export default seedEMQuestions;
