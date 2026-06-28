import { pool, query, queryOne, initSchema } from './database.js';

async function seedTracksAndLevels() {
  const germanTrack = await queryOne(
    `INSERT INTO tracks (language, name, exam_systems) VALUES ($1, $2, $3) RETURNING id`,
    ['German', 'Deutsch', JSON.stringify(['Goethe-Institut', 'telc', 'DaF'])]
  );
  const frenchTrack = await queryOne(
    `INSERT INTO tracks (language, name, exam_systems) VALUES ($1, $2, $3) RETURNING id`,
    ['French', 'Français', JSON.stringify(['DELF'])]
  );

  const germanLevels = [];
  const germanCodes = ['A1', 'A2', 'B1', 'B2', 'C1'];
  for (let i = 0; i < germanCodes.length; i++) {
    const lvl = await queryOne(
      `INSERT INTO levels (track_id, code, name, sort_order) VALUES ($1, $2, $3, $4) RETURNING id, code`,
      [germanTrack.id, germanCodes[i], germanCodes[i], i]
    );
    germanLevels.push(lvl);
  }

  const frenchLevels = [];
  const frenchCodes = ['A1', 'A2', 'B1', 'B2'];
  for (let i = 0; i < frenchCodes.length; i++) {
    const lvl = await queryOne(
      `INSERT INTO levels (track_id, code, name, sort_order) VALUES ($1, $2, $3, $4) RETURNING id, code`,
      [frenchTrack.id, frenchCodes[i], frenchCodes[i], i]
    );
    frenchLevels.push(lvl);
  }

  return { germanTrack, frenchTrack, germanLevels, frenchLevels };
}

async function addLesson(levelId, title, isFree, sortOrder, exercises) {
  const lesson = await queryOne(
    `INSERT INTO lessons (level_id, title, is_free, sort_order) VALUES ($1, $2, $3, $4) RETURNING id`,
    [levelId, title, isFree, sortOrder]
  );

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    await query(
      `INSERT INTO exercises (lesson_id, type, prompt, options_json, answer, sort_order) VALUES ($1, $2, $3, $4, $5, $6)`,
      [lesson.id, ex.type, ex.prompt, JSON.stringify(ex.options || null), ex.answer, i]
    );
  }
  return lesson.id;
}

async function seedGermanLessons(levels) {
  const A1 = levels.find(l => l.code === 'A1').id;
  const A2 = levels.find(l => l.code === 'A2').id;
  const B1 = levels.find(l => l.code === 'B1').id;

  await addLesson(A1, 'Hallo & Auf Wiedersehen', true, 0, [
    { type: 'translate', prompt: 'How do you say "Hello" in German?', options: ['Hallo', 'Tschüss', 'Danke', 'Bitte'], answer: 'Hallo' },
    { type: 'translate', prompt: 'What does "Auf Wiedersehen" mean?', options: ['Good morning', 'Goodbye', 'Thank you', 'Please'], answer: 'Goodbye' },
    { type: 'fill', prompt: 'Guten ___ (Good morning)', options: ['Morgen', 'Abend', 'Nacht', 'Tag'], answer: 'Morgen' },
    { type: 'translate', prompt: 'What does "Danke schön" mean?', options: ['Thank you very much', 'You are welcome', 'Excuse me', 'Sorry'], answer: 'Thank you very much' },
  ]);

  await addLesson(A1, 'Zahlen 1–20', true, 1, [
    { type: 'translate', prompt: 'What is "sieben"?', options: ['6', '7', '8', '9'], answer: '7' },
    { type: 'translate', prompt: 'What is "fünfzehn"?', options: ['14', '15', '16', '50'], answer: '15' },
    { type: 'translate', prompt: 'How do you say "twelve"?', options: ['zwölf', 'zwei', 'zwanzig', 'elf'], answer: 'zwölf' },
  ]);

  await addLesson(A1, 'Im Café', true, 2, [
    { type: 'translate', prompt: 'What does "Ich möchte einen Kaffee" mean?', options: ['I would like a coffee', 'I have a coffee', 'I want tea', 'Where is the coffee?'], answer: 'I would like a coffee' },
    { type: 'fill', prompt: 'Die Rechnung, ___! (the check, please!)', options: ['bitte', 'danke', 'hallo', 'tschüss'], answer: 'bitte' },
  ]);

  await addLesson(A1, 'Meine Familie', false, 3, [
    { type: 'translate', prompt: 'What does "meine Schwester" mean?', options: ['my sister', 'my brother', 'my mother', 'my father'], answer: 'my sister' },
    { type: 'translate', prompt: 'What is "die Eltern"?', options: ['the parents', 'the children', 'the grandparents', 'the cousins'], answer: 'the parents' },
  ]);

  await addLesson(A1, 'Die Uhrzeit', false, 4, [
    { type: 'translate', prompt: 'What does "Wie viel Uhr ist es?" mean?', options: ['What time is it?', 'What day is it?', 'Where are you?', 'How are you?'], answer: 'What time is it?' },
  ]);

  await addLesson(A2, 'Wegbeschreibung', true, 0, [
    { type: 'translate', prompt: 'What does "Gehen Sie geradeaus" mean?', options: ['Go straight ahead', 'Turn left', 'Turn right', 'Stop here'], answer: 'Go straight ahead' },
  ]);

  await addLesson(A2, 'Einkaufen', false, 1, [
    { type: 'translate', prompt: 'What does "Was kostet das?" mean?', options: ['How much does that cost?', 'Where is that?', 'What is that?', 'Do you have that?'], answer: 'How much does that cost?' },
  ]);

  await addLesson(B1, 'Meine Meinung sagen', true, 0, [
    { type: 'translate', prompt: 'What does "Meiner Meinung nach" mean?', options: ['In my opinion', 'For example', 'On the other hand', 'In conclusion'], answer: 'In my opinion' },
  ]);
}

