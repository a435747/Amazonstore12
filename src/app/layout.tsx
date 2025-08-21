import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import PageWrapper from '@/components/PageWrapper';
import { NotificationContainer } from '@/components/ui/Notification';
import './globals.css';

export const metadata: Metadata = {
  title: 'BD Shop - 智能电商管理系统',
  description: '高效的订单管理和抢单系统，提供完整的电商解决方案',
  keywords: '电商,订单管理,抢单系统,库存管理,客户管理',
  authors: [{ name: 'BD Shop Team' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <main>
          <PageWrapper>
            {children}
          </PageWrapper>
        </main>
        <NavBar />
        <NotificationContainer />
      </body>
    </html>
  );
} 