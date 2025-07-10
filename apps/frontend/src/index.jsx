
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

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

    // Delete contact
    const handleDelete = (id) => {
        fetch(`/api/contacts/${id}`, { method: "DELETE" })
            .then((res) => {
                if (!res.ok) throw new Error("Delete failed");
                setContacts(contacts.filter((c) => c.id !== id));
            })
            .catch(() => setError("Failed to delete contact"));
    };

    return (
        <div style={{ maxWidth: 500, margin: "2rem auto", fontFamily: "sans-serif" }}>
            <h2>Phonebook Contacts</h2>
            {error && <div style={{ color: "red" }}>{error}</div>}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <ul>
                    {contacts.map((c) => (
                        <li key={c.id} style={{ marginBottom: 8 }}>
                            <b>{c.name}</b> — {c.phone} {c.email && <>({c.email})</>}
                            <button style={{ marginLeft: 8 }} onClick={() => handleDelete(c.id)}>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <h3>Add Contact</h3>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                    required
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                    required
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <input
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <button type="submit">Add</button>
            </form>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
