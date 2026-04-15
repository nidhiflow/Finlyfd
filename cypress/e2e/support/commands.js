Cypress.Commands.add("login", () => {
  cy.visit("/login");
  cy.get('[data-test=email]').type("test@mail.com");
  cy.get('[data-test=password]').type("123456");
  cy.get('[data-test=login]').click();
});