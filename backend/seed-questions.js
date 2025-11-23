import db from './database.js';

const questionsData = [
  {
    category: "Our Foundation",
    description: "Building the foundation of your relationship",
    display_order: 1,
    questions: [
      {
        week: 1,
        title: "Our Love Story",
        main_prompt: "How did we first know this relationship was something special?",
        details: [
          "What was the first moment you thought, \"Oh, this is different\"?",
          "What qualities in me pulled you in at the start?",
          "What did you feel in your body in those early days (excitement, calm, nervous)?",
          "Which early memory still makes you smile?",
          "How has your picture of \"us\" changed since then?"
        ]
      },
      {
        week: 2,
        title: "Core Values",
        main_prompt: "What are the three values that matter most to you in life and in marriage?",
        details: [
          "When did you first realize this value was important to you?",
          "How do you try to live this value day-to-day?",
          "What does it look like when this value is honored in our relationship?",
          "What does it look like when this value feels violated?",
          "Where might our values clash, and how can we handle that kindly?"
        ]
      },
      {
        week: 3,
        title: "Relationship Vision",
        main_prompt: "What kind of marriage do we want to build? Describe it in detail.",
        details: [
          "When you imagine us 10–20 years from now, what do you see?",
          "How do we handle stress and conflict in that future version?",
          "How do friends and family describe our relationship?",
          "What are we doing together that makes us proud?",
          "What scares you most about not getting to that vision?"
        ]
      },
      {
        week: 4,
        title: "Non-Negotiables",
        main_prompt: "What behaviors, principles, or boundaries are absolutely non-negotiable for you in a marriage?",
        details: [
          "What did you see growing up (or in past relationships) that you never want to repeat?",
          "What do you need in order to feel fundamentally safe with me?",
          "Which lines, if crossed repeatedly, would make you question staying?",
          "How can I actively respect these boundaries?",
          "Where might our non-negotiables feel different, and how do we navigate that?"
        ]
      }
    ]
  },
  {
    category: "Communication & Conflict",
    description: "Mastering healthy communication and conflict resolution",
    display_order: 2,
    questions: [
      {
        week: 5,
        title: "Communication Styles",
        main_prompt: "How do you prefer to communicate during calm moments? How about during stress?",
        details: [
          "Do you think out loud, or do you need time to process before talking?",
          "In stress, do you move toward conversation or away from it?",
          "What has helped you feel \"heard\" in past conversations—with anyone?",
          "What shuts you down quickly in a conversation?",
          "What's one small change we could each make to communicate better?"
        ]
      },
      {
        week: 6,
        title: "Emotional Safety",
        main_prompt: "What makes you feel emotionally safe? What makes you feel unsafe?",
        details: [
          "When have you felt most emotionally safe with me so far?",
          "What words, tones, or behaviors make you feel small, judged, or afraid?",
          "How do you want me to respond when you're vulnerable or crying?",
          "What do you need from me when you share something shame-y or sensitive?",
          "In what moments do you worry I might reject or judge you?"
        ]
      },
      {
        week: 7,
        title: "Healthy Conflict",
        main_prompt: "What are three things we can each do to keep disagreements respectful and productive?",
        details: [
          "What does an unhealthy fight look like to you?",
          "What are your warning signs that we're going off the rails (tone, volume, words)?",
          "What kind of pause actually helps you reset?",
          "Which conflict behaviors should be off-limits (name-calling, bringing up old fights, etc.)?",
          "What's one script we can use when a fight is escalating?"
        ]
      },
      {
        week: 8,
        title: "Repairing After Conflict",
        main_prompt: "What does a meaningful apology look like for you? What do you need to feel repaired?",
        details: [
          "Do you need words, actions, physical comfort, or space to feel repaired?",
          "What makes an apology feel fake or incomplete?",
          "How can we talk about the pattern (not just the incident) after a fight?",
          "How long do you usually stay emotionally activated after conflict?",
          "What would \"we're good again\" look like for you?"
        ]
      }
    ]
  },
  {
    category: "Daily Life & Shared Routines",
    description: "Creating meaningful rituals and routines together",
    display_order: 3,
    questions: [
      {
        week: 9,
        title: "Everyday Happiness",
        main_prompt: "What small daily rituals make you feel connected? What rituals would you like to build together?",
        details: [
          "What tiny moments currently make you happiest in our day?",
          "Growing up, did your family have any rituals you loved or hated?",
          "What's one small daily or weekly ritual we could start this month?",
          "How do you want us to greet each other and say goodbye each day?",
          "Where are we currently on autopilot that we could make more intentional?"
        ]
      },
      {
        week: 10,
        title: "Home Life",
        main_prompt: "Describe your ideal weekday. Where can our rhythms sync? Where should they remain independent?",
        details: [
          "When during the day do you feel most social versus most inward?",
          "What's your ideal balance between productivity and rest?",
          "When in the day would you most love to connect with me?",
          "What habits of mine at home are secretly hard for you?",
          "What does recharging actually look like for you?"
        ]
      },
      {
        week: 11,
        title: "Responsibilities",
        main_prompt: "Which household tasks drain you? Which bring you satisfaction? How do we divide responsibilities fairly?",
        details: [
          "Growing up, what was your role with chores or family responsibilities?",
          "Which tasks stress you out the most or create resentment?",
          "Which tasks give you a sense of control, pride, or relaxation?",
          "Would you rather divide by type (you cook, I clean) or time (we alternate days)?",
          "Where could we outsource instead of arguing (cleaner, laundry, meal kits)?"
        ]
      },
      {
        week: 12,
        title: "Alone Time & Together Time",
        main_prompt: "How much alone time do you need? How much together time helps you feel connected?",
        details: [
          "After a long day, what do you truly crave: silence, touch, talk, TV, something else?",
          "When do you start to feel smothered?",
          "When do you start to feel neglected or distant?",
          "What are good signals we can use to ask for alone time without hurting the other?",
          "What recurring time each week can we protect just for us?"
        ]
      }
    ]
  },
  {
    category: "Money & Stability",
    description: "Building financial harmony and security",
    display_order: 4,
    questions: [
      {
        week: 13,
        title: "Money Beliefs",
        main_prompt: "What did you learn about money growing up? How does it shape your habits today?",
        details: [
          "Was money talked about openly, anxiously, or not at all in your family?",
          "What's one money memory that really stuck with you?",
          "Do you feel more comfortable saving, spending, or not thinking about it?",
          "When do you feel most financially stressed or triggered?",
          "What money patterns from your family do you not want to repeat?"
        ]
      },
      {
        week: 14,
        title: "Financial Security",
        main_prompt: "What does financial security look like for you? What are your biggest financial fears?",
        details: [
          "At what point would you feel, \"We're okay, we're safe\"?",
          "What are your top three financial priorities (home, travel, kids' education, freedom from debt, etc.)?",
          "What scenarios keep you up at night financially?",
          "How do you want us to handle unexpected windfalls versus unexpected expenses?",
          "What role do you want each of us to play in planning?"
        ]
      },
      {
        week: 15,
        title: "Budgeting as a Team",
        main_prompt: "How should we handle budgeting, saving, big purchases, and long-term planning?",
        details: [
          "Do you prefer detailed tracking or a looser buckets approach?",
          "What counts as a \"check-in with each other first\" purchase?",
          "How do we want to decide on vacations, large gifts, or big life upgrades?",
          "How often should we have a money date or check-in?",
          "What are we each willing to adjust in our lifestyle to hit shared goals?"
        ]
      },
      {
        week: 16,
        title: "Supporting Families",
        main_prompt: "What are our boundaries and expectations around supporting extended family financially or emotionally?",
        details: [
          "What does normal support for family look like in your culture?",
          "Are there unspoken obligations you feel toward your family?",
          "What level of financial support feels generous versus resentful?",
          "How can we make these decisions as a team, not as you versus me?",
          "What will we do if our families' expectations conflict with our wellbeing?"
        ]
      }
    ]
  },
  {
    category: "Family, Culture & Traditions",
    description: "Honoring heritage while creating new traditions",
    display_order: 5,
    questions: [
      {
        week: 17,
        title: "Childhood Reflections",
        main_prompt: "What parts of your childhood or family dynamics shaped your view of love and marriage?",
        details: [
          "What did love look like between adults in your home growing up?",
          "What did you learn about conflict from your parents or caregivers?",
          "What did you wish had been different in your family?",
          "Which patterns from your family do you notice in yourself now?",
          "What are you proud to bring from your family into our relationship?"
        ]
      },
      {
        week: 18,
        title: "Cultural Identity",
        main_prompt: "Which cultural traditions do you want to keep? What new ones do you want to build together?",
        details: [
          "What holidays or rituals feel most like home to you?",
          "Are there any traditions that feel heavy or obligatory instead of meaningful?",
          "How do you want future kids or nieces/nephews to experience our cultures?",
          "What would a blended holiday look like for us?",
          "Are there new traditions just for us as a couple that you'd love to create?"
        ]
      },
      {
        week: 19,
        title: "In-Law Boundaries",
        main_prompt: "What does healthy involvement from parents and family look like to you?",
        details: [
          "How often do you want to see or talk to each side of the family?",
          "What topics or decisions should remain just between us?",
          "How should we handle it if one of us feels our family is overstepping?",
          "What do you fear most around in-laws and boundaries?",
          "How can we show respect to family while still protecting our marriage?"
        ]
      },
      {
        week: 20,
        title: "Holidays & Rituals",
        main_prompt: "How should we celebrate major holidays, festivals, and milestones in a way that honors both of us?",
        details: [
          "Which holidays are non-negotiable for each of us?",
          "How do you feel about splitting holidays, alternating, or hosting?",
          "What would your ideal birthday or anniversary look like?",
          "How much travel or logistics is too much during holiday seasons?",
          "How do we handle saying no to extended family plans?"
        ]
      }
    ]
  },
  {
    category: "Intimacy & Romance",
    description: "Nurturing physical and emotional connection",
    display_order: 6,
    questions: [
      {
        week: 21,
        title: "Love Languages",
        main_prompt: "What makes you feel most loved? What makes you feel unseen?",
        details: [
          "Which love languages feel most true for you right now?",
          "What are three specific actions I do that land as \"I love you\"?",
          "What are three that land as \"you don't see me\"?",
          "How often do you notice love without saying it out loud?",
          "What's one experiment we could try for a week in how we show love?"
        ]
      },
      {
        week: 22,
        title: "Emotional Intimacy",
        main_prompt: "What deepens emotional closeness for you? What blocks it?",
        details: [
          "When have you felt the most emotionally close to me?",
          "What topics feel hardest for you to be honest about?",
          "What do you fear will happen if you show the messier parts of yourself?",
          "What helps you feel safe to open up: timing, setting, my tone, or questions?",
          "What's one question you wish I'd ask you more often?"
        ]
      },
      {
        week: 23,
        title: "Physical & Sexual Needs",
        main_prompt: "What do you need to feel desired and connected? What are your boundaries?",
        details: [
          "When do you feel most attractive and desired by me?",
          "How does stress, body image, or hormones affect your desire?",
          "What types of touch feel comforting versus sexual versus irritating?",
          "Are there any topics or experiences you're curious about but nervous to bring up?",
          "How can we check in about sex in a way that feels safe, not pressuring?"
        ]
      },
      {
        week: 24,
        title: "Sustaining Romance",
        main_prompt: "What rituals or habits help us keep romance alive long-term?",
        details: [
          "What has felt most romantic in our relationship so far?",
          "What small things I do make you feel cherished?",
          "What kills romance for you (phones in bed, certain jokes, etc.)?",
          "What is your ideal low-effort but high-impact date?",
          "How can we protect romance when life gets very busy or stressful?"
        ]
      }
    ]
  },
  {
    category: "Parenting & Future Planning",
    description: "Planning for your future family",
    display_order: 7,
    questions: [
      {
        week: 25,
        title: "Parenthood Vision",
        main_prompt: "Do we want children? What does the path to parenthood look like for us (timing, adoption, IVF, etc.)?",
        details: [
          "How strongly do you feel about becoming (or not becoming) a parent?",
          "What life experiences do you hope to have before kids, if any?",
          "How do you feel about non-traditional paths (adoption, IVF, fostering, etc.)?",
          "What are your biggest fears about having kids—or not having them?",
          "If we disagree on timing, what would compromise look like?"
        ]
      },
      {
        week: 26,
        title: "Parenting Philosophy",
        main_prompt: "What values do we want to instill in future children?",
        details: [
          "When you picture our future kids as adults, what kind of people are they?",
          "What did your parents do right that you'd like to repeat?",
          "What did they do that you want to consciously do differently?",
          "How strict or relaxed do you imagine being about rules?",
          "How do you want to handle screens, tech, chores, and responsibilities?"
        ]
      },
      {
        week: 27,
        title: "Division of Responsibilities",
        main_prompt: "How will we balance childcare with personal ambitions, careers, and rest?",
        details: [
          "In an ideal world, how much would each of us work versus care for kids?",
          "How do you feel about daycare, nannies, or help from family?",
          "What would burnout look like for you as a parent?",
          "How can we check in regularly about whether our setup still feels fair?",
          "What support systems would we want in place (friends, therapy, childcare, etc.)?"
        ]
      },
      {
        week: 28,
        title: "Protecting the Couple",
        main_prompt: "How do we maintain connection and intimacy after becoming parents?",
        details: [
          "What couples with kids do you admire—and why?",
          "What are your fears about us losing \"us\" in parenting?",
          "What routines can we pre-commit to (date night, check-ins, overnights away)?",
          "How can we stay curious about each other as people, not just co-parents?",
          "What boundaries with kids or family help protect our couple time?"
        ]
      }
    ]
  },
  {
    category: "Long-Term Partnership & Growth",
    description: "Growing together through life's seasons",
    display_order: 8,
    questions: [
      {
        week: 29,
        title: "Stress & Coping",
        main_prompt: "How do you handle overwhelming stress? How can your partner support you better?",
        details: [
          "Under stress, do you usually fight, flight, freeze, or fawn?",
          "What are your tells that you're overwhelmed?",
          "What kind of support feels good versus suffocating when you're stressed?",
          "What patterns do you notice in how we handle joint stress (money, family, work)?",
          "How can we build a shared plan for big stressful seasons?"
        ]
      },
      {
        week: 30,
        title: "Personal Growth",
        main_prompt: "What is one area you want to grow in this year? How can we support each other's growth?",
        details: [
          "In what area of life do you feel most hungry to grow right now?",
          "What old story about yourself are you trying to outgrow?",
          "How can I cheer you on without micromanaging you?",
          "What practical support would make growth easier (time, money, encouragement)?",
          "How can we celebrate each other's growth without comparison?"
        ]
      },
      {
        week: 31,
        title: "Health & Well-Being",
        main_prompt: "What routines help each of us stay physically and mentally healthy?",
        details: [
          "When do you feel most physically well in your body?",
          "What does good mental health look like for you?",
          "What early signs show you're starting to struggle?",
          "How can we gently nudge each other toward healthy habits without shaming?",
          "Are there any health topics we've been avoiding that we should name?"
        ]
      },
      {
        week: 32,
        title: "Evolving Together",
        main_prompt: "How do we ensure our marriage continues to evolve and not stagnate?",
        details: [
          "What does a stagnant relationship look like to you?",
          "What does a growing, alive relationship look like?",
          "How do we keep learning new things about each other over time?",
          "How often should we zoom out and re-evaluate our life direction together?",
          "What's one experiment we could try this year to shake things up in a good way?"
        ]
      }
    ]
  }
];

