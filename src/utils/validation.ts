export function isNonEmpty(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`;
  return null;
}

export function hasMinAnswers(answers: string[], min = 1): string | null {
  const filled = answers.filter((a) => a.trim().length > 0);
  if (filled.length < min) return `At least ${min} answer is required`;
  return null;
}

export interface ValidationErrors {
  [key: string]: string | null;
}

export function validateQAItem(question: string, answers: string[]): ValidationErrors {
  return {
    question: isNonEmpty(question, 'Question'),
    answers: hasMinAnswers(answers, 1),
  };
}

export function validateVocabItem(image: string, word: string, plural: string): ValidationErrors {
  return {
    image: isNonEmpty(image, 'Image path'),
    word: isNonEmpty(word, 'Word'),
    plural: isNonEmpty(plural, 'Plural'),
  };
}

export function validateTranslationItem(text: string, translation: string): ValidationErrors {
  return {
    text: isNonEmpty(text, 'Text'),
    translation: isNonEmpty(translation, 'Translation'),
  };
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some((e) => e !== null);
}
