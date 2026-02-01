import React from 'react';
import  SidebarTEMP  from './SidebarTEMP';
import  HeaderTEMP  from './HeaderTEMP';

export function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Ensure Sidebar file is named Sidebar.jsx */}
      <SidebarTEMP />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Ensure Header file is named Header.jsx */}
        <HeaderTEMP />
        <main className="flex-1 overflow-y-auto p-6 bg-secondary/10">
          {children}
        </main>
      </div>
    </div>
  );
}