async function seedFrenchLessons(levels) {
  const A1 = levels.find(l => l.code === 'A1').id;
  await addLesson(A1, 'Bonjour & Au revoir', true, 0, [
    { type: 'translate', prompt: 'What does "Bonjour" mean?', options: ['Hello', 'Goodbye', 'Thanks', 'Please'], answer: 'Hello' },
    { type: 'translate', prompt: 'What does "Merci beaucoup" mean?', options: ['Thank you very much', 'You are welcome', 'Excuse me', 'Good night'], answer: 'Thank you very much' },
  ]);
}

async function seedMockExams() {
  const exams = [
    {
      exam_system: 'Goethe-Institut', level_code: 'A1', title: 'Goethe-Zertifikat A1 — Modelltest', is_free: true,
      sections: [
        { name: 'Hören', questions: [
          { prompt: 'You hear: "Mein Name ist Anna." What is being introduced?', options: ['A name', 'A place', 'A time', 'A food'], answer: 'A name' },
        ]},
        { name: 'Lesen', questions: [
          { prompt: 'Read: "Der Supermarkt öffnet um 8 Uhr." When does the supermarket open?', options: ['8 AM', '8 PM', '6 AM', 'Never'], answer: '8 AM' },
          { prompt: 'What does "geschlossen" mean on a shop sign?', options: ['Closed', 'Open', 'Sale', 'New'], answer: 'Closed' },
        ]},
        { name: 'Schreiben', questions: [
          { prompt: 'Choose the grammatically correct sentence:', options: ['Ich bin Lehrer.', 'Ich bist Lehrer.', 'Ich sind Lehrer.', 'Ich ist Lehrer.'], answer: 'Ich bin Lehrer.' },
        ]},
      ],
    },
    {
      exam_system: 'telc', level_code: 'B1', title: 'telc Deutsch B1 — Modelltest', is_free: false,
      sections: [
        { name: 'Leseverstehen', questions: [
          { prompt: '"Trotz des Regens" most closely means:', options: ['Despite the rain', 'Because of the rain', 'Without rain', 'During the rain'], answer: 'Despite the rain' },
        ]},
        { name: 'Sprachbausteine', questions: [
          { prompt: 'Complete: "Ich freue mich ___ das Wochenende."', options: ['auf', 'an', 'in', 'zu'], answer: 'auf' },
        ]},
      ],
    },
    {
      exam_system: 'DaF', level_code: 'B2', title: 'TestDaF-Style Modelltest', is_free: false,
      sections: [
        { name: 'Leseverstehen', questions: [
          { prompt: 'Academic text marker: "Im Gegensatz dazu" introduces:', options: ['A contrast', 'An example', 'A summary', 'A cause'], answer: 'A contrast' },
        ]},
      ],
    },
    {
      exam_system: 'DELF', level_code: 'A2', title: "DELF A2 — Modèle d'examen", is_free: true,
      sections: [
        { name: 'Compréhension écrite', questions: [
          { prompt: '"Le magasin est fermé le dimanche" means the shop is:', options: ['Closed on Sunday', 'Open on Sunday', 'New', 'Far away'], answer: 'Closed on Sunday' },
        ]},
      ],
    },
  ];

  for (const exam of exams) {
    await query(
      `INSERT INTO mock_exams (exam_system, level_code, title, sections_json, is_free) VALUES ($1, $2, $3, $4, $5)`,
      [exam.exam_system, exam.level_code, exam.title, JSON.stringify(exam.sections), exam.is_free]
    );
  }
}

async function run() {
  await initSchema();

  const existing = await queryOne('SELECT COUNT(*) as c FROM tracks');
  if (Number(existing.c) > 0) {
    console.log('Database already seeded. Skipping. (Truncate the tables in Supabase/Neon to reseed.)');
    await pool.end();
    return;
  }

  const { germanLevels, frenchLevels } = await seedTracksAndLevels();
  await seedGermanLessons(germanLevels);
  await seedFrenchLessons(frenchLevels);
  await seedMockExams();
  console.log('Seed complete: tracks, levels, lessons, exercises, mock exams created.');
  await pool.end();
}

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await pool.end();
  process.exit(1);
});
