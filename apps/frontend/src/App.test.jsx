import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.jsx";

describe("App", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn(() =>
            Promise.resolve({
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
    });
});
