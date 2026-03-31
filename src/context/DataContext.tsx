import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { createDefaultData } from '../types/schema';
import type { AppData, SectionKey } from '../types/schema';
import { api } from '../services/api';

interface DataContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  addItem: (section: SectionKey, category: string, parent?: string, initialData?: any) => Promise<void>;
  updateItem: (section: SectionKey, category: string, id: string, patch: any, parent?: string) => Promise<void>;
  deleteItem: (section: SectionKey, category: string, id: string, parent?: string) => Promise<void>;
  moveItem: (section: SectionKey, fromCat: string, toCat: string, id: string, fromParent?: string, toParent?: string) => Promise<void>;
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

      const newData = createDefaultData();

      questions.forEach((item: any) => {
        const { category, parent } = item;
        if (parent && (newData.qa as any)[parent] && (newData.qa as any)[parent][category]) {
          (newData.qa as any)[parent][category].push(item);
        }
      });

      vocabulary.forEach((item: any) => {
        const { category } = item;
        if ((newData.imageVocabulary as any)[category]) {
          (newData.imageVocabulary as any)[category].push(item);
        }
      });

      sentences.forEach((item: any) => {
        const { category } = item;
        if ((newData.translations as any)[category]) {
          (newData.translations as any)[category].push(item);
        }
      });

      setData(newData);
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

  const addItem = useCallback(async (section: SectionKey, category: string, parent?: string, initialData?: any) => {
    const id = crypto.randomUUID();
    const newItemBase = section === 'qa' 
      ? { id, question: '', answers: [''], ...initialData, category, parent }
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
        let targetList: any[];
        if (section === 'qa' && parent) {
          targetList = (newData.qa as any)[parent][category];
        } else {
          targetList = (newData[section] as any)[category];
        }
        targetList.push(newItemBase);
        return { ...newData };
      });
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item.');
    }
  }, []);

  const updateItem = useCallback(async (section: SectionKey, category: string, id: string, patch: any, parent?: string) => {
    try {
      // Find the current item to preserve metadata
      let currentItem: any;
      setData((prev) => {
        let targetList: any[];
        if (section === 'qa' && parent) {
          targetList = (prev.qa as any)[parent][category];
        } else {
          targetList = (prev[section] as any)[category];
        }
        currentItem = targetList.find((item: any) => item.id === id);
        return prev;
      });

      const updatedItem = { ...currentItem, ...patch };

      if (section === 'qa') {
        await api.updateQuestion(id, updatedItem);
      } else if (section === 'imageVocabulary') {
        await api.updateVocabulary(id, updatedItem);
      } else {
        await api.updateSentence(id, updatedItem);
      }

      setData((prev) => {
        const newData = { ...prev };
        let targetList: any[];
        if (section === 'qa' && parent) {
          targetList = (newData.qa as any)[parent][category];
        } else {
          targetList = (newData[section] as any)[category];
        }

        const index = targetList.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          targetList[index] = updatedItem;
        }
        return { ...newData };
      });
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item.');
    }
  }, []);

  const deleteItem = useCallback(async (section: SectionKey, category: string, id: string, parent?: string) => {
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
        let targetList: any[];
        if (section === 'qa' && parent) {
          targetList = (newData.qa as any)[parent][category];
        } else {
          targetList = (newData[section] as any)[category];
        }

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
    id: string, 
    fromParent?: string, 
    toParent?: string
  ) => {
    try {
      let itemToMove: any;
      setData(prev => {
        let fromList: any[];
        if (section === 'qa') {
          fromList = (prev.qa as any)[fromParent!][fromCat];
        } else {
          fromList = (prev[section] as any)[fromCat];
        }
        itemToMove = fromList.find((i: any) => i.id === id);
        return prev;
      });

      if (!itemToMove) return;

      const updatedItem = { ...itemToMove, category: toCat, parent: toParent };

      if (section === 'qa') {
        await api.updateQuestion(id, updatedItem);
      } else if (section === 'imageVocabulary') {
        await api.updateVocabulary(id, updatedItem);
      } else {
        await api.updateSentence(id, updatedItem);
      }

      setData((prev) => {
        const newData = { ...prev };
        let fromList: any[];
        let toList: any[];

        if (section === 'qa') {
          fromList = (newData.qa as any)[fromParent!][fromCat];
          toList = (newData.qa as any)[toParent!][toCat];
        } else {
          fromList = (newData[section] as any)[fromCat];
          toList = (newData[section] as any)[toCat];
        }

        const index = fromList.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          const [item] = fromList.splice(index, 1);
          toList.push({ ...item, category: toCat, parent: toParent });
        }
        return { ...newData };
      });
    } catch (err) {
      console.error('Error moving item:', err);
      setError('Failed to move item.');
    }
  }, []);

  const saveAll = useCallback(async () => {
    try {
      // Flatten QA items into a flat array with category + parent metadata
      const questions: any[] = [];
      for (const [parentKey, parentObj] of Object.entries(data.qa)) {
        for (const [catKey, items] of Object.entries(parentObj as Record<string, any[]>)) {
          for (const item of items) {
            questions.push({ ...item, category: catKey, parent: parentKey });
          }
        }
      }

      // Flatten vocabulary items
      const vocabulary: any[] = [];
      for (const [catKey, items] of Object.entries(data.imageVocabulary)) {
        for (const item of items as any[]) {
          vocabulary.push({ ...item, category: catKey });
        }
      }

      // Flatten translation/sentence items
      const sentences: any[] = [];
      for (const [catKey, items] of Object.entries(data.translations)) {
        for (const item of items as any[]) {
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
    saveAll,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    refreshData
  }), [data, addItem, updateItem, deleteItem, moveItem, saveAll, searchTerm, loading, error, refreshData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
