import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

// Remove default margin/padding from body to eliminate white borders
const style = document.createElement('style');
style.innerHTML = `body { margin: 0; padding: 0; background: #0f0f0f; }`;
document.head.appendChild(style);

function App() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", phone: "", email: "" });
    const [error, setError] = useState("");

    // Fetch contacts
    useEffect(() => {
        fetch("/api/contacts")
            .then((res) => res.json())
            .then((data) => {
                setContacts(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to load contacts");
                setLoading(false);
            });
    }, []);

    // Add contact
    const handleAdd = (e) => {
        e.preventDefault();
        setError("");
        fetch("/api/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        })
            .then((res) => {
                if (!res.ok) throw new Error("Add failed");
                return res.json();
            })
            .then((newContact) => {
                setContacts([...contacts, newContact]);
                setForm({ name: "", phone: "", email: "" });
            })
            .catch(() => setError("Failed to add contact"));
    };

    // Delete contact - triggering a change
    const handleDelete = (id) => {
        fetch(`/api/contacts/${id}`, { method: "DELETE" })
            .then((res) => {
                if (!res.ok) throw new Error("Delete failed");
                setContacts(contacts.filter((c) => c.id !== id));
            })
            .catch(() => setError("Failed to delete contact"));
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0f0f0f",
            color: "#0099ff",
            fontFamily: "monospace",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: 0
        }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#0099ff" }}>🔵 Phonebook Contacts</h1>
            <div className="label" style={{ color: "#888", fontSize: "0.9rem", marginBottom: "2rem" }}>
                Served by Nginx inside Docker & Kubernetes
            </div>
            <div style={{ display: "flex", gap: 48, width: "100%", maxWidth: 900 }}>
                <div style={{ flex: 1, minWidth: 300 }}>
                    <h2 style={{ color: "#0099ff", borderBottom: "1px solid #222", paddingBottom: 8 }}>Contacts</h2>
                    {error && <div style={{ color: "#ff3366" }}>{error}</div>}
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <ul style={{ padding: 0, listStyle: "none" }}>
                            {contacts.map((c) => (
                                <li key={c.id} style={{ marginBottom: 12, background: "#181818", padding: 12, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span>
                                        <b style={{ color: "#0099ff" }}>{c.name}</b> — {c.phone} {c.email && <span style={{ color: "#888" }}>({c.email})</span>}
                                    </span>
                                    <button style={{ marginLeft: 16, background: "#222", color: "#ff3366", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer" }} onClick={() => handleDelete(c.id)}>
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 300 }}>
                    <h2 style={{ color: "#0099ff", borderBottom: "1px solid #222", paddingBottom: 8 }}>Add Contact</h2>
                    <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 12, background: "#181818", padding: 24, borderRadius: 8, maxWidth: 350 }}>
                        <input
                            required
                            placeholder="Name:"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            style={{ background: "#222", color: "#0099ff", border: "1px solid #333", borderRadius: 4, padding: 8 }}
                        />
                        <input
                            required
                            placeholder="Phone:"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            style={{ background: "#222", color: "#0099ff", border: "1px solid #333", borderRadius: 4, padding: 8 }}
                        />
                        <input
                            placeholder="Email:"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            style={{ background: "#222", color: "#0099ff", border: "1px solid #333", borderRadius: 4, padding: 8 }}
                        />
                        <button type="submit" style={{ background: "#0099ff", color: "#0f0f0f", border: "none", borderRadius: 4, padding: "8px 0", fontWeight: "bold", cursor: "pointer" }}>Add</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
