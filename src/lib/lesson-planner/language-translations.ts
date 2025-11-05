export interface LessonPlanTranslations {
  // Section Headers
  lessonOverview: string;
  materialsNeeded: string;
  learningObjectives: string;
  lessonTimeline: string;
  activitiesAndInstructions: string;
  assessmentMethods: string;
  differentiationStrategies: string;
  additionalNotes: string;
  
  // Timeline Table Headers
  duration: string;
  activity: string;
  instructions: string;
  teacherNotes: string;
  
  // Other Labels
  gradeLevel: string;
  date: string;
  topic: string;
  mainLearningObjectives: string;
  downloading: string;
  downloadPdf: string;
  generateAnother: string;
}

export const LESSON_PLAN_TRANSLATIONS: Record<string, LessonPlanTranslations> = {
  italian: {
    lessonOverview: "PANORAMICA DELLA LEZIONE",
    materialsNeeded: "MATERIALI NECESSARI",
    learningObjectives: "OBIETTIVI DI APPRENDIMENTO",
    lessonTimeline: "CRONOLOGIA DELLA LEZIONE",
    activitiesAndInstructions: "ATTIVITÀ E ISTRUZIONI",
    assessmentMethods: "METODI DI VALUTAZIONE",
    differentiationStrategies: "STRATEGIE DI DIFFERENZIAZIONE",
    additionalNotes: "NOTE AGGIUNTIVE",
    duration: "Durata",
    activity: "Attività",
    instructions: "Istruzioni",
    teacherNotes: "Note dell'Insegnante",
    gradeLevel: "Livello Scolastico",
    date: "Data",
    topic: "Argomento",
    mainLearningObjectives: "Obiettivi di Apprendimento Principali",
    downloading: "Download in corso...",
    downloadPdf: "Scarica PDF",
    generateAnother: "Genera un Altro Piano di Lezione"
  },
  english: {
    lessonOverview: "LESSON OVERVIEW",
    materialsNeeded: "MATERIALS NEEDED",
    learningObjectives: "LEARNING OBJECTIVES",
    lessonTimeline: "LESSON TIMELINE",
    activitiesAndInstructions: "ACTIVITIES AND INSTRUCTIONS",
    assessmentMethods: "ASSESSMENT METHODS",
    differentiationStrategies: "DIFFERENTIATION STRATEGIES",
    additionalNotes: "ADDITIONAL NOTES",
    duration: "Duration",
    activity: "Activity",
    instructions: "Instructions",
    teacherNotes: "Teacher Notes",
    gradeLevel: "Grade Level",
    date: "Date",
    topic: "Topic",
    mainLearningObjectives: "Main Learning Objectives",
    downloading: "Downloading...",
    downloadPdf: "Download PDF",
    generateAnother: "Generate Another Lesson Plan"
  },
  spanish: {
    lessonOverview: "RESUMEN DE LA LECCIÓN",
    materialsNeeded: "MATERIALES NECESARIOS",
    learningObjectives: "OBJETIVOS DE APRENDIZAJE",
    lessonTimeline: "CRONOGRAMA DE LA LECCIÓN",
    activitiesAndInstructions: "ACTIVIDADES E INSTRUCCIONES",
    assessmentMethods: "MÉTODOS DE EVALUACIÓN",
    differentiationStrategies: "ESTRATEGIAS DE DIFERENCIACIÓN",
    additionalNotes: "NOTAS ADICIONALES",
    duration: "Duración",
    activity: "Actividad",
    instructions: "Instrucciones",
    teacherNotes: "Notas del Maestro",
    gradeLevel: "Nivel de Grado",
    date: "Fecha",
    topic: "Tema",
    mainLearningObjectives: "Objetivos de Aprendizaje Principales",
    downloading: "Descargando...",
    downloadPdf: "Descargar PDF",
    generateAnother: "Generar Otro Plan de Lección"
  },
  french: {
    lessonOverview: "APERÇU DE LA LEÇON",
    materialsNeeded: "MATÉRIELS NÉCESSAIRES",
    learningObjectives: "OBJECTIFS D'APPRENTISSAGE",
    lessonTimeline: "CHRONOLOGIE DE LA LEÇON",
    activitiesAndInstructions: "ACTIVITÉS ET INSTRUCTIONS",
    assessmentMethods: "MÉTHODES D'ÉVALUATION",
    differentiationStrategies: "STRATÉGIES DE DIFFÉRENCIATION",
    additionalNotes: "NOTES SUPPLÉMENTAIRES",
    duration: "Durée",
    activity: "Activité",
    instructions: "Instructions",
    teacherNotes: "Notes de l'Enseignant",
    gradeLevel: "Niveau Scolaire",
    date: "Date",
    topic: "Sujet",
    mainLearningObjectives: "Objectifs d'Apprentissage Principaux",
    downloading: "Téléchargement...",
    downloadPdf: "Télécharger PDF",
    generateAnother: "Générer un Autre Plan de Leçon"
  },
  german: {
    lessonOverview: "LEKTIONSÜBERSICHT",
    materialsNeeded: "BENÖTIGTE MATERIALIEN",
    learningObjectives: "LERNZIELE",
    lessonTimeline: "LEKTIONSZEITPLAN",
    activitiesAndInstructions: "AKTIVITÄTEN UND ANWEISUNGEN",
    assessmentMethods: "BEWERTUNGSMETHODEN",
    differentiationStrategies: "DIFFERENZIERUNGSSTRATEGIEN",
    additionalNotes: "ZUSÄTZLICHE NOTIZEN",
    duration: "Dauer",
    activity: "Aktivität",
    instructions: "Anweisungen",
    teacherNotes: "Lehrernotizen",
    gradeLevel: "Klassenstufe",
    date: "Datum",
    topic: "Thema",
    mainLearningObjectives: "Hauptlernziele",
    downloading: "Herunterladen...",
    downloadPdf: "PDF Herunterladen",
    generateAnother: "Einen Weitere Unterrichtsplan Erstellen"
  },
  portuguese: {
    lessonOverview: "VISÃO GERAL DA LIÇÃO",
    materialsNeeded: "MATERIAIS NECESSÁRIOS",
    learningObjectives: "OBJETIVOS DE APRENDIZAGEM",
    lessonTimeline: "CRONOGRAMA DA LIÇÃO",
    activitiesAndInstructions: "ATIVIDADES E INSTRUÇÕES",
    assessmentMethods: "MÉTODOS DE AVALIAÇÃO",
    differentiationStrategies: "ESTRATÉGIAS DE DIFERENCIAÇÃO",
    additionalNotes: "NOTAS ADICIONAIS",
    duration: "Duração",
    activity: "Atividade",
    instructions: "Instruções",
    teacherNotes: "Notas do Professor",
    gradeLevel: "Nível Escolar",
    date: "Data",
    topic: "Tópico",
    mainLearningObjectives: "Objetivos de Aprendizagem Principais",
    downloading: "Baixando...",
    downloadPdf: "Baixar PDF",
    generateAnother: "Gerar Outro Plano de Lição"
  },
  dutch: {
    lessonOverview: "LESOVERZICHT",
    materialsNeeded: "BENODIGDE MATERIALEN",
    learningObjectives: "LEERDOELEN",
    lessonTimeline: "LESPLANNING",
    activitiesAndInstructions: "ACTIVITEITEN EN INSTRUCTIES",
    assessmentMethods: "EVALUATIEMETHODEN",
    differentiationStrategies: "DIFFERENTIATIESTRATEGIEËN",
    additionalNotes: "AANVULLENDE NOTITIES",
    duration: "Duur",
    activity: "Activiteit",
    instructions: "Instructies",
    teacherNotes: "Leraar Notities",
    gradeLevel: "Groepsniveau",
    date: "Datum",
    topic: "Onderwerp",
    mainLearningObjectives: "Hoofdleerdoelen",
    downloading: "Downloaden...",
    downloadPdf: "PDF Downloaden",
    generateAnother: "Genereer Een Ander Lessenplan"
  },
  russian: {
    lessonOverview: "ОБЗОР УРОКА",
    materialsNeeded: "НЕОБХОДИМЫЕ МАТЕРИАЛЫ",
    learningObjectives: "ЦЕЛИ ОБУЧЕНИЯ",
    lessonTimeline: "ХРОНОЛОГИЯ УРОКА",
    activitiesAndInstructions: "АКТИВНОСТИ И ИНСТРУКЦИИ",
    assessmentMethods: "МЕТОДЫ ОЦЕНКИ",
    differentiationStrategies: "СТРАТЕГИИ ДИФФЕРЕНЦИАЦИИ",
    additionalNotes: "ДОПОЛНИТЕЛЬНЫЕ ЗАМЕТКИ",
    duration: "Продолжительность",
    activity: "Активность",
    instructions: "Инструкции",
    teacherNotes: "Заметки Учителя",
    gradeLevel: "Уровень Класса",
    date: "Дата",
    topic: "Тема",
    mainLearningObjectives: "Основные Цели Обучения",
    downloading: "Загрузка...",
    downloadPdf: "Скачать PDF",
    generateAnother: "Создать Другой План Урока"
  },
  chinese: {
    lessonOverview: "课程概述",
    materialsNeeded: "所需材料",
    learningObjectives: "学习目标",
    lessonTimeline: "课程时间表",
    activitiesAndInstructions: "活动与指导",
    assessmentMethods: "评估方法",
    differentiationStrategies: "差异化策略",
    additionalNotes: "附加说明",
    duration: "时长",
    activity: "活动",
    instructions: "指导",
    teacherNotes: "教师备注",
    gradeLevel: "年级",
    date: "日期",
    topic: "主题",
    mainLearningObjectives: "主要学习目标",
    downloading: "下载中...",
    downloadPdf: "下载PDF",
    generateAnother: "生成另一个课程计划"
  }
};

