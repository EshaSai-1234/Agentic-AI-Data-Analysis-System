import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { DatasetStudioPage } from './pages/DatasetStudioPage';
import { ChatPage } from './pages/ChatPage';
import { EDAPage } from './pages/EDAPage';
import { CleaningPage } from './pages/CleaningPage';
import { MLPage } from './pages/MLPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ReportsPage } from './pages/ReportsPage';
import { DatasetSummary, DatasetDetail } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [currentDataset, setCurrentDataset] = useState<DatasetDetail | null>(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const loadDatasets = async () => {
    const list = await api.getDatasets();
    setDatasets(list);
    if (list.length > 0) {
      const detail = await api.getDatasetDetail(list[0].id);
      setCurrentDataset(detail);
    }
  };

  const handleSelectDataset = async (summary: DatasetSummary) => {
    const detail = await api.getDatasetDetail(summary.id);
    setCurrentDataset(detail);
  };

  const handleUpload = async (file: File, name?: string, desc?: string) => {
    const newDetail = await api.uploadDataset(file, name, desc);
    const updatedList = await api.getDatasets();
    setDatasets(updatedList);
    setCurrentDataset(newDetail);
  };

  const handleDeleteDataset = async (id: number) => {
    await api.deleteDataset(id);
    const updatedList = await api.getDatasets();
    setDatasets(updatedList);
    if (currentDataset?.summary.id === id) {
      if (updatedList.length > 0) {
        const nextDetail = await api.getDatasetDetail(updatedList[0].id);
        setCurrentDataset(nextDetail);
      } else {
        setCurrentDataset(null);
      }
    }
  };

  const handleAskPrompt = (prompt: string) => {
    setChatInitialPrompt(prompt);
  };

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-100 dark' 
        : 'bg-slate-50 text-slate-900 light'
    }`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasets={datasets}
        selectedDataset={currentDataset?.summary || null}
        onSelectDataset={handleSelectDataset}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            datasets={datasets}
            currentDataset={currentDataset}
            onSelectDataset={handleSelectDataset}
            onDeleteDataset={handleDeleteDataset}
            setActiveTab={setActiveTab}
            onAskPrompt={handleAskPrompt}
          />
        )}
        {activeTab === 'datasets' && (
          <DatasetStudioPage
            currentDataset={currentDataset}
            onUpload={handleUpload}
            onDelete={handleDeleteDataset}
          />
        )}
        {activeTab === 'chat' && (
          <ChatPage
            currentDataset={currentDataset}
            initialPrompt={chatInitialPrompt}
          />
        )}
        {activeTab === 'eda' && (
          <EDAPage
            currentDataset={currentDataset}
          />
        )}
        {activeTab === 'cleaning' && (
          <CleaningPage
            currentDataset={currentDataset}
            onDatasetUpdated={loadDatasets}
          />
        )}
        {activeTab === 'ml' && (
          <MLPage
            currentDataset={currentDataset}
          />
        )}
        {activeTab === 'compare' && (
          <ComparisonPage
            datasets={datasets}
            currentDataset={currentDataset}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsPage
            currentDataset={currentDataset}
          />
        )}
      </main>

      <footer className={`border-t py-4 px-6 text-center text-xs transition-colors ${
        isDarkMode ? 'border-slate-900 bg-slate-950/80 text-slate-500' : 'border-slate-200 bg-white/80 text-slate-500'
      }`}>
        Agentic AI Data Analysis and Visualization Assistant &bull; Built with React, Spring Boot, FastAPI, and Sandboxed Multi-Agents
      </footer>
    </div>
  );
};
