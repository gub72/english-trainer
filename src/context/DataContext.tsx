import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { createDefaultData, hydrateWithIds } from '../types/schema';
import type { AppData, SectionKey } from '../types/schema';
import { api } from '../services/api';
import localQuestions from '../../data/questions.json';

interface DataContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  addItem: (section: SectionKey, category: string, parent?: string, initialData?: any) => Promise<void>;
  updateItem: (section: SectionKey, category: string, id: string, patch: any, parent?: string) => Promise<void>;
  deleteItem: (section: SectionKey, category: string, id: string, parent?: string) => Promise<void>;
  moveItem: (section: SectionKey, fromCat: string, toCat: string, id: string, fromParent?: string, toParent?: string) => Promise<void>;
  addCategory: (section: SectionKey, name: string) => void;
  deleteCategory: (section: SectionKey, name: string) => void;
  saveAll: () => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(createDefaultData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [questions, vocabulary, sentences] = await Promise.all([
        api.getQuestions(),
        api.getVocabulary(),
        api.getSentences(),
      ]);

      // Merge local translations into fetched questions
      if (Array.isArray(questions)) {
         questions.forEach(q => {
            const localMatch = (localQuestions as any[]).find(lq => lq.id === q.id);
            if (localMatch) {
               if (localMatch.questao) q.questao = localMatch.questao;
               if (localMatch.respostas) q.respostas = localMatch.respostas;
            }
         });
      }

      setData(hydrateWithIds({
        qa: questions,
        imageVocabulary: vocabulary,
        translations: sentences
      }));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addItem = useCallback(async (section: SectionKey, category: string, _parent?: string, initialData?: any) => {
    const id = crypto.randomUUID();
    const newItemBase = section === 'qa' 
      ? { id, question: '', answers: [''], ...initialData, category }
      : section === 'imageVocabulary'
      ? { id, image: '', word: '', plural: '', ...initialData, category }
      : { id, text: '', translation: '', ...initialData, category };

    try {
      if (section === 'qa') {
        await api.addQuestion(newItemBase);
      } else if (section === 'imageVocabulary') {
        await api.addVocabulary(newItemBase);
      } else {
        await api.addSentence(newItemBase);
      }
      
      setData((prev) => {
        const newData = { ...prev };
        if (!(newData[section] as any)[category]) {
            (newData[section] as any)[category] = [];
        }
        (newData[section] as any)[category].push(newItemBase);
        return { ...newData };
      });
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item.');
    }
  }, []);

  const updateItem = useCallback(async (section: SectionKey, category: string, id: string, patch: any, _parent?: string) => {
    try {
      let updatedItem: any;
      setData((prev) => {
        const newData = { ...prev };
        const targetList = (newData[section] as any)[category];
        if (!targetList) return prev;

        const index = targetList.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          updatedItem = { ...targetList[index], ...patch, category };
          targetList[index] = updatedItem;
        }
        return { ...newData };
      });

      if (updatedItem) {
        if (section === 'qa') {
          await api.updateQuestion(id, updatedItem);
        } else if (section === 'imageVocabulary') {
          await api.updateVocabulary(id, updatedItem);
        } else {
          await api.updateSentence(id, updatedItem);
        }
      }
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item.');
    }
  }, []);

  const deleteItem = useCallback(async (section: SectionKey, category: string, id: string, _parent?: string) => {
    try {
      if (section === 'qa') {
        await api.deleteQuestion(id);
      } else if (section === 'imageVocabulary') {
        await api.deleteVocabulary(id);
      } else {
        await api.deleteSentence(id);
      }

      setData((prev) => {
        const newData = { ...prev };
        const targetList = (newData[section] as any)[category];
        if (!targetList) return prev;

        const index = targetList.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          targetList.splice(index, 1);
        }
        return { ...newData };
      });
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item.');
    }
  }, []);

  const moveItem = useCallback(async (
    section: SectionKey, 
    fromCat: string, 
    toCat: string, 
    id: string
  ) => {
    try {
      let itemToMove: any;
      setData(prev => {
        const fromList = (prev[section] as any)[fromCat];
        if (!fromList) return prev;
        itemToMove = fromList.find((i: any) => i.id === id);
        return prev;
      });

      if (!itemToMove) return;

      const updatedItem = { ...itemToMove, category: toCat };

      if (section === 'qa') {
        await api.updateQuestion(id, updatedItem);
      } else if (section === 'imageVocabulary') {
        await api.updateVocabulary(id, updatedItem);
      } else {
        await api.updateSentence(id, updatedItem);
      }

      setData((prev) => {
        const newData = { ...prev };
        const fromList = (newData[section] as any)[fromCat];
        const toList = (newData[section] as any)[toCat];

        const index = fromList.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          const [item] = fromList.splice(index, 1);
          toList.push({ ...item, category: toCat });
        }
        return { ...newData };
      });
    } catch (err) {
      console.error('Error moving item:', err);
      setError('Failed to move item.');
    }
  }, []);

  const addCategory = useCallback((section: SectionKey, name: string) => {
    setData(prev => {
        const newData = { ...prev };
        if (!(newData[section] as any)[name]) {
            (newData[section] as any)[name] = [];
        }
        return { ...newData };
    });
  }, []);

  const deleteCategory = useCallback(async (section: SectionKey, name: string) => {
    if (name.toLowerCase() === 'all') return;
    
    // First delete all items in this category
    let itemsToDelete: string[] = [];
    setData(prev => {
        itemsToDelete = ((prev[section] as any)[name] || []).map((i: any) => i.id);
        return prev;
    });

    try {
        for (const id of itemsToDelete) {
            if (section === 'qa') await api.deleteQuestion(id);
            else if (section === 'imageVocabulary') await api.deleteVocabulary(id);
            else await api.deleteSentence(id);
        }

        setData(prev => {
            const newData = { ...prev };
            delete (newData[section] as any)[name];
            return { ...newData };
        });
    } catch (err) {
        console.error('Error deleting category:', err);
        setError('Failed to delete category.');
    }
  }, []);

  const saveAll = useCallback(async () => {
    try {
      const questions: any[] = [];
      for (const [catKey, items] of Object.entries(data.qa)) {
        for (const item of items) {
          questions.push({ ...item, category: catKey });
        }
      }

      const vocabulary: any[] = [];
      for (const [catKey, items] of Object.entries(data.imageVocabulary)) {
        for (const item of items) {
          vocabulary.push({ ...item, category: catKey });
        }
      }

      const sentences: any[] = [];
      for (const [catKey, items] of Object.entries(data.translations)) {
        for (const item of items) {
          sentences.push({ ...item, category: catKey });
        }
      }

      await api.saveAll({ questions, vocabulary, sentences });
    } catch (err) {
      console.error('Error saving all data:', err);
      throw err;
    }
  }, [data]);

  const value = useMemo(() => ({
    data,
    setData,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    addCategory,
    deleteCategory,
    saveAll,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    refreshData
  }), [data, addItem, updateItem, deleteItem, moveItem, addCategory, deleteCategory, saveAll, searchTerm, loading, error, refreshData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
