'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const pathname = usePathname();

  // Hide footer on login and public pages
  const hideFooterRoutes = ['/login', '/reset-password', '/sent'];
  const shouldHideFooter = hideFooterRoutes.some(route => pathname === route || pathname.startsWith(route));

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
