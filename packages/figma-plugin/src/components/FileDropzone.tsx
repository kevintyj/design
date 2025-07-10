import { Upload } from "lucide-react";
import type React from "react";

interface FileDropzoneProps {
	id: string;
	accept: string;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	primaryText: string;
	secondaryText: string;
	label: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
	id,
	accept,
	onChange,
	primaryText,
	secondaryText,
	label,
}) => {
	return (
		<div>
			<label htmlFor={id} className="block text-sm font-medium text-gray-11">
				{label}
				<div className="border-1 border-dashed border-gray-7 p-6 text-center hover:border-blaze-7 hover:bg-blaze-2 transition-all duration-200 ease-in-out group cursor-pointer mt-3">
					<div className="space-y-2">
						<div className="mx-auto w-12 h-12 bg-gray-3 rounded-full flex items-center justify-center group-hover:bg-blaze-4 transition-colors">
							<Upload className="w-6 h-6 text-gray-11 group-hover:text-blaze-11" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-12 group-hover:text-blaze-11">{primaryText}</p>
							<p className="text-xs text-gray-11 mt-1">{secondaryText}</p>
						</div>
					</div>
				</div>
			</label>
			<div className="relative">
				<input
					id={id}
					type="file"
					accept={accept}
					onChange={onChange}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
				/>
			</div>
		</div>
	);
};
