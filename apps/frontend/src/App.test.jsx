import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.jsx";

describe("App", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn((url) =>
            Promise.resolve(url === "/api/config" ? {
                ok: true,
                json: () => Promise.resolve({ readOnly: true }),
            } : {
                ok: true,
                json: () => Promise.resolve([
                    { id: 1, name: "Ada", phone: "555-0100", email: "ada@example.com" },
                ]),
            })
        ));
    });

    it("renders the heading and fetched contacts", async () => {
        render(<App />);
        expect(screen.getByText(/Phonebook Contacts/)).toBeDefined();
        expect(await screen.findByText("Ada")).toBeDefined();
        expect(fetch).toHaveBeenCalledWith("/api/contacts");
        expect(fetch).toHaveBeenCalledWith("/api/config");
        expect(await screen.findByText(/read-only/)).toBeDefined();
        expect(screen.queryByText("Add Contact")).toBeNull();
        expect(screen.queryByText("Delete")).toBeNull();
    });

    it("shows write controls only when the backend explicitly enables them", async () => {
        fetch.mockImplementation((url) => Promise.resolve(url === "/api/config" ? {
            ok: true,
            json: () => Promise.resolve({ readOnly: false }),
        } : {
            ok: true,
            json: () => Promise.resolve([
                { id: 1, name: "Ada", phone: "555-0100", email: "ada@example.com" },
            ]),
        }));

        render(<App />);
        expect(await screen.findByText("Add Contact")).toBeDefined();
        expect(screen.getByText("Delete")).toBeDefined();
        expect(screen.getByText(/writes enabled/)).toBeDefined();
    });
});
