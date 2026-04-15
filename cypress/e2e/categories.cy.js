describe("Categories", () => {

  it("Category list loads", () => {
    cy.visit("/income");
    cy.get('[data-test=category]').should("exist");
  });

});
