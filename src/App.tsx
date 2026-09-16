import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LeadsListPage } from './features/leads/LeadsListPage';
import { LeadDetailPage } from './features/leads/LeadDetailPage';
import { QuotationsListPage } from './features/quotations/QuotationsListPage';
import { QuotationDetailPage } from './features/quotations/QuotationDetailPage';
import { QuotationBuilderPage } from './features/quotations/QuotationBuilderPage';
import { StaffListPage } from './features/staff/StaffListPage';
import { StaffDetailPage } from './features/staff/StaffDetailPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);

  const handleNavigate = (page: string, id?: string) => {
    setActivePage(page);
    setSelectedEntityId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen bg-[#eef1f6]">
      {/* Sidebar */}
      <Sidebar activePage={activePage} setActivePage={(p) => handleNavigate(p)} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar activePage={activePage} />

        {/* Content View Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {activePage === 'reports' && <ReportsPage />}
          {activePage === 'leads' && <LeadsListPage onNavigate={handleNavigate} />}
          {activePage === 'lead-detail' && (
            <LeadDetailPage leadId={selectedEntityId || ''} onNavigate={handleNavigate} />
          )}
          {activePage === 'quotations' && <QuotationsListPage onNavigate={handleNavigate} />}
          {activePage === 'quotation-detail' && (
            <QuotationDetailPage quoteId={selectedEntityId || ''} onNavigate={handleNavigate} />
          )}
          {activePage === 'quotation-builder' && (
            <QuotationBuilderPage preselectedLeadId={selectedEntityId} onNavigate={handleNavigate} />
          )}
          {activePage === 'staff' && <StaffListPage onNavigate={handleNavigate} />}
          {activePage === 'staff-detail' && (
            <StaffDetailPage staffId={selectedEntityId || ''} onNavigate={handleNavigate} />
          )}
          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
