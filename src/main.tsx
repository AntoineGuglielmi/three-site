import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Drei Html manages a nested React root. Avoid StrictMode's development-only
// effect replay, which synchronously unmounts that nested root in current Drei.
createRoot(document.getElementById("root")!).render(<App />);
