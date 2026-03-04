import { createContext, useContext, type ReactNode } from 'react';

interface PageHeaderContextType {
  pageName: string;
}

const PageHeaderContext = createContext<PageHeaderContextType>({ pageName: '' });

export function PageHeaderProvider({ pageName, children }: { pageName: string; children: ReactNode }) {
  return (
    <PageHeaderContext.Provider value={{ pageName }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error('usePageHeader must be used within a PageHeaderProvider');
  }
  return context;
}
