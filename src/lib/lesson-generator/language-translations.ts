export interface LessonGeneratorTranslations {
  // Page Navigation
  page: string;
  of: string;
  previousPage: string;
  nextPage: string;
  
  // Page Types
  overview: string;
  content: string;
  activities: string;
  assessment: string;
  summary: string;
  
  // UI Elements
  numberOfPages: string;
  generateLesson: string;
  generating: string;
  downloadPdf: string;
  downloading: string;
  
  // Page Count Suggestions
  recommendedPages: string;
  pages: string;
  
  // Grade Level
  gradeLevel: string;
  date: string;
  topic: string;
}

export const LESSON_GENERATOR_TRANSLATIONS: Record<string, LessonGeneratorTranslations> = {
  italian: {
    page: "Pagina",
    of: "di",
    previousPage: "Pagina Precedente",
    nextPage: "Pagina Successiva",
    overview: "Panoramica",
    content: "Contenuto",
    activities: "Attività",
    assessment: "Valutazione",
    summary: "Riassunto",
    numberOfPages: "Numero di Pagine",
    generateLesson: "Genera Lezione",
    generating: "Generazione in corso...",
    downloadPdf: "Scarica PDF",
    downloading: "Download in corso...",
    recommendedPages: "Pagine Consigliate",
    pages: "pagine",
    gradeLevel: "Livello Scolastico",
    date: "Data",
    topic: "Argomento"
  },
  english: {
    page: "Page",
    of: "of",
    previousPage: "Previous Page",
    nextPage: "Next Page",
    overview: "Overview",
    content: "Content",
    activities: "Activities",
    assessment: "Assessment",
    summary: "Summary",
    numberOfPages: "Number of Pages",
    generateLesson: "Generate Lesson",
    generating: "Generating...",
    downloadPdf: "Download PDF",
    downloading: "Downloading...",
    recommendedPages: "Recommended Pages",
    pages: "pages",
    gradeLevel: "Grade Level",
    date: "Date",
    topic: "Topic"
  },
  spanish: {
    page: "Página",
    of: "de",
    previousPage: "Página Anterior",
    nextPage: "Página Siguiente",
    overview: "Resumen",
    content: "Contenido",
    activities: "Actividades",
    assessment: "Evaluación",
    summary: "Resumen",
    numberOfPages: "Número de Páginas",
    generateLesson: "Generar Lección",
    generating: "Generando...",
    downloadPdf: "Descargar PDF",
    downloading: "Descargando...",
    recommendedPages: "Páginas Recomendadas",
    pages: "páginas",
    gradeLevel: "Nivel de Grado",
    date: "Fecha",
    topic: "Tema"
  },
  french: {
    page: "Page",
    of: "de",
    previousPage: "Page Précédente",
    nextPage: "Page Suivante",
    overview: "Aperçu",
    content: "Contenu",
    activities: "Activités",
    assessment: "Évaluation",
    summary: "Résumé",
    numberOfPages: "Nombre de Pages",
    generateLesson: "Générer Leçon",
    generating: "Génération...",
    downloadPdf: "Télécharger PDF",
    downloading: "Téléchargement...",
    recommendedPages: "Pages Recommandées",
    pages: "pages",
    gradeLevel: "Niveau Scolaire",
    date: "Date",
    topic: "Sujet"
  },
  german: {
    page: "Seite",
    of: "von",
    previousPage: "Vorherige Seite",
    nextPage: "Nächste Seite",
    overview: "Übersicht",
    content: "Inhalt",
    activities: "Aktivitäten",
    assessment: "Bewertung",
    summary: "Zusammenfassung",
    numberOfPages: "Anzahl der Seiten",
    generateLesson: "Lektion Generieren",
    generating: "Generierung...",
    downloadPdf: "PDF Herunterladen",
    downloading: "Herunterladen...",
    recommendedPages: "Empfohlene Seiten",
    pages: "Seiten",
    gradeLevel: "Klassenstufe",
    date: "Datum",
    topic: "Thema"
  },
  portuguese: {
    page: "Página",
    of: "de",
    previousPage: "Página Anterior",
    nextPage: "Próxima Página",
    overview: "Visão Geral",
    content: "Conteúdo",
    activities: "Atividades",
    assessment: "Avaliação",
    summary: "Resumo",
    numberOfPages: "Número de Páginas",
    generateLesson: "Gerar Lição",
    generating: "Gerando...",
    downloadPdf: "Baixar PDF",
    downloading: "Baixando...",
    recommendedPages: "Páginas Recomendadas",
    pages: "páginas",
    gradeLevel: "Nível Escolar",
    date: "Data",
    topic: "Tópico"
  },
  dutch: {
    page: "Pagina",
    of: "van",
    previousPage: "Vorige Pagina",
    nextPage: "Volgende Pagina",
    overview: "Overzicht",
    content: "Inhoud",
    activities: "Activiteiten",
    assessment: "Beoordeling",
    summary: "Samenvatting",
    numberOfPages: "Aantal Pagina's",
    generateLesson: "Les Genereren",
    generating: "Genereren...",
    downloadPdf: "PDF Downloaden",
    downloading: "Downloaden...",
    recommendedPages: "Aanbevolen Pagina's",
    pages: "pagina's",
    gradeLevel: "Groepsniveau",
    date: "Datum",
    topic: "Onderwerp"
  },
  russian: {
    page: "Страница",
    of: "из",
    previousPage: "Предыдущая Страница",
    nextPage: "Следующая Страница",
    overview: "Обзор",
    content: "Содержание",
    activities: "Активности",
    assessment: "Оценка",
    summary: "Резюме",
    numberOfPages: "Количество Страниц",
    generateLesson: "Создать Урок",
    generating: "Создание...",
    downloadPdf: "Скачать PDF",
    downloading: "Загрузка...",
    recommendedPages: "Рекомендуемые Страницы",
    pages: "страниц",
    gradeLevel: "Уровень Класса",
    date: "Дата",
    topic: "Тема"
  },
  chinese: {
    page: "页面",
    of: "共",
    previousPage: "上一页",
    nextPage: "下一页",
    overview: "概述",
    content: "内容",
    activities: "活动",
    assessment: "评估",
    summary: "总结",
    numberOfPages: "页面数量",
    generateLesson: "生成课程",
    generating: "生成中...",
    downloadPdf: "下载PDF",
    downloading: "下载中...",
    recommendedPages: "推荐页面",
    pages: "页",
    gradeLevel: "年级",
    date: "日期",
    topic: "主题"
  }
};

export function getLessonGeneratorTranslations(language: string): LessonGeneratorTranslations {
  return LESSON_GENERATOR_TRANSLATIONS[language] || LESSON_GENERATOR_TRANSLATIONS.english;
}

export function getPageCountSuggestions(gradeLevel: string) {
  const suggestions = {
    primary: { min: 1, max: 5, recommended: 3 },
    secondary: { min: 2, max: 8, recommended: 5 },
    high_school: { min: 3, max: 12, recommended: 7 },
    university: { min: 5, max: 15, recommended: 10 }
  };
  
  return suggestions[gradeLevel as keyof typeof suggestions] || suggestions.secondary;
}
