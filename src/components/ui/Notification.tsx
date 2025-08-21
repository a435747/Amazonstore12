"use client";

import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function Notification({ id, type, title, message, duration = 5000, onClose }: NotificationProps) {
  const { removeNotification } = useAppStore();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeNotification(id);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, removeNotification, onClose]);

  const handleClose = () => {
    removeNotification(id);
    onClose?.();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'info':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-xl border backdrop-blur-sm shadow-lg transform transition-all duration-300',
        getStyles()
      )}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-xl">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium mb-1">{title}</div>
          <div className="text-sm opacity-90">{message}</div>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-lg opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// 通知容器组件
export function NotificationContainer() {
  const { notifications } = useAppStore();

  // 注入一次 keyframes 样式，避免 SSR 报错
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const styleId = 'notification-keyframes-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
        />
      ))}
    </div>
  );
}
