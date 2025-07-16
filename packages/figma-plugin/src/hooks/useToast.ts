import { useToastContext } from "../components/ToastProvider";

interface ToastApi {
	success: (message: string) => void;
	error: (message: string) => void;
	info: (message: string) => void;
}

export const useToast = (): ToastApi => {
	const { addToast } = useToastContext();

	return {
		success: (message: string) => addToast(message, "success"),
		error: (message: string) => addToast(message, "error"),
		info: (message: string) => addToast(message, "info"),
	};
};

// Export a global toast object that matches Sonner's API
export const toast = {
	success: (message: string) => {
		// This will be bound to the actual toast context when the provider is mounted
		if (typeof window !== "undefined" && (window as any).toastApi) {
			(window as any).toastApi.success(message);
		}
	},
	error: (message: string) => {
		if (typeof window !== "undefined" && (window as any).toastApi) {
			(window as any).toastApi.error(message);
		}
	},
	info: (message: string) => {
		if (typeof window !== "undefined" && (window as any).toastApi) {
			(window as any).toastApi.info(message);
		}
	},
};
