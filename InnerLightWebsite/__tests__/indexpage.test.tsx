import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Page from "../app/page";

describe("first", () => {
    it("should render", () => {
        render(<Page />);
        expect(screen.getByText("Welcome to InnerLight")).toBeInTheDocument();
    });
});
