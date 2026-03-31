export interface QAItem {
  id: string;
  question: string;
  answers: string[];
  category?: string;
}

export interface VocabItem {
  id: string;
  image: string;
  word: string;
  plural: string;
  category?: string;
}

export interface TranslationItem {
  id: string;
  text: string;
  translation: string;
  category?: string;
}

export type QAData = Record<string, QAItem[]>;
export type VocabData = Record<string, VocabItem[]>;
export type TranslationData = Record<string, TranslationItem[]>;

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
    qa: { 'Verb To Be - Singular': [] },
    imageVocabulary: { 'Transport': [] },
    translations: { 'Easy': [] },
  };
}

function stripIds<T extends { id: string }>(items: T[]): Omit<T, 'id'>[] {
  return items.map(({ id: _id, ...rest }) => rest as Omit<T, 'id'>);
}

export function exportClean(data: AppData) {
  const cleanData: any = {
    qa: {},
    imageVocabulary: {},
    translations: {},
  };

  for (const [cat, items] of Object.entries(data.qa)) {
    cleanData.qa[cat] = stripIds(items);
  }
  for (const [cat, items] of Object.entries(data.imageVocabulary)) {
    cleanData.imageVocabulary[cat] = stripIds(items);
  }
  for (const [cat, items] of Object.entries(data.translations)) {
    cleanData.translations[cat] = stripIds(items);
  }

  return cleanData;
}


export function hydrateWithIds(raw: any): AppData {
  const r = raw || {};
  const data: AppData = createDefaultData();

  const processSection = (items: any[], type: 'qa' | 'vocab' | 'trans'): any => {
    const grouped: Record<string, any[]> = {};
    if (!Array.isArray(items)) return grouped;

    items.forEach(item => {
      let cat = item.category || 'All';
      
      // Migration logic for old QA parent/category structure
      if (type === 'qa' && item.parent && item.category) {
        const p = item.parent;
        const c = item.category;
        const formattedParent = p.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
        const formattedCat = c.charAt(0).toUpperCase() + c.slice(1);
        cat = `${formattedParent} - ${formattedCat}`;
      } else {
        // Just capitalize category if it's a simple string
        cat = cat.charAt(0).toUpperCase() + cat.slice(1);
      }

      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        ...item,
        id: item.id ?? generateId(),
        category: cat // Normalize category name in item too
      });
    });

    return grouped;
  };

  if (r.qa) data.qa = processSection(r.qa, 'qa');
  if (r.imageVocabulary) data.imageVocabulary = processSection(r.imageVocabulary, 'vocab');
  if (r.translations) data.translations = processSection(r.translations, 'trans');

  // Ensure at least one category exists if total empty
  if (Object.keys(data.qa).length === 0) data.qa = { 'Verb To Be - Singular': [] };
  if (Object.keys(data.imageVocabulary).length === 0) data.imageVocabulary = { 'Transport': [] };
  if (Object.keys(data.translations).length === 0) data.translations = { 'Easy': [] };

  return data;
}


export type SectionKey = 'qa' | 'imageVocabulary' | 'translations';

export interface SectionMeta {
  key: SectionKey;
  label: string;
  icon: string;
}

export const SECTIONS: SectionMeta[] = [
  { key: 'qa', label: 'Questions & Answers', icon: '💬' },
  { key: 'imageVocabulary', label: 'Image Vocabulary', icon: '🖼️' },
  { key: 'translations', label: 'Translations', icon: '🌐' },
];

