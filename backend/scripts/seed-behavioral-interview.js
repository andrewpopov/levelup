import db from './database.js';

/**
 * Seed Script: Behavioral Interview Mastery Journey
 *
 * Creates a comprehensive 50+ question journey for software engineering
 * behavioral interview preparation using the STAR method
 */

const behavioralQuestions = [
  // Category 1: Leadership & Influence (6 questions)
  {
    category: 'Leadership & Influence',
    title: 'Leading Without Authority',
    prompt: 'Tell me about a time you had to influence a team or colleague without having formal authority over them.',
    details: [
      'What was the situation and why did you need to influence them?',
      'What approach did you take to build credibility and trust?',
      'What specific actions did you take to influence the outcome?',
      'What was the result and what did you learn about leadership?'
    ]
  },
  {
    category: 'Leadership & Influence',
    title: 'Mentoring and Growing Others',
    prompt: 'Describe a time when you helped a colleague or team member improve their skills or performance.',
    details: [
      'What skill gap or performance issue did you identify?',
      'How did you approach the mentoring relationship?',
      'What specific guidance or support did you provide?',
      'How did the person improve and what was the impact on the team?'
    ]
  },
  {
    category: 'Leadership & Influence',
    title: 'Driving Technical Direction',
    prompt: 'Tell me about a time when you championed a new technology, tool, or architectural approach.',
    details: [
      'What was the technical initiative you wanted to pursue?',
      'What resistance or challenges did you face?',
      'How did you build buy-in and convince stakeholders?',
      'What was the outcome and long-term impact?'
    ]
  },
  {
    category: 'Leadership & Influence',
    title: 'Taking Ownership in Crisis',
    prompt: 'Describe a situation where you took ownership of a critical problem that wasn\'t originally your responsibility.',
    details: [
      'What was the crisis and why did it need immediate attention?',
      'Why did you decide to step up even though it wasn\'t your responsibility?',
      'What actions did you take to resolve it?',
      'What was the result and how did it affect the team?'
    ]
  },
  {
    category: 'Leadership & Influence',
    title: 'Building Team Culture',
    prompt: 'Tell me about a time when you helped improve team morale, collaboration, or culture.',
    details: [
      'What cultural or morale issue did you observe?',
      'What actions did you take to improve the situation?',
      'How did you measure the impact of your efforts?',
      'What lasting changes resulted from your initiative?'
    ]
  },
  {
    category: 'Leadership & Influence',
    title: 'Advocating for Quality',
    prompt: 'Describe a time when you advocated for higher quality standards or better engineering practices.',
    details: [
      'What quality issue or practice gap did you identify?',
      'What resistance did you encounter and from whom?',
      'How did you make the case for higher standards?',
      'What improvements resulted from your advocacy?'
    ]
  },

  // Category 2: Problem Solving & Innovation (6 questions)
  {
    category: 'Problem Solving & Innovation',
    title: 'Complex Technical Problem',
    prompt: 'Tell me about the most complex technical problem you\'ve solved. Walk me through your approach.',
    details: [
      'What made this problem particularly complex?',
      'How did you break down the problem and identify root causes?',
      'What approaches did you try and which one worked?',
      'What was the final solution and its impact?'
    ]
  },
  {
    category: 'Problem Solving & Innovation',
    title: 'Innovative Solution',
    prompt: 'Describe a time when you came up with a creative or innovative solution to a challenging problem.',
    details: [
      'What was the problem and why were conventional approaches insufficient?',
      'How did you generate and evaluate different innovative approaches?',
      'What was your creative solution and how did you implement it?',
      'What made this solution innovative and what was the impact?'
    ]
  },
  {
    category: 'Problem Solving & Innovation',
    title: 'Debugging a Critical Issue',
    prompt: 'Tell me about a time when you had to debug a particularly difficult production issue.',
    details: [
      'What was the issue and what was its impact on users or the business?',
      'How did you approach the investigation with limited information?',
      'What debugging techniques or tools did you use?',
      'How did you resolve it and prevent future occurrences?'
    ]
  },
  {
    category: 'Problem Solving & Innovation',
    title: 'Performance Optimization',
    prompt: 'Describe a situation where you significantly improved the performance of a system or application.',
    details: [
      'What performance issues were you experiencing?',
      'How did you identify the bottlenecks?',
      'What optimizations did you implement?',
      'What performance improvements did you achieve?'
    ]
  },
  {
    category: 'Problem Solving & Innovation',
    title: 'System Design Challenge',
    prompt: 'Tell me about a time when you had to design a system or feature with significant technical constraints.',
    details: [
      'What were you building and what were the constraints?',
      'How did you approach the design process?',
      'What trade-offs did you have to make?',
      'How did your design perform in practice?'
    ]
  },
  {
    category: 'Problem Solving & Innovation',
    title: 'Data-Driven Decision',
    prompt: 'Describe a time when you used data analysis to drive a technical decision or solve a problem.',
    details: [
      'What problem or decision were you facing?',
      'What data did you collect and how did you analyze it?',
      'What insights did the data reveal?',
      'How did this inform your decision and what was the outcome?'
    ]
  },

  // Category 3: Teamwork & Collaboration (6 questions)
  {
    category: 'Teamwork & Collaboration',
    title: 'Cross-Functional Collaboration',
    prompt: 'Tell me about a time when you worked with multiple teams or departments to deliver a project.',
    details: [
      'What was the project and which teams were involved?',
      'What challenges arose from working across teams?',
      'How did you facilitate communication and alignment?',
      'What was the outcome and what did you learn about collaboration?'
    ]
  },
  {
    category: 'Teamwork & Collaboration',
    title: 'Contributing to Team Success',
    prompt: 'Describe a situation where you went above and beyond your role to help your team succeed.',
    details: [
      'What was the team trying to accomplish?',
      'What extra effort did you contribute beyond your core responsibilities?',
      'How did your contribution help the team?',
      'What was the impact and how was it recognized?'
    ]
  },
  {
    category: 'Teamwork & Collaboration',
    title: 'Remote Team Collaboration',
    prompt: 'Tell me about your experience working effectively with a distributed or remote team.',
    details: [
      'What was the project and how was the team distributed?',
      'What challenges did the remote setup create?',
      'What practices or tools did you use to stay aligned?',
      'How did you build relationships despite the distance?'
    ]
  },
  {
    category: 'Teamwork & Collaboration',
    title: 'Pair Programming Experience',
    prompt: 'Describe a time when you worked closely with another engineer through pair programming or code review.',
    details: [
      'What were you working on together?',
      'How did you divide responsibilities and share knowledge?',
      'What did you learn from each other?',
      'How did this collaboration improve the final outcome?'
    ]
  },
  {
    category: 'Teamwork & Collaboration',
    title: 'Supporting a Struggling Teammate',
    prompt: 'Tell me about a time when you helped a teammate who was struggling or falling behind.',
    details: [
      'How did you recognize they were struggling?',
      'How did you approach the situation sensitively?',
      'What specific help or support did you provide?',
      'What was the outcome for them and for the project?'
    ]
  },
  {
    category: 'Teamwork & Collaboration',
    title: 'Building Consensus',
    prompt: 'Describe a time when you had to build consensus among team members with different viewpoints.',
    details: [
      'What was the decision or issue at hand?',
      'What different viewpoints existed?',
      'How did you facilitate discussion and find common ground?',
      'What consensus was reached and how did it work out?'
    ]
  },

  // Category 4: Conflict Resolution (5 questions)
  {
    category: 'Conflict Resolution',
    title: 'Disagreement with Manager',
    prompt: 'Tell me about a time when you disagreed with your manager or team lead about a technical decision.',
    details: [
      'What was the disagreement about?',
      'How did you express your concerns professionally?',
      'How was the disagreement resolved?',
      'What was the outcome and what did you learn?'
    ]
  },
  {
    category: 'Conflict Resolution',
    title: 'Team Conflict',
    prompt: 'Describe a situation where you had to resolve a conflict between team members.',
    details: [
      'What was the nature of the conflict?',
      'How did you get involved and facilitate resolution?',
      'What approach did you take to help them find common ground?',
      'How was the conflict resolved and what was the aftermath?'
    ]
  },
  {
    category: 'Conflict Resolution',
    title: 'Handling Difficult Feedback',
    prompt: 'Tell me about a time when you received critical feedback that was difficult to hear.',
    details: [
      'What was the feedback and who gave it to you?',
      'What was your initial reaction?',
      'How did you process and respond to the feedback?',
      'What actions did you take and how did you improve?'
    ]
  },
  {
    category: 'Conflict Resolution',
    title: 'Stakeholder Disagreement',
    prompt: 'Describe a time when stakeholders had conflicting requirements or priorities for your project.',
    details: [
      'Who were the stakeholders and what were their conflicting needs?',
      'How did you navigate this situation?',
      'What solution or compromise did you propose?',
      'How did you ensure all parties felt heard?'
    ]
  },
  {
    category: 'Conflict Resolution',
    title: 'Code Review Disagreement',
    prompt: 'Tell me about a time when you had a significant disagreement during a code review.',
    details: [
      'What was the disagreement about?',
      'How did you communicate your perspective?',
      'How did you work toward resolution?',
      'What was decided and did it improve the code?'
    ]
  },

  // Category 5: Adaptability & Learning (6 questions)
  {
    category: 'Adaptability & Learning',
    title: 'Learning New Technology',
    prompt: 'Describe a time when you had to quickly learn a new technology or programming language for a project.',
    details: [
      'What technology did you need to learn and why?',
      'How did you approach learning it quickly?',
      'What resources or strategies did you use?',
      'How did you apply this new knowledge and what was the outcome?'
    ]
  },
  {
    category: 'Adaptability & Learning',
    title: 'Pivoting Under Pressure',
    prompt: 'Tell me about a time when priorities changed suddenly and you had to adapt quickly.',
    details: [
      'What were you working on when priorities changed?',
      'How did you handle the change emotionally and practically?',
      'What did you do to quickly pivot to the new priority?',
      'What was the outcome of your adaptability?'
    ]
  },
  {
    category: 'Adaptability & Learning',
    title: 'Unfamiliar Domain',
    prompt: 'Describe a situation where you had to work in an unfamiliar business domain or problem space.',
    details: [
      'What was the unfamiliar domain?',
      'How did you ramp up your domain knowledge?',
      'Who did you learn from and what resources did you use?',
      'How did you apply your technical skills in this new context?'
    ]
  },
  {
    category: 'Adaptability & Learning',
    title: 'Overcoming Technical Obstacle',
    prompt: 'Tell me about a time when you encountered a technical obstacle that seemed insurmountable.',
    details: [
      'What was the obstacle and why did it seem insurmountable?',
      'What was your emotional and practical response?',
      'What creative approaches did you try?',
      'How did you eventually overcome it?'
    ]
  },
  {
    category: 'Adaptability & Learning',
    title: 'Process Change',
    prompt: 'Describe a time when your team adopted a new process or methodology (e.g., Agile, CI/CD).',
    details: [
      'What was the new process and why was it being introduced?',
      'What challenges did you or the team face in adapting?',
      'How did you help yourself and others adjust?',
      'What was the impact of the change?'
    ]
  },
  {
    category: 'Adaptability & Learning',
    title: 'Scaling Your Skills',
    prompt: 'Tell me about a time when you had to level up your skills to take on a more complex responsibility.',
    details: [
      'What new responsibility or challenge were you facing?',
      'What skill gaps did you identify?',
      'How did you systematically improve your skills?',
      'How did you apply your upgraded skills to succeed?'
    ]
  },

  // Category 6: Project Management & Delivery (5 questions)
  {
    category: 'Project Management & Delivery',
    title: 'Meeting Tight Deadline',
    prompt: 'Tell me about a time when you had to deliver a project under a very tight deadline.',
    details: [
      'What was the project and why was the deadline so tight?',
      'How did you prioritize and scope the work?',
      'What trade-offs did you make to meet the deadline?',
      'Did you deliver on time and what was the quality of the result?'
    ]
  },
  {
    category: 'Project Management & Delivery',
    title: 'Managing Technical Debt',
    prompt: 'Describe a situation where you had to balance feature delivery with addressing technical debt.',
    details: [
      'What technical debt existed and what pressure were you under to deliver features?',
      'How did you make the case for addressing technical debt?',
      'What approach did you take to balance both needs?',
      'What was the outcome for both velocity and code quality?'
    ]
  },
  {
    category: 'Project Management & Delivery',
    title: 'Project Falling Behind',
    prompt: 'Tell me about a time when a project you were working on was falling behind schedule.',
    details: [
      'What caused the project to fall behind?',
      'How did you identify and communicate the issue?',
      'What actions did you take to get back on track?',
      'What was the final outcome?'
    ]
  },
  {
    category: 'Project Management & Delivery',
    title: 'Estimation Challenge',
    prompt: 'Describe a time when you significantly under or over-estimated the effort for a task or project.',
    details: [
      'What did you estimate and what was the actual effort?',
      'What factors did you miss in your original estimate?',
      'How did you handle the discrepancy?',
      'What did you learn about estimation?'
    ]
  },
  {
    category: 'Project Management & Delivery',
    title: 'Managing Dependencies',
    prompt: 'Tell me about a complex project where you had to manage multiple dependencies across teams.',
    details: [
      'What was the project and what teams were involved?',
      'How did you identify and track dependencies?',
      'What issues arose and how did you handle them?',
      'How did you ensure successful coordination?'
    ]
  },

  // Category 7: Technical Decision Making (5 questions)
  {
    category: 'Technical Decision Making',
    title: 'Architecture Decision',
    prompt: 'Tell me about a significant architectural decision you made and how you approached it.',
    details: [
      'What was the architectural decision you needed to make?',
      'What options did you consider?',
      'How did you evaluate trade-offs?',
      'What did you decide and how has it held up over time?'
    ]
  },
  {
    category: 'Technical Decision Making',
    title: 'Build vs Buy',
    prompt: 'Describe a time when you had to decide whether to build a solution in-house or use a third-party tool.',
    details: [
      'What capability or feature did you need?',
      'What were the options you considered?',
      'How did you weigh the pros and cons?',
      'What did you decide and what was the outcome?'
    ]
  },
  {
    category: 'Technical Decision Making',
    title: 'Technology Selection',
    prompt: 'Tell me about a time when you had to choose between competing technologies or frameworks.',
    details: [
      'What technologies were you choosing between?',
      'What criteria did you use to evaluate them?',
      'Who did you involve in the decision?',
      'What did you choose and why?'
    ]
  },
  {
    category: 'Technical Decision Making',
    title: 'Technical Risk Assessment',
    prompt: 'Describe a situation where you had to assess and communicate technical risks for a project.',
    details: [
      'What was the project and what risks did you identify?',
      'How did you assess the likelihood and impact of each risk?',
      'How did you communicate these risks to stakeholders?',
      'How did you mitigate the risks?'
    ]
  },
  {
    category: 'Technical Decision Making',
    title: 'Refactoring Decision',
    prompt: 'Tell me about a time when you decided to refactor a significant piece of code or system.',
    details: [
      'What code or system needed refactoring and why?',
      'How did you justify the investment to refactor?',
      'What was your refactoring approach?',
      'What improvements resulted from the refactoring?'
    ]
  },

  // Category 8: Communication (5 questions)
  {
    category: 'Communication',
    title: 'Explaining Technical Concepts',
    prompt: 'Tell me about a time when you had to explain a complex technical concept to a non-technical audience.',
    details: [
      'What was the technical concept?',
      'Who was your audience and what was their background?',
      'How did you adapt your communication?',
      'How did you verify they understood?'
    ]
  },
  {
    category: 'Communication',
    title: 'Documenting a System',
    prompt: 'Describe a time when you created documentation that significantly helped your team or others.',
    details: [
      'What system or process did you document?',
      'Why was this documentation needed?',
      'How did you structure and present the information?',
      'What impact did it have on the team or organization?'
    ]
  },
  {
    category: 'Communication',
    title: 'Presenting a Proposal',
    prompt: 'Tell me about a time when you had to present a technical proposal to stakeholders or leadership.',
    details: [
      'What were you proposing?',
      'Who was your audience?',
      'How did you structure your presentation?',
      'What was the outcome of your presentation?'
    ]
  },
  {
    category: 'Communication',
    title: 'Gathering Requirements',
    prompt: 'Describe a situation where you had to gather and clarify ambiguous requirements.',
    details: [
      'What was the project and what made the requirements ambiguous?',
      'How did you approach stakeholders to clarify needs?',
      'What techniques did you use to extract clear requirements?',
      'How did this impact the project success?'
    ]
  },
  {
    category: 'Communication',
    title: 'Transparent Communication',
    prompt: 'Tell me about a time when you had to deliver bad news or difficult information to your team or manager.',
    details: [
      'What was the bad news or difficult information?',
      'How did you prepare to deliver it?',
      'How did you communicate it clearly and professionally?',
      'How was it received and what was the outcome?'
    ]
  },

  // Category 9: Failure & Learning (5 questions)
  {
    category: 'Failure & Learning',
    title: 'Production Incident',
    prompt: 'Tell me about a time when you caused or contributed to a production incident or outage.',
    details: [
      'What happened and what was your role in causing it?',
      'How did you respond when you realized the impact?',
      'What did you do to fix it?',
      'What did you learn and what changes did you implement to prevent recurrence?'
    ]
  },
  {
    category: 'Failure & Learning',
    title: 'Project Failure',
    prompt: 'Describe a project or initiative that failed or didn\'t meet its goals.',
    details: [
      'What was the project and what were the goals?',
      'What went wrong and why did it fail?',
      'What was your role and what could you have done differently?',
      'What lessons did you take from this experience?'
    ]
  },
  {
    category: 'Failure & Learning',
    title: 'Wrong Technical Decision',
    prompt: 'Tell me about a time when you made the wrong technical decision and had to reverse course.',
    details: [
      'What decision did you make?',
      'How did you realize it was the wrong choice?',
      'What did you do to correct course?',
      'What did you learn about decision-making from this experience?'
    ]
  },
  {
    category: 'Failure & Learning',
    title: 'Missed Deadline',
    prompt: 'Describe a time when you missed an important deadline.',
    details: [
      'What was the deadline and why did you miss it?',
      'How did you communicate this to stakeholders?',
      'What were the consequences?',
      'What did you learn about planning and commitment?'
    ]
  },
  {
    category: 'Failure & Learning',
    title: 'Learning from Mistakes',
    prompt: 'Tell me about a significant mistake you made and how you grew from it.',
    details: [
      'What mistake did you make?',
      'What was the impact?',
      'How did you take accountability?',
      'What specific changes did you make to improve?'
    ]
  },

  // Category 10: Initiative & Impact (6 questions)
  {
    category: 'Initiative & Impact',
    title: 'Process Improvement',
    prompt: 'Tell me about a time when you identified and improved an inefficient process.',
    details: [
      'What process was inefficient and how did you notice?',
      'What analysis did you do to understand the problem?',
      'What improvements did you implement?',
      'What was the measurable impact?'
    ]
  },
  {
    category: 'Initiative & Impact',
    title: 'Side Project Impact',
    prompt: 'Describe a side project or tool you built that benefited your team or company.',
    details: [
      'What problem were you trying to solve?',
      'What did you build?',
      'How did you gain adoption?',
      'What impact did it have?'
    ]
  },
  {
    category: 'Initiative & Impact',
    title: 'Customer Impact',
    prompt: 'Tell me about a feature or improvement you built that had significant positive impact on users.',
    details: [
      'What customer problem were you addressing?',
      'How did you validate the need?',
      'What did you build?',
      'What was the measured impact on user satisfaction or metrics?'
    ]
  },
  {
    category: 'Initiative & Impact',
    title: 'Cost Optimization',
    prompt: 'Describe a time when you reduced costs or improved efficiency for your system or infrastructure.',
    details: [
      'What cost or efficiency issue existed?',
      'How did you identify the opportunity?',
      'What changes did you implement?',
      'What savings or efficiency gains resulted?'
    ]
  },
  {
    category: 'Initiative & Impact',
    title: 'Going Above and Beyond',
    prompt: 'Tell me about a time when you went significantly above and beyond your job requirements.',
    details: [
      'What situation prompted you to go above and beyond?',
      'What extra effort did you invest?',
      'What obstacles did you overcome?',
      'What was the impact of your extra effort?'
    ]
  },
  {
    category: 'Initiative & Impact',
    title: 'Measurable Business Impact',
    prompt: 'Describe your most impactful technical contribution and how you measured its success.',
    details: [
      'What did you build or improve?',
      'What business problem did it solve?',
      'What metrics did you use to measure impact?',
      'What were the results?'
    ]
  }
];

