const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

const handleResponse = async (res: Response, defaultError: string) => {
  if (!res.ok) {
    let errorMessage = defaultError;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // use default error message
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

export const api = {
  async getQuestions() {
    const res = await fetch(`${API_BASE}/questions`);
    return handleResponse(res, 'Failed to fetch questions');
  },

  async addQuestion(question: any) {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    return handleResponse(res, 'Failed to add question');
  },

  async updateQuestion(id: string, question: any) {
    const res = await fetch(`${API_BASE}/questions?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    return handleResponse(res, 'Failed to update question');
  },

  async deleteQuestion(id: string) {
    const res = await fetch(`${API_BASE}/questions?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      await handleResponse(res, 'Failed to delete question');
    }
    return true;
  },

  async getVocabulary() {
    const res = await fetch(`${API_BASE}/vocabulary`);
    return handleResponse(res, 'Failed to fetch vocabulary');
  },

  async addVocabulary(item: any) {
    const res = await fetch(`${API_BASE}/vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res, 'Failed to add vocabulary');
  },

  async updateVocabulary(id: string, item: any) {
    const res = await fetch(`${API_BASE}/vocabulary?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res, 'Failed to update vocabulary');
  },

  async deleteVocabulary(id: string) {
    const res = await fetch(`${API_BASE}/vocabulary?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      await handleResponse(res, 'Failed to delete vocabulary');
    }
    return true;
  },

  async getSentences() {
    const res = await fetch(`${API_BASE}/sentences`);
    return handleResponse(res, 'Failed to fetch sentences');
  },

  async addSentence(item: any) {
    const res = await fetch(`${API_BASE}/sentences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res, 'Failed to add sentence');
  },

  async updateSentence(id: string, item: any) {
    const res = await fetch(`${API_BASE}/sentences?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return handleResponse(res, 'Failed to update sentence');
  },

  async deleteSentence(id: string) {
    const res = await fetch(`${API_BASE}/sentences?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      await handleResponse(res, 'Failed to delete sentence');
    }
    return true;
  },

  async saveAll(payload: { questions: any[]; vocabulary: any[]; sentences: any[] }) {
    const res = await fetch(`${API_BASE}/save-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res, 'Failed to save all data');
  },
};

