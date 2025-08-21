"use client";

import React from 'react';

interface ConfirmDialogProps {
	open: boolean;
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function ConfirmDialog({ open, title = '确认操作', description, confirmText = '确定', cancelText = '取消', onConfirm, onCancel }: ConfirmDialogProps) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
				<div className="px-6 py-4 border-b">
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
				</div>
				<div className="px-6 py-5 text-gray-700">
					{description || '请确认是否继续执行该操作。'}
				</div>
				<div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
					<button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">{cancelText}</button>
					<button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{confirmText}</button>
				</div>
			</div>
		</div>
	);
}
