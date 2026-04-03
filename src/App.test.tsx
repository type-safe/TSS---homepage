import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders studio logo", () => {
  render(<App />);
  expect(
    screen.getByText(/type-safe\s*:\s*Studio/i)
  ).toBeInTheDocument();
});
