"use client";

import { usePathname } from 'next/navigation';

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  
  // 公开页面不需要底部padding
  const publicPaths = ['/login', '/register', '/debug', '/force-logout', '/test-middleware', '/test-auth', '/test-middleware-simple'];
  const isPublicPage = publicPaths.includes(pathname);
  
  return (
    <div className={isPublicPage ? '' : 'pb-20'}>
      {children}
    </div>
  );
}
