describe("Registration", () => {

  it("Registration succeeds", () => {
    cy.visit("/register");
    cy.get('[data-test=email]').type("new@mail.com");
    cy.get('[data-test=password]').type("123456");
    cy.get('[data-test=submit]').click();
    cy.url().should("include", "/dashboard");
  });

  it("Fails when fields missing", () => {
    cy.visit("/register");
    cy.get('[data-test=submit]').click();
    cy.contains("required").should("exist");
  });

  it("Email validation works", () => {
    cy.visit("/register");
    cy.get('[data-test=email]').type("bad");
    cy.contains("invalid").should("exist");
  });

});