import { createRoot } from "react-dom/client";
import { SystemManagerPlugin } from "./components/SystemManagerPlugin";
import { ToastContainer } from "./components/ToastContainer";
import { ToastManager } from "./components/ToastManager";
import { ToastProvider } from "./components/ToastProvider";
import "./ui.css";

// React 19 compatible rendering
const container = document.getElementById("react-page");
if (container) {
	const root = createRoot(container);
	root.render(
		<ToastProvider>
			<ToastManager />
			<ToastContainer />
			<SystemManagerPlugin />
		</ToastProvider>,
	);
}
