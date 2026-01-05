'use client';

import React, { Suspense } from 'react';
import { Sidebar } from '../../components/Sidebar';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

import { InboxProvider } from '../../context/InboxContext';

import InboxBootloaderClient from '../../components/InboxBootloaderClient';



// Layout component that renders Sidebar and Header once for all /inbox routes
export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <InboxProvider>
      <div className='flex h-screen w-full bg-gray-50 font-[family-name:var(--font-geist-sans)]'>
        <Suspense fallback={null}>
          <InboxBootloaderClient />
        </Suspense>
        <Suspense fallback={null}>

          <Sidebar onTableReload={undefined} />

        </Suspense>

        <Header />

        <div className='flex-1 overflow-y-auto ml-[80px] md:ml-[18%] mt-[64px] md:mt-[70px] flex flex-col'>

          <div className="flex-grow p-8">

            {children}

          </div>

          <Footer />

        </div>

      </div>

    </InboxProvider>
  );
}

// Mark display name for debugging
InboxLayout.displayName = 'InboxLayout';