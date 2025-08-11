import { getRoleConfig } from "../config/roles";

describe("getRoleConfig", () => {
  it("returns correct config for ZS", () => {
    const config = getRoleConfig("ZS");
    expect(config.dashboardTitle).toMatch(/ZS Dashboard/i);
    expect(Array.isArray(config.menuItems)).toBe(true);
  });

  it("returns correct config for DCP", () => {
    const config = getRoleConfig("DCP");
    expect(config.dashboardTitle).toMatch(/DCP Dashboard/i);
  });

  it("returns correct config for ACP", () => {
    const config = getRoleConfig("ACP");
    expect(config.dashboardTitle).toMatch(/ACP Dashboard/i);
  });

  it("returns correct config for SHO", () => {
    const config = getRoleConfig("SHO");
    expect(config.dashboardTitle).toMatch(/SHO Dashboard/i);
  });

  it("returns SHO config for unknown role", () => {
    const config = getRoleConfig("UNKNOWN_ROLE");
    expect(config.dashboardTitle).toMatch(/SHO Dashboard/i);
  });
});
