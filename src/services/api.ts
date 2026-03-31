export const api = {
  async getQuestions() {
    const res = await fetch('/api/questions');
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
  },

  async addQuestion(question: any) {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!res.ok) throw new Error('Failed to add question');
    return res.json();
  },

  async updateQuestion(id: string, question: any) {
    const res = await fetch(`/api/questions?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    if (!res.ok) throw new Error('Failed to update question');
    return res.json();
  },

  async deleteQuestion(id: string) {
    const res = await fetch(`/api/questions?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete question');
    return true;
  },

  async getVocabulary() {
    const res = await fetch('/api/vocabulary');
    if (!res.ok) throw new Error('Failed to fetch vocabulary');
    return res.json();
  },

  async addVocabulary(item: any) {
    const res = await fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to add vocabulary');
    return res.json();
  },

  async updateVocabulary(id: string, item: any) {
    const res = await fetch(`/api/vocabulary?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update vocabulary');
    return res.json();
  },

  async deleteVocabulary(id: string) {
    const res = await fetch(`/api/vocabulary?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete vocabulary');
    return true;
  },

  async getSentences() {
    const res = await fetch('/api/sentences');
    if (!res.ok) throw new Error('Failed to fetch sentences');
    return res.json();
  },

  async addSentence(item: any) {
    const res = await fetch('/api/sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to add sentence');
    return res.json();
  },

  async updateSentence(id: string, item: any) {
    const res = await fetch(`/api/sentences?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to update sentence');
    return res.json();
  },

  async deleteSentence(id: string) {
    const res = await fetch(`/api/sentences?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete sentence');
    return true;
  },

  async saveAll(payload: { questions: any[]; vocabulary: any[]; sentences: any[] }) {
    const res = await fetch('/api/save-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save all data');
    return res.json();
  },
};
