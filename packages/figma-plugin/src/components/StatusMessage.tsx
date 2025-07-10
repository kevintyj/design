import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface StatusMessageProps {
	message: string;
	type?: "info" | "success" | "warning" | "error";
	onDismiss?: () => void;
	dismissible?: boolean;
}

type AnimationState = "entering" | "visible" | "exiting" | "hidden";

export const StatusMessage: React.FC<StatusMessageProps> = ({
	message,
	type = "info",
	onDismiss,
	dismissible = true,
}) => {
	const [animationState, setAnimationState] = useState<AnimationState>("entering");
	const [isHovered, setIsHovered] = useState(false);
	const [previousMessage, setPreviousMessage] = useState<string>("");
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleDismiss = useCallback(() => {
		if (!dismissible) return;

		setAnimationState("exiting");

		// Wait for exit animation to complete before calling onDismiss
		animationTimeoutRef.current = setTimeout(() => {
			setAnimationState("hidden");
			if (onDismiss) {
				onDismiss();
			}
		}, 300); // Match the CSS transition duration
	}, [onDismiss, dismissible]);

	// Reset component state when a new message arrives
	useEffect(() => {
		if (message && message !== previousMessage) {
			// Clear any existing timers
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
			if (animationTimeoutRef.current) {
				clearTimeout(animationTimeoutRef.current);
			}

			// Reset all state for new message
			setAnimationState("entering");
			setIsHovered(false);
			setPreviousMessage(message);
		} else if (!message) {
			setPreviousMessage("");
		}
	}, [message, previousMessage]);

	// Handle entrance animation
	useEffect(() => {
		if (message && animationState === "entering") {
			// Small delay to ensure the element is rendered before starting animation
			const timer = setTimeout(() => {
				setAnimationState("visible");
			}, 10);

			return () => clearTimeout(timer);
		}
	}, [message, animationState]);

	// Handle auto-dismiss timer (only when dismissible)
	useEffect(() => {
		if (!dismissible || !message || animationState !== "visible") return;

		const startTimer = () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				handleDismiss();
			}, 10000);
		};

		if (!isHovered) {
			startTimer();
		} else {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		}

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [message, animationState, isHovered, handleDismiss, dismissible]);

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
			if (animationTimeoutRef.current) {
				clearTimeout(animationTimeoutRef.current);
			}
		};
	}, []);

	if (!message || animationState === "hidden") return null;

	const getMessageClass = () => {
		const _baseClasses = dismissible ? "hover:bg-" : "";
		switch (type) {
			case "success":
				return `bg-green-3 ${dismissible ? "hover:bg-green-4" : ""} border border-green-7`;
			case "warning":
				return `bg-yellow-3 ${dismissible ? "hover:bg-yellow-4" : ""} border border-yellow-7`;
			case "error":
				return `bg-red-3 ${dismissible ? "hover:bg-red-4" : ""} border border-red-7`;
			default:
				return `bg-blue-3 ${dismissible ? "hover:bg-blue-4" : ""} border border-blue-7`;
		}
	};

	const getTextClass = () => {
		switch (type) {
			case "success":
				return "text-green-11 border-l-2 border-green-11";
			case "warning":
				return "text-yellow-11 border-l-2 border-yellow-11";
			case "error":
				return "text-red-11 border-l-2 border-red-11";
			default:
				return "text-blue-11 border-l-2 border-blue-11";
		}
	};

	const getAnimationClass = () => {
		switch (animationState) {
			case "entering":
				return "opacity-0 -translate-y-2";
			case "visible":
				return "opacity-100 translate-y-0";
			case "exiting":
				return "opacity-0 -translate-y-2";
			default:
				return "opacity-0 -translate-y-2";
		}
	};

	return (
		<div
			className={`relative transition-all duration-300 ease-out transform ${getMessageClass()} ${getAnimationClass()}`}
			onMouseEnter={dismissible ? () => setIsHovered(true) : undefined}
			onMouseLeave={dismissible ? () => setIsHovered(false) : undefined}
			role="alert"
		>
			<div className="flex items-center justify-between">
				<p className={`font-mono text-xs py-1.5 px-3 flex-1 ${getTextClass()}`}>{message}</p>
				{dismissible && (
					<button
						type="button"
						onClick={handleDismiss}
						className="px-2.5 text-sm font-medium transition-colors text-gray-11 hover:text-gray-12 cursor-pointer"
						aria-label="Dismiss message"
					>
						×
					</button>
				)}
			</div>
		</div>
	);
};