export function getLessonPlanTranslations(language: string): LessonPlanTranslations {
  return LESSON_PLAN_TRANSLATIONS[language] || LESSON_PLAN_TRANSLATIONS.english;
}

export function translateSectionTitle(title: string, language: string): string {
  const translations = getLessonPlanTranslations(language);
  
  // Map common section title patterns to translations
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('overview') || titleLower.includes('panoramica') || titleLower.includes('resumen') || titleLower.includes('aperçu') || titleLower.includes('übersicht') || titleLower.includes('visão') || titleLower.includes('overzicht') || titleLower.includes('обзор') || titleLower.includes('概述')) {
    return translations.lessonOverview;
  }
  if (titleLower.includes('materials') || titleLower.includes('materiali') || titleLower.includes('materiales') || titleLower.includes('matériels') || titleLower.includes('materialien') || titleLower.includes('materiais') || titleLower.includes('materialen') || titleLower.includes('материалы') || titleLower.includes('材料')) {
    return translations.materialsNeeded;
  }
  if (titleLower.includes('objectives') || titleLower.includes('obiettivi') || titleLower.includes('objetivos') || titleLower.includes('objectifs') || titleLower.includes('ziele') || titleLower.includes('objetivos') || titleLower.includes('doelen') || titleLower.includes('цели') || titleLower.includes('目标')) {
    return translations.learningObjectives;
  }
  if (titleLower.includes('timeline') || titleLower.includes('cronologia') || titleLower.includes('cronograma') || titleLower.includes('chronologie') || titleLower.includes('zeitplan') || titleLower.includes('cronograma') || titleLower.includes('planning') || titleLower.includes('хронология') || titleLower.includes('时间表')) {
    return translations.lessonTimeline;
  }
  if (titleLower.includes('activities') || titleLower.includes('attività') || titleLower.includes('actividades') || titleLower.includes('activités') || titleLower.includes('aktivitäten') || titleLower.includes('atividades') || titleLower.includes('activiteiten') || titleLower.includes('активности') || titleLower.includes('活动')) {
    return translations.activitiesAndInstructions;
  }
  if (titleLower.includes('assessment') || titleLower.includes('valutazione') || titleLower.includes('evaluación') || titleLower.includes('évaluation') || titleLower.includes('bewertung') || titleLower.includes('avaliação') || titleLower.includes('evaluatie') || titleLower.includes('оценка') || titleLower.includes('评估')) {
    return translations.assessmentMethods;
  }
  if (titleLower.includes('differentiation') || titleLower.includes('differenziazione') || titleLower.includes('diferenciación') || titleLower.includes('différenciation') || titleLower.includes('differenzierung') || titleLower.includes('diferenciação') || titleLower.includes('differentiatie') || titleLower.includes('дифференциация') || titleLower.includes('差异化')) {
    return translations.differentiationStrategies;
  }
  if (titleLower.includes('notes') || titleLower.includes('note') || titleLower.includes('notas') || titleLower.includes('notas') || titleLower.includes('notizen') || titleLower.includes('notas') || titleLower.includes('notities') || titleLower.includes('заметки') || titleLower.includes('说明')) {
    return translations.additionalNotes;
  }
  
  // If no match found, return original title
  return title;
}
