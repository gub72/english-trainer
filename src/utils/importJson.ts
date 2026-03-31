import type { AppData } from '../types/schema';
import { hydrateWithIds } from '../types/schema';

export function readJsonFile(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(reader.result as string);
        if (!raw.qa && !raw.imageVocabulary && !raw.translations) {
          throw new Error('Invalid JSON structure: missing required top-level keys');
        }
        resolve(hydrateWithIds(raw));
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
