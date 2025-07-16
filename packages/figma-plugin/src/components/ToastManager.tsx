import { useEffect } from "react";
import { useToast } from "../hooks/useToast";

export const ToastManager = () => {
	const toastApi = useToast();

	useEffect(() => {
		// Bind the toast API to the window for global access
		(window as any).toastApi = toastApi;

		return () => {
			delete (window as any).toastApi;
		};
	}, [toastApi]);

	return null;
};
