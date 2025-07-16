import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "./Alert";
import { type Toast, useToastContext } from "./ToastProvider";

interface ToastItemProps {
	toast: Toast;
	index: number;
	total: number;
	isStackExpanded: boolean;
	onRemove: (id: string) => void;
}

const ToastItem = ({ toast, index, total, isStackExpanded, onRemove }: ToastItemProps) => {
	const [isVisible, setIsVisible] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	useEffect(() => {
		setTimeout(() => setIsVisible(true), 10);
	}, []);

	const handleRemove = (): void => {
		setIsRemoving(true);
		setTimeout(() => onRemove(toast.id), 300);
	};

	// Reverse the scale calculation - newest toast (highest index) should be full size
	const reverseIndex = total - 1 - index;
	const scale = isStackExpanded ? 1 : 1 - reverseIndex * 0.05;
	const opacity = isRemoving ? 0 : isVisible ? 1 : 0;

	const marginTop = !isStackExpanded && index > 0 ? "-24px" : "0px";

	return (
		<div
			className="toast-item transition-all duration-300 ease-out flex-shrink-0"
			style={{
				// Newest toast (highest index) should have highest z-index
				zIndex: 50 + index,
				transform: isRemoving ? "translateX(100%)" : `scale(${scale})`,
				opacity,
				width: "max-content",
				maxWidth: "min(600px, calc(100vw - 32px))",
				minWidth: "280px",
				marginTop,
			}}
		>
			<Alert variant={toast.type} onDismiss={handleRemove} showDismiss={true} className="shadow-lg">
				{toast.message}
			</Alert>
		</div>
	);
};

export const ToastContainer = () => {
	const { toasts, removeToast } = useToastContext();
	const [isStackExpanded, setIsStackExpanded] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseEnter = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setIsStackExpanded(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		timeoutRef.current = setTimeout(() => {
			setIsStackExpanded(false);
		}, 300);
	}, []);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	if (toasts.length === 0) {
		return null;
	}

	// Sort toasts so newest (highest timestamp/id) is first
	const sortedToasts = [...toasts].sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

	return (
		<section
			className="fixed pointer-events-none z-50 flex flex-col justify-end items-center"
			style={{
				bottom: "16px",
				left: "50%",
				transform: "translateX(-50%)",
				width: "max-content",
				maxWidth: "min(600px, calc(100vw - 32px))",
				maxHeight: "80vh",
				gap: isStackExpanded ? "8px" : "0px",
			}}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			aria-label="Toast notifications"
		>
			{/* Render toasts with newest first (index 0 = newest) */}
			{sortedToasts.map((toast, index) => (
				<div key={toast.id} className="pointer-events-auto">
					<ToastItem
						toast={toast}
						index={index}
						total={sortedToasts.length}
						isStackExpanded={isStackExpanded}
						onRemove={removeToast}
					/>
				</div>
			))}
		</section>
	);
};
