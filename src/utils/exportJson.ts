import type { AppData } from '../types/schema';
import { exportClean } from '../types/schema';

export function downloadJson(data: AppData, filename = 'english-trainer-data.json') {
  const clean = exportClean(data);
  const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
