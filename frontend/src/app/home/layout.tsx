"use client";

import React from 'react';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import { InboxProvider } from '../../context/InboxContext';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <InboxProvider>
      <div className="flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]">
        <Sidebar />
        <Header
          onSearch={() => {}}
          onDateFilter={() => {}}
          onReset={() => {}}
        />
        <div className="flex-1 p-8 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px]">
          {children}
        </div>
      </div>
    </InboxProvider>
  );
}

HomeLayout.displayName = 'HomeLayout';
