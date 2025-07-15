import type React from "react";
import { useCallback, useRef, useState } from "react";
import type { ResizeMessage } from "../types";
import { WINDOW_CONFIG } from "../utils/constants";

interface ResizerProps {
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
}

export const Resizer: React.FC<ResizerProps> = ({
	minWidth = WINDOW_CONFIG.min?.width,
	minHeight = WINDOW_CONFIG.min?.height,
	maxWidth = WINDOW_CONFIG.max?.width,
	maxHeight = WINDOW_CONFIG.max?.height,
}) => {
	const [isDragging, setIsDragging] = useState(false);
	const animationFrameRef = useRef<number>(0);

	const sendResizeMessage = useCallback((width: number, height: number) => {
		const message: ResizeMessage = {
			type: "resize",
			size: { width, height },
		};

		parent.postMessage({ pluginMessage: message }, "*");
	}, []);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			e.preventDefault();
			setIsDragging(true);

			(e.target as HTMLElement).setPointerCapture(e.pointerId);

			const handlePointerMove = (moveEvent: PointerEvent) => {
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
				}

				animationFrameRef.current = requestAnimationFrame(() => {
					let newWidth = Math.floor(moveEvent.clientX);
					let newHeight = Math.floor(moveEvent.clientY);

					// Apply constraints
					if (minWidth) newWidth = Math.max(minWidth, newWidth);
					if (minHeight) newHeight = Math.max(minHeight, newHeight);

					if (maxWidth) newWidth = Math.min(maxWidth, newWidth);
					if (maxHeight) newHeight = Math.min(maxHeight, newHeight);

					sendResizeMessage(newWidth, newHeight);
				});
			};

			const handlePointerUp = () => {
				setIsDragging(false);
				document.removeEventListener("pointermove", handlePointerMove);
				document.removeEventListener("pointerup", handlePointerUp);

				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
				}
			};

			document.addEventListener("pointermove", handlePointerMove);
			document.addEventListener("pointerup", handlePointerUp);
		},
		[minWidth, minHeight, maxWidth, maxHeight, sendResizeMessage],
	);

	const [isHovering, setIsHovering] = useState(false);

	const getFillColor = () => {
		if (isDragging) return "rgb(251 138 118 / 0.32)";
		if (isHovering) return "rgb(251 138 118 / 0.16)";
		return "rgb(0 0 0 / 0.08)";
	};

	return (
		<div
			className="
				fixed bottom-0 right-0 w-5 h-5
				cursor-nwse-resize select-none z-50
				transition-colors duration-150
				opacity-40 hover:opacity-80
			"
			onPointerDown={handlePointerDown}
			onPointerEnter={() => setIsHovering(true)}
			onPointerLeave={() => setIsHovering(false)}
			style={{ touchAction: "none" }}
		>
			<svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
				<title>Resize handle</title>
				<g clip-path="url(#clip0_71_1140)">
					<path
						d="M38 40C39.1046 40 40 39.1046 40 38V2.82843C40 1.04662 37.8457 0.154284 36.5858 1.41421L1.41421 36.5858C0.154283 37.8457 1.04662 40 2.82843 40H38Z"
						fill={getFillColor()}
					/>
					<line
						x1="26.2713"
						y1="34.1161"
						x2="34.1162"
						y2="26.2712"
						stroke="black"
						stroke-opacity="0.36"
						stroke-width="2.5"
					/>
					<line
						x1="13.8501"
						y1="34.1161"
						x2="34.1161"
						y2="13.8501"
						stroke="black"
						stroke-opacity="0.36"
						stroke-width="2.5"
					/>
					<line
						x1="20.3875"
						y1="34.1161"
						x2="34.1161"
						y2="20.3875"
						stroke="black"
						stroke-opacity="0.36"
						stroke-width="2.5"
					/>
				</g>
				<defs>
					<clipPath id="clip0_71_1140">
						<rect width="40" height="40" fill="transparent" />
					</clipPath>
				</defs>
			</svg>
		</div>
	);
};
