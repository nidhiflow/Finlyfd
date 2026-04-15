describe("Transactions", () => {

  beforeEach(() => cy.login());

  it("Transaction list loads", () => {
    cy.visit("/transactions");
    cy.get('[data-test=transaction]').should("exist");
  });

});