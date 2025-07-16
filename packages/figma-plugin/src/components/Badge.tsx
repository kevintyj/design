import type { AlertVariant } from "./Alert";

interface BadgeProps {
	variant: AlertVariant;
	children: React.ReactNode;
	size?: "sm" | "md";
}

const getVariantStyles = (variant: AlertVariant): string => {
	switch (variant) {
		case "success":
			return "bg-green-3 border border-green-7 text-green-11";
		case "warning":
			return "bg-yellow-3 border border-yellow-7 text-yellow-11";
		case "error":
			return "bg-red-3 border border-red-7 text-red-11";
		case "info":
			return "bg-blue-3 border border-blue-7 text-blue-11";
		default:
			return "bg-gray-3 border border-gray-7 text-gray-11";
	}
};

export const Badge = ({ variant, children, size = "sm" }: BadgeProps) => {
	const variantStyles = getVariantStyles(variant);

	const sizeStyles = {
		sm: "px-1.5 py-0.5 text-[0.625rem]",
		md: "px-2 py-1 text-xs",
	};

	return <span className={`${variantStyles} ${sizeStyles[size]} font-mono font-medium inline-block`}>{children}</span>;
};