export function seedQuestions() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // First, clear existing data (optional - comment out if you want to keep data)
      db.run('DELETE FROM question_responses');
      db.run('DELETE FROM question_details');
      db.run('DELETE FROM questions');
      db.run('DELETE FROM question_categories');

      // Insert categories and questions
      questionsData.forEach((categoryData, catIndex) => {
        db.run(
          'INSERT INTO question_categories (name, description, display_order) VALUES (?, ?, ?)',
          [categoryData.category, categoryData.description, categoryData.display_order],
          function(err) {
            if (err) {
              console.error(`Error inserting category ${categoryData.category}:`, err);
              return;
            }

            const categoryId = this.lastID;
            console.log(`Inserted category: ${categoryData.category} (ID: ${categoryId})`);

            // Insert questions for this category
            categoryData.questions.forEach((questionData) => {
              db.run(
                'INSERT INTO questions (category_id, week_number, title, main_prompt) VALUES (?, ?, ?, ?)',
                [categoryId, questionData.week, questionData.title, questionData.main_prompt],
                function(err) {
                  if (err) {
                    console.error(`Error inserting question Week ${questionData.week}:`, err);
                    return;
                  }

                  const questionId = this.lastID;
                  console.log(`  Inserted Week ${questionData.week}: ${questionData.title} (ID: ${questionId})`);

                  // Insert question details (sub-questions)
                  questionData.details.forEach((detail, detailIndex) => {
                    db.run(
                      'INSERT INTO question_details (question_id, detail_text, display_order) VALUES (?, ?, ?)',
                      [questionId, detail, detailIndex + 1],
                      function(err) {
                        if (err) {
                          console.error(`Error inserting question detail:`, err);
                        }
                      }
                    );
                  });

                  // Resolve after last category's last question
                  if (catIndex === questionsData.length - 1 &&
                      questionData === categoryData.questions[categoryData.questions.length - 1]) {
                    setTimeout(() => {
                      console.log('All questions seeded successfully!');
                      resolve();
                    }, 500);
                  }
                }
              );
            });
          }
        );
      });
    });
  });
}

// Run the seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import('./database.js').then(({ initializeDatabase }) => {
    initializeDatabase()
      .then(() => seedQuestions())
      .then(() => {
        console.log('Database seeding complete!');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error seeding database:', err);
        process.exit(1);
      });
  });
}
