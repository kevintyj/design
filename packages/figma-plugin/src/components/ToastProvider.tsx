import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import type { AlertVariant } from "./Alert";

export interface Toast {
	id: string;
	message: string;
	type: AlertVariant;
	timestamp: number;
}

interface ToastContextType {
	toasts: Toast[];
	addToast: (message: string, type: AlertVariant) => void;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToastContext = (): ToastContextType => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToastContext must be used within a ToastProvider");
	}
	return context;
};

interface ToastProviderProps {
	children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const addToast = useCallback((message: string, type: AlertVariant) => {
		const id = `toast-${Date.now()}-${Math.random()}`;
		const newToast: Toast = {
			id,
			message,
			type,
			timestamp: Date.now(),
		};

		setToasts((prev) => [...prev, newToast]);

		// Auto-remove toast after 4 seconds
		setTimeout(() => {
			setToasts((prev) => prev.filter((toast) => toast.id !== id));
		}, 4000);
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	return <ToastContext.Provider value={{ toasts, addToast, removeToast }}>{children}</ToastContext.Provider>;
};
