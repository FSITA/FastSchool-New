export interface DisabilityType {
  id: string;
  label: string;
  description: string;
  promptInstructions: string;
}

export const DISABILITY_TYPES: DisabilityType[] = [
  {
    id: 'visual_impairments',
    label: 'Visual Impairments',
    description: 'Blind, low vision',
    promptInstructions: 'Use tactile materials, audio-based learning, alt text, high contrast colors, large fonts, screen reader compatibility, braille materials, audio descriptions, and ensure all visual content has verbal alternatives'
  },
  {
    id: 'hearing_impairments', 
    label: 'Hearing Impairments',
    description: 'Deaf, hard of hearing',
    promptInstructions: 'Use visual cues, written instructions, sign language support, visual demonstrations, closed captions, visual timers, written feedback, and ensure all audio content has visual alternatives'
  },
  {
    id: 'cognitive_learning',
    label: 'Cognitive / Learning Disabilities',
    description: 'Dyslexia, ADHD, autism',
    promptInstructions: 'Simplify instructions, use multi-sensory teaching, chunk content, use clear fonts, provide extra time, use visual aids, break tasks into smaller steps, provide frequent breaks, and use consistent routines'
  },
  {
    id: 'physical_disabilities',
    label: 'Physical Disabilities', 
    description: 'Mobility issues',
    promptInstructions: 'Ensure accessible materials, provide alternative input methods, consider motor skill limitations, use assistive technology, provide adaptive equipment, ensure wheelchair accessibility, and offer alternative ways to participate in activities'
  },
  {
    id: 'neurodiverse',
    label: 'Neurodiverse',
    description: 'ASD, ADHD',
    promptInstructions: 'Use structured routines, provide clear expectations, minimize sensory overload, use visual schedules, allow movement breaks, provide quiet spaces, use predictable transitions, and offer choice in activities'
  }
];

export function getDisabilityTypeById(id: string): DisabilityType | undefined {
  return DISABILITY_TYPES.find(type => type.id === id);
}

// Translations for disability types by language
export interface DisabilityTypeTranslation {
  label: string;
  description: string;
}

export function getDisabilityTypeTranslation(id: string, language: string = 'english'): DisabilityTypeTranslation {
  const disabilityType = getDisabilityTypeById(id);
  if (!disabilityType) {
    return { label: '', description: '' };
  }

  const translations: Record<string, Record<string, DisabilityTypeTranslation>> = {
    italian: {
      visual_impairments: {
        label: 'Deficit Visivi',
        description: 'Ciechi, ipovedenti'
      },
      hearing_impairments: {
        label: 'Deficit Uditivi',
        description: 'Sordi, ipoudenti'
      },
      cognitive_learning: {
        label: 'Disabilità Cognitive / Dell\'Apprendimento',
        description: 'Dislessia, ADHD, autismo'
      },
      physical_disabilities: {
        label: 'Disabilità Fisiche',
        description: 'Problemi di mobilità'
      },
      neurodiverse: {
        label: 'Neurodiversità',
        description: 'ASD, ADHD'
      }
    },
    english: {
      visual_impairments: {
        label: disabilityType.label,
        description: disabilityType.description
      },
      hearing_impairments: {
        label: disabilityType.label,
        description: disabilityType.description
      },
      cognitive_learning: {
        label: disabilityType.label,
        description: disabilityType.description
      },
      physical_disabilities: {
        label: disabilityType.label,
        description: disabilityType.description
      },
      neurodiverse: {
        label: disabilityType.label,
        description: disabilityType.description
      }
    }
  };

  const langTranslations = translations[language] || translations.english;
  return langTranslations[id] || { label: disabilityType.label, description: disabilityType.description };
}

export function getAllDisabilityTypesTranslated(language: string = 'english'): Array<DisabilityType & { translatedLabel: string; translatedDescription: string }> {
  return DISABILITY_TYPES.map(type => {
    const translation = getDisabilityTypeTranslation(type.id, language);
    return {
      ...type,
      translatedLabel: translation.label,
      translatedDescription: translation.description
    };
  });
}