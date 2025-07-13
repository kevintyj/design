import type React from "react";
import { useCallback, useRef, useState } from "react";
import type { ResizeMessage } from "../types";

interface ResizerProps {
	minWidth?: number;
	minHeight?: number;
}

export const Resizer: React.FC<ResizerProps> = ({ minWidth = 240, minHeight = 180 }) => {
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

			// Capture pointer to ensure we get all move events
			(e.target as HTMLElement).setPointerCapture(e.pointerId);

			const handlePointerMove = (moveEvent: PointerEvent) => {
				// Throttle with requestAnimationFrame to prevent UI jitter
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
				}

				animationFrameRef.current = requestAnimationFrame(() => {
					const newWidth = Math.max(minWidth, Math.floor(moveEvent.clientX + 16));
					const newHeight = Math.max(minHeight, Math.floor(moveEvent.clientY + 16));

					sendResizeMessage(newWidth, newHeight);
				});
			};

			const handlePointerUp = () => {
				setIsDragging(false);

				// Clean up event listeners
				document.removeEventListener("pointermove", handlePointerMove);
				document.removeEventListener("pointerup", handlePointerUp);

				// Clean up animation frame
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
				}
			};

			// Add global event listeners for smoother dragging
			document.addEventListener("pointermove", handlePointerMove);
			document.addEventListener("pointerup", handlePointerUp);
		},
		[minWidth, minHeight, sendResizeMessage],
	);

	return (
		<div
			className={`
				fixed bottom-0 right-0 w-4 h-4 
				cursor-nw-resize select-none
				${isDragging ? "bg-blue-500/20" : "hover:bg-gray-100/50"}
				transition-colors duration-150
			`}
			onPointerDown={handlePointerDown}
			style={{ touchAction: "none" }}
		>
			{/* SVG Triangle Icon */}
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				className="absolute bottom-0 right-0 pointer-events-none"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-label="Resize handle"
			>
				<title>Resize handle</title>
				<path d="M16 16L16 10L10 16L16 16Z" fill="white" stroke="#666" strokeWidth="1" />
				<path d="M16 16L16 6L6 16L16 16Z" fill="white" stroke="#666" strokeWidth="1" />
			</svg>
		</div>
	);
};
