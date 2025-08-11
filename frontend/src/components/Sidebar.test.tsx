import React from "react";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../components/Sidebar";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { getRoleConfig } from "../config/roles";

const mockStore = configureStore([]);

describe("Sidebar visibility and menu items", () => {
  const rolesToTest = ["ZS", "DCP", "ACP", "SHO"];

  rolesToTest.forEach((role) => {
    it(`renders correct menu for role: ${role}`, () => {
      const store = mockStore({
        auth: {
          isAuthenticated: true,
          user: { role },
          token: "token",
        },
      });
      render(
        <Provider store={store}>
          <Sidebar />
        </Provider>
      );
      const config = getRoleConfig(role);
      config.menuItems.forEach((item) => {
        expect(screen.getByText(new RegExp(item.name, "i"))).toBeInTheDocument();
      });
    });
  });

  it("does not render sidebar for unauthorized role", () => {
    const store = mockStore({
      auth: {
        isAuthenticated: true,
        user: { role: "APPLICANT" },
        token: "token",
      },
    });
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });
});
