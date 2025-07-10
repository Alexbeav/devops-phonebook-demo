import React from "react";
import ReactDOM from "react-dom/client";
import { useEffect, useState } from "react";

const App = () => {
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("/api/hello")
            .then((res) => res.json())
            .then((data) => setMessage(data.message));
    }, []);

    return <h1>{message || "Loading..."}</h1>;
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
