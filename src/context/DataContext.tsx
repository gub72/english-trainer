import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { createDefaultData } from '../types/schema';
import type { AppData, SectionKey } from '../types/schema';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface DataContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  addItem: (section: SectionKey, category: string, parent?: string) => void;
  updateItem: (section: SectionKey, category: string, id: string, patch: any, parent?: string) => void;
  deleteItem: (section: SectionKey, category: string, id: string, parent?: string) => void;
  moveItem: (section: SectionKey, fromCat: string, toCat: string, id: string, fromParent?: string, toParent?: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useLocalStorage<AppData>('english-trainer-data', createDefaultData());
  const [searchTerm, setSearchTerm] = useState('');

  const addItem = useCallback((section: SectionKey, category: string, parent?: string) => {
    setData((prev) => {
      const newData = { ...prev };
      const id = crypto.randomUUID();
      
      let targetList: any[];
      if (section === 'qa' && parent) {
        targetList = (newData.qa as any)[parent][category];
      } else {
        targetList = (newData[section] as any)[category];
      }

      const newItem = section === 'qa' 
        ? { id, question: '', answers: [''] }
        : section === 'imageVocabulary'
        ? { id, image: '', word: '', plural: '' }
        : { id, text: '', translation: '' };

      targetList.push(newItem);
      return newData;
    });
  }, [setData]);

  const updateItem = useCallback((section: SectionKey, category: string, id: string, patch: any, parent?: string) => {
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
        targetList[index] = { ...targetList[index], ...patch };
      }
      return newData;
    });
  }, [setData]);

  const deleteItem = useCallback((section: SectionKey, category: string, id: string, parent?: string) => {
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
      return newData;
    });
  }, [setData]);

  const moveItem = useCallback((
    section: SectionKey, 
    fromCat: string, 
    toCat: string, 
    id: string, 
    fromParent?: string, 
    toParent?: string
  ) => {
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
        toList.push(item);
      }
      return newData;
    });
  }, [setData]);

  const value = useMemo(() => ({
    data,
    setData,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    searchTerm,
    setSearchTerm,
  }), [data, setData, addItem, updateItem, deleteItem, moveItem, searchTerm]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
