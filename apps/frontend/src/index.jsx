import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Remove default margin/padding from body to eliminate white borders
const style = document.createElement('style');
style.innerHTML = `body { margin: 0; padding: 0; background: #0f0f0f; }`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
