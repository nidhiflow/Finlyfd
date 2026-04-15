describe("Income", () => {

  beforeEach(() => cy.login());

  it("Add income works", () => {
    cy.visit("/income");
    cy.get('[data-test=amount]').type("500");
    cy.get('[data-test=submit]').click();
    cy.contains("success").should("exist");
  });

  it("Reject negative income", () => {
    cy.get('[data-test=amount]').type("-100");
    cy.contains("invalid").should("exist");
  });

});