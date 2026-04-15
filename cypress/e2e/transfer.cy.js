describe("Transfers", () => {

  beforeEach(() => cy.login());

  it("Transfer between accounts", () => {
    cy.visit("/transfer");
    cy.get('[data-test=amount]').type("100");
    cy.get('[data-test=submit]').click();
    cy.contains("success").should("exist");
  });

});