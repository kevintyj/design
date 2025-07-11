import type React from "react";

interface CheckboxFieldProps {
	id: string;
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	disabled?: boolean;
	indented?: boolean;
	className?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
	id,
	label,
	checked,
	onChange,
	disabled = false,
	indented = false,
	className = "",
}) => {
	return (
		<div className={`flex items-center gap-2 ${indented ? "ml-6" : ""} ${className}`}>
			<input
				type="checkbox"
				id={id}
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
				disabled={disabled}
				className="checkbox"
			/>
			<label htmlFor={id} className={`text-sm cursor-pointer ${disabled ? "text-gray-9" : "text-gray-11"}`}>
				{label}
			</label>
		</div>
	);
};
