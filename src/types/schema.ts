export interface QAItem {
  id: string;
  question: string;
  answers: string[];
}

export interface VocabItem {
  id: string;
  image: string;
  word: string;
  plural: string;
}

export interface TranslationItem {
  id: string;
  text: string;
  translation: string;
}

export interface QAData {
  verbToBe: { singular: QAItem[]; plural: QAItem[] };
  questions: { what: QAItem[]; where: QAItem[]; which: QAItem[]; will: QAItem[] };
}

export interface VocabData {
  transport: VocabItem[];
  kitchen: VocabItem[];
  office: VocabItem[];
  misc: VocabItem[];
}

export interface TranslationData {
  easy: TranslationItem[];
  medium: TranslationItem[];
  hard: TranslationItem[];
}

export interface AppData {
  qa: QAData;
  imageVocabulary: VocabData;
  translations: TranslationData;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function createDefaultData(): AppData {
  return {
    qa: {
      verbToBe: { singular: [], plural: [] },
      questions: { what: [], where: [], which: [], will: [] },
    },
    imageVocabulary: { transport: [], kitchen: [], office: [], misc: [] },
    translations: { easy: [], medium: [], hard: [] },
  };
}

function stripIds<T extends { id: string }>(items: T[]): Omit<T, 'id'>[] {
  return items.map(({ id: _id, ...rest }) => rest as Omit<T, 'id'>);
}

export function exportClean(data: AppData) {
  return {
    qa: {
      verbToBe: {
        singular: stripIds(data.qa.verbToBe.singular),
        plural: stripIds(data.qa.verbToBe.plural),
      },
      questions: {
        what: stripIds(data.qa.questions.what),
        where: stripIds(data.qa.questions.where),
        which: stripIds(data.qa.questions.which),
        will: stripIds(data.qa.questions.will),
      },
    },
    imageVocabulary: {
      transport: stripIds(data.imageVocabulary.transport),
      kitchen: stripIds(data.imageVocabulary.kitchen),
      office: stripIds(data.imageVocabulary.office),
      misc: stripIds(data.imageVocabulary.misc),
    },
    translations: {
      easy: stripIds(data.translations.easy),
      medium: stripIds(data.translations.medium),
      hard: stripIds(data.translations.hard),
    },
  };
}

function injectIds<T>(items: unknown[]): (T & { id: string })[] {
  return items.map((item) => ({
    ...(item as T),
    id: ((item as Record<string, unknown>).id as string) ?? generateId(),
  }));
}

export function hydrateWithIds(raw: Record<string, any>): AppData {
  const r = raw || {};
  const qa = r.qa || {};
  const vToBe = qa.verbToBe || {};
  const qst = qa.questions || {};
  const vocab = r.imageVocabulary || {};
  const trans = r.translations || {};

  return {
    qa: {
      verbToBe: {
        singular: injectIds<QAItem>(vToBe.singular || []),
        plural: injectIds<QAItem>(vToBe.plural || []),
      },
      questions: {
        what: injectIds<QAItem>(qst.what || []),
        where: injectIds<QAItem>(qst.where || []),
        which: injectIds<QAItem>(qst.which || []),
        will: injectIds<QAItem>(qst.will || []),
      },
    },
    imageVocabulary: {
      transport: injectIds<VocabItem>(vocab.transport || []),
      kitchen: injectIds<VocabItem>(vocab.kitchen || []),
      office: injectIds<VocabItem>(vocab.office || []),
      misc: injectIds<VocabItem>(vocab.misc || []),
    },
    translations: {
      easy: injectIds<TranslationItem>(trans.easy || []),
      medium: injectIds<TranslationItem>(trans.medium || []),
      hard: injectIds<TranslationItem>(trans.hard || []),
    },
  };
}

export type SectionKey = 'qa' | 'imageVocabulary' | 'translations';

export interface CategoryMeta {
  key: string;
  label: string;
  parent?: string;
}

export interface SectionMeta {
  key: SectionKey;
  label: string;
  icon: string;
  categories: CategoryMeta[];
}

export const SECTIONS: SectionMeta[] = [
  {
    key: 'qa',
    label: 'Questions & Answers',
    icon: '💬',
    categories: [
      { key: 'singular', label: 'Verb To Be — Singular', parent: 'verbToBe' },
      { key: 'plural', label: 'Verb To Be — Plural', parent: 'verbToBe' },
      { key: 'what', label: 'Questions — What', parent: 'questions' },
      { key: 'where', label: 'Questions — Where', parent: 'questions' },
      { key: 'which', label: 'Questions — Which', parent: 'questions' },
      { key: 'will', label: 'Questions — Will', parent: 'questions' },
    ],
  },
  {
    key: 'imageVocabulary',
    label: 'Image Vocabulary',
    icon: '🖼️',
    categories: [
      { key: 'transport', label: 'Transport' },
      { key: 'kitchen', label: 'Kitchen' },
      { key: 'office', label: 'Office' },
      { key: 'misc', label: 'Miscellaneous' },
    ],
  },
  {
    key: 'translations',
    label: 'Translations',
    icon: '🌐',
    categories: [
      { key: 'easy', label: 'Easy' },
      { key: 'medium', label: 'Medium' },
      { key: 'hard', label: 'Hard' },
    ],
  },
];
