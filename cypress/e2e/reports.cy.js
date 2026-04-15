describe("Reports", () => {

  beforeEach(() => cy.login());

  it("Monthly report works", () => {
    cy.visit("/reports");
    cy.get('[data-test=chart]').should("exist");
  });

});