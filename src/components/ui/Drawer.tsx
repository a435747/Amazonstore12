"use client";

import React, { useEffect } from 'react';

interface DrawerProps {
	open: boolean;
	title?: string;
	width?: number | string;
	onClose: () => void;
	children: React.ReactNode;
	footer?: React.ReactNode;
	centered?: boolean; // 新增：是否居中显示为模态框
}

export default function Drawer({ open, title, width = 420, onClose, children, footer, centered = false }: DrawerProps) {
	useEffect(() => {
		if (!open) return;
		const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('keydown', onEsc);
		return () => document.removeEventListener('keydown', onEsc);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className={centered ? 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-[90%] max-w-[720px] rounded-xl shadow-2xl' : 'absolute right-0 top-0 h-full bg-white w-full shadow-2xl'} style={centered ? undefined : { maxWidth: typeof width === 'number' ? `${width}px` : width }}>
				<div className="h-full flex flex-col">
					<div className="px-5 py-4 border-b flex items-center justify-between">
						<div className="text-lg font-semibold text-gray-900">{title}</div>
						<button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
					</div>
					<div className="flex-1 overflow-auto p-5">{children}</div>
					{footer && (
						<div className="px-5 py-4 border-t bg-gray-50">{footer}</div>
					)}
				</div>
			</div>
		</div>
	);
}
