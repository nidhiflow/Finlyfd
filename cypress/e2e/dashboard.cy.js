describe("Dashboard", () => {

  beforeEach(() => {
    cy.login();
  });

  it("Dashboard loads", () => {
    cy.visit("/dashboard");
    cy.contains("Dashboard").should("exist");
  });

  it("Balance is visible", () => {
    cy.get('[data-test=balance]').should("exist");
  });

  it("Income summary visible", () => {
    cy.get('[data-test=income]').should("exist");
  });

  it("Expense summary visible", () => {
    cy.get('[data-test=expense]').should("exist");
  });

});