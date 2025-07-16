import type { ReactNode } from "react";

export type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertProps {
	variant: AlertVariant;
	children: ReactNode;
	onDismiss?: () => void;
	showDismiss?: boolean;
	className?: string;
	size?: "sm" | "md" | "lg";
}

const getVariantStyles = (variant: AlertVariant): string => {
	switch (variant) {
		case "success":
			return "bg-green-3 hover:bg-green-4 border border-green-7 text-green-11";
		case "warning":
			return "bg-yellow-3 hover:bg-yellow-4 border border-yellow-7 text-yellow-11";
		case "error":
			return "bg-red-3 hover:bg-red-4 border border-red-7 text-red-11";
		case "info":
			return "bg-blue-3 hover:bg-blue-4 border border-blue-7 text-blue-11";
		default:
			return "bg-gray-3 hover:bg-gray-4 border border-gray-7 text-gray-11";
	}
};

const getIcon = (variant: AlertVariant): string => {
	switch (variant) {
		case "success":
			return "✓";
		case "warning":
			return "⚠";
		case "error":
			return "✕";
		case "info":
			return "ℹ";
		default:
			return "";
	}
};

const getBorderAccent = (variant: AlertVariant): string => {
	switch (variant) {
		case "success":
			return "border-green-11";
		case "warning":
			return "border-yellow-11";
		case "error":
			return "border-red-11";
		case "info":
			return "border-blue-11";
		default:
			return "border-gray-11";
	}
};

export const Alert = ({
	variant,
	children,
	onDismiss,
	showDismiss = false,
	className = "",
	size = "md",
}: AlertProps) => {
	const variantStyles = getVariantStyles(variant);
	const borderAccent = getBorderAccent(variant);
	const icon = getIcon(variant);

	const sizeStyles = {
		sm: "text-xs py-1 px-2",
		md: "text-xs py-1.5 px-3",
		lg: "text-sm py-2 px-4",
	};

	return (
		<div className={`${variantStyles} transition-all duration-300 ease-out transform ${className}`}>
			<div className="flex items-start justify-between gap-3">
				<div className={`font-mono ${sizeStyles[size]} flex-1 border-l-2 ${borderAccent} flex items-start gap-2`}>
					{icon && <span className="font-medium flex-shrink-0 mt-0.5">{icon}</span>}
					<div className="break-words leading-relaxed">{children}</div>
				</div>
				{showDismiss && onDismiss && (
					<button
						type="button"
						onClick={onDismiss}
						className="px-2 py-1 opacity-60 hover:opacity-80 transition-opacity duration-200 text-xs flex-shrink-0"
					>
						✕
					</button>
				)}
			</div>
		</div>
	);
};
