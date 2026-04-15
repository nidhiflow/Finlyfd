describe("Expense", () => {

  beforeEach(() => cy.login());

  it("Add expense works", () => {
    cy.visit("/expense");
    cy.get('[data-test=amount]').type("200");
    cy.get('[data-test=submit]').click();
    cy.contains("success").should("exist");
  });

});