export interface QuizGeneratorTranslations {
  quiz: string;
  question: string;
  questions: string;
  quizzes: string;
  numberOfQuizzes: string;
  generateQuiz: string;
  generating: string;
  downloadPdf: string;
  downloading: string;
  answerKey: string;
  correctAnswer: string;
  totalQuestions: string;
  gradeLevel: string;
  date: string;
  topic: string;
  of: string;
}

export const QUIZ_GENERATOR_TRANSLATIONS: Record<string, QuizGeneratorTranslations> = {
  italian: {
    quiz: "Quiz",
    question: "Domanda",
    questions: "domande",
    quizzes: "quiz",
    numberOfQuizzes: "Numero di Quiz",
    generateQuiz: "Genera Quiz",
    generating: "Generazione in corso...",
    downloadPdf: "Scarica PDF",
    downloading: "Download in corso...",
    answerKey: "Chiave di Risposta",
    correctAnswer: "Risposta Corretta",
    totalQuestions: "Totale Domande",
    gradeLevel: "Livello Scolastico",
    date: "Data",
    topic: "Argomento",
    of: "di"
  },
  english: {
    quiz: "Quiz",
    question: "Question",
    questions: "questions",
    quizzes: "quizzes",
    numberOfQuizzes: "Number of Quizzes",
    generateQuiz: "Generate Quiz",
    generating: "Generating...",
    downloadPdf: "Download PDF",
    downloading: "Downloading...",
    answerKey: "Answer Key",
    correctAnswer: "Correct Answer",
    totalQuestions: "Total Questions",
    gradeLevel: "Grade Level",
    date: "Date",
    topic: "Topic",
    of: "of"
  },
  spanish: {
    quiz: "Quiz",
    question: "Pregunta",
    questions: "preguntas",
    quizzes: "cuestionarios",
    numberOfQuizzes: "Número de Cuestionarios",
    generateQuiz: "Generar Cuestionario",
    generating: "Generando...",
    downloadPdf: "Descargar PDF",
    downloading: "Descargando...",
    answerKey: "Clave de Respuestas",
    correctAnswer: "Respuesta Correcta",
    totalQuestions: "Total de Preguntas",
    gradeLevel: "Nivel de Grado",
    date: "Fecha",
    topic: "Tema",
    of: "de"
  },
  french: {
    quiz: "Quiz",
    question: "Question",
    questions: "questions",
    quizzes: "quiz",
    numberOfQuizzes: "Nombre de Quiz",
    generateQuiz: "Générer Quiz",
    generating: "Génération...",
    downloadPdf: "Télécharger PDF",
    downloading: "Téléchargement...",
    answerKey: "Clé de Réponses",
    correctAnswer: "Bonne Réponse",
    totalQuestions: "Total des Questions",
    gradeLevel: "Niveau Scolaire",
    date: "Date",
    topic: "Sujet",
    of: "de"
  },
  german: {
    quiz: "Quiz",
    question: "Frage",
    questions: "Fragen",
    quizzes: "Quizze",
    numberOfQuizzes: "Anzahl der Quizze",
    generateQuiz: "Quiz Generieren",
    generating: "Generierung...",
    downloadPdf: "PDF Herunterladen",
    downloading: "Herunterladen...",
    answerKey: "Antwortschlüssel",
    correctAnswer: "Richtige Antwort",
    totalQuestions: "Gesamtfragen",
    gradeLevel: "Klassenstufe",
    date: "Datum",
    topic: "Thema",
    of: "von"
  },
  portuguese: {
    quiz: "Quiz",
    question: "Pergunta",
    questions: "perguntas",
    quizzes: "questionários",
    numberOfQuizzes: "Número de Questionários",
    generateQuiz: "Gerar Questionário",
    generating: "Gerando...",
    downloadPdf: "Baixar PDF",
    downloading: "Baixando...",
    answerKey: "Chave de Respostas",
    correctAnswer: "Resposta Correta",
    totalQuestions: "Total de Perguntas",
    gradeLevel: "Nível Escolar",
    date: "Data",
    topic: "Tópico",
    of: "de"
  },
  dutch: {
    quiz: "Quiz",
    question: "Vraag",
    questions: "vragen",
    quizzes: "quizzen",
    numberOfQuizzes: "Aantal Quizzen",
    generateQuiz: "Quiz Genereren",
    generating: "Genereren...",
    downloadPdf: "PDF Downloaden",
    downloading: "Downloaden...",
    answerKey: "Antwoordsleutel",
    correctAnswer: "Juiste Antwoord",
    totalQuestions: "Totaal Vragen",
    gradeLevel: "Groepsniveau",
    date: "Datum",
    topic: "Onderwerp",
    of: "van"
  },
  russian: {
    quiz: "Викторина",
    question: "Вопрос",
    questions: "вопросов",
    quizzes: "викторин",
    numberOfQuizzes: "Количество Викторин",
    generateQuiz: "Создать Викторину",
    generating: "Создание...",
    downloadPdf: "Скачать PDF",
    downloading: "Загрузка...",
    answerKey: "Ключ Ответов",
    correctAnswer: "Правильный Ответ",
    totalQuestions: "Всего Вопросов",
    gradeLevel: "Уровень Класса",
    date: "Дата",
    topic: "Тема",
    of: "из"
  },
  chinese: {
    quiz: "测验",
    question: "问题",
    questions: "问题",
    quizzes: "测验",
    numberOfQuizzes: "测验数量",
    generateQuiz: "生成测验",
    generating: "生成中...",
    downloadPdf: "下载PDF",
    downloading: "下载中...",
    answerKey: "答案",
    correctAnswer: "正确答案",
    totalQuestions: "总问题数",
    gradeLevel: "年级",
    date: "日期",
    topic: "主题",
    of: "共"
  }
};

export function getQuizGeneratorTranslations(language: string): QuizGeneratorTranslations {
  return QUIZ_GENERATOR_TRANSLATIONS[language] || QUIZ_GENERATOR_TRANSLATIONS.english;
}

