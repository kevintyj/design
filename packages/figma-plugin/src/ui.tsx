import { createRoot } from "react-dom/client";
import { SystemManagerPlugin } from "./components/SystemManagerPlugin";
import "./ui.css";

// React 19 compatible rendering
const container = document.getElementById("react-page");
if (container) {
	const root = createRoot(container);
	root.render(<SystemManagerPlugin />);
}
