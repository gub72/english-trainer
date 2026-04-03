export interface QAItem {
  id: string;
  question: string;
  answers: string[];
  category?: string;
  questao?: string;
  respostas?: string[];
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

function stripMetadata<T extends { id?: string; parent?: string; group?: string }>(items: T[]): any[] {
  return items.map(({ id: _id, parent: _p, group: _g, ...rest }) => rest);
}

export function exportClean(data: AppData) {
  const cleanData: any = {
    qa: {},
    imageVocabulary: {},
    translations: {},
  };

  for (const [cat, items] of Object.entries(data.qa)) {
    cleanData.qa[cat] = stripMetadata(items);
  }
  for (const [cat, items] of Object.entries(data.imageVocabulary)) {
    cleanData.imageVocabulary[cat] = stripMetadata(items);
  }
  for (const [cat, items] of Object.entries(data.translations)) {
    cleanData.translations[cat] = stripMetadata(items);
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
        const p = item.parent as string;
        const c = item.category as string;
        
        const formattedParent = p.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
        const formattedCat = c.charAt(0).toUpperCase() + c.slice(1);
        
        // Prevent double prefixing if the category already contains the parent name
        if (formattedCat.startsWith(formattedParent + ' - ')) {
          cat = formattedCat;
        } else {
          cat = `${formattedParent} - ${formattedCat}`;
        }
      } else {
        // Just capitalize category if it's a simple string
        cat = cat.charAt(0).toUpperCase() + cat.slice(1);
      }

      if (!grouped[cat]) grouped[cat] = [];
      
      // Clean up item to remove obsolete properties after migration
      const { parent: _p, group: _g, ...cleanItem } = item;
      
      grouped[cat].push({
        ...cleanItem,
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