async function seedBehavioralInterview() {
  console.log('Starting Behavioral Interview Mastery journey creation...\n');

  try {
    // Step 1: Check if journey already exists
    const existingJourney = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM journeys WHERE title = ?',
        ['Behavioral Interview Mastery'],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingJourney) {
      console.log('✓ Behavioral Interview journey already exists');
      console.log(`  Journey ID: ${existingJourney.id}`);
      console.log(`  Title: ${existingJourney.title}\n`);
      return existingJourney.id;
    }

    // Step 2: Create journey
    console.log('Creating Behavioral Interview Mastery journey...');
    const journeyId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO journeys (
          title,
          description,
          duration_weeks,
          cadence,
          is_active,
          is_default
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Behavioral Interview Mastery',
          'Master behavioral interviews for software engineering roles. Prepare compelling STAR method stories across all key competency areas including leadership, problem-solving, teamwork, and more.',
          14,
          'biweekly',
          1,
          0
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    console.log(`✓ Created journey (ID: ${journeyId})\n`);

    // Step 3: Create or get question categories
    console.log('Setting up question categories...');
    const categories = [...new Set(behavioralQuestions.map(q => q.category))];
    const categoryMap = {};

    for (const categoryName of categories) {
      const existing = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM question_categories WHERE name = ?',
          [categoryName],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existing) {
        categoryMap[categoryName] = existing.id;
      } else {
        const categoryId = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO question_categories (name, description, display_order) VALUES (?, ?, ?)',
            [categoryName, `Behavioral interview questions for ${categoryName}`, Object.keys(categoryMap).length + 1],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });
        categoryMap[categoryName] = categoryId;
      }
    }

    console.log(`✓ Set up ${categories.length} categories\n`);

    // Step 4: Create questions and tasks
    console.log('Creating questions and journey tasks...');
    let questionsCreated = 0;
    let tasksCreated = 0;

    for (let i = 0; i < behavioralQuestions.length; i++) {
      const q = behavioralQuestions[i];
      const categoryId = categoryMap[q.category];

      // Create question
      const questionId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO questions (
            category_id,
            week_number,
            title,
            main_prompt
          ) VALUES (?, ?, ?, ?)`,
          [
            categoryId,
            i + 1,
            q.title,
            q.prompt
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      questionsCreated++;

      // Create question details (guiding questions)
      for (let j = 0; j < q.details.length; j++) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO question_details (question_id, detail_text, display_order) VALUES (?, ?, ?)',
            [questionId, q.details[j], j + 1],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Create journey task
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO journey_tasks (
            journey_id,
            task_order,
            title,
            description,
            task_type,
            question_id,
            estimated_time_minutes,
            page_number,
            chapter_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            journeyId,
            i + 1,
            q.title,
            q.prompt,
            'question',
            questionId,
            45, // 45 minutes per question
            i + 1,
            q.category
          ],
          (err) => {
            if (err) reject(err);
            else {
              tasksCreated++;
              resolve();
            }
          }
        );
      });
    }

    console.log(`✓ Created ${questionsCreated} questions`);
    console.log(`✓ Created ${tasksCreated} journey tasks\n`);

    console.log('='.repeat(60));
    console.log('✓ BEHAVIORAL INTERVIEW JOURNEY CREATED!');
    console.log('='.repeat(60));
    console.log(`Journey ID: ${journeyId}`);
    console.log(`Total Questions: ${questionsCreated}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Duration: 14 weeks (biweekly)`);
    console.log('='.repeat(60));

    return journeyId;

  } catch (error) {
    console.error('Error creating journey:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBehavioralInterview()
    .then(() => {
      console.log('\nJourney creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nJourney creation failed:', error);
      process.exit(1);
    });
}

export default seedBehavioralInterview;
