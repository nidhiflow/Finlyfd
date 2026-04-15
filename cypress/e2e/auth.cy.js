describe("Authentication", () => {

  it("Login succeeds with valid credentials", () => {
    cy.visit("/login");
    cy.get('[data-test=email]').type("test@mail.com");
    cy.get('[data-test=password]').type("123456");
    cy.get('[data-test=login]').click();
    cy.url().should("include", "/dashboard");
  });

  it("Login fails with invalid password", () => {
    cy.visit("/login");
    cy.get('[data-test=email]').type("test@mail.com");
    cy.get('[data-test=password]').type("wrong");
    cy.get('[data-test=login]').click();
    cy.contains("Invalid").should("exist");
  });

  it("Login fails with unregistered email", () => {
    cy.visit("/login");
    cy.get('[data-test=email]').type("nouser@mail.com");
    cy.get('[data-test=password]').type("123456");
    cy.get('[data-test=login]').click();
    cy.contains("not found").should("exist");
  });

  it("Login blocked when fields empty", () => {
    cy.visit("/login");
    cy.get('[data-test=login]').should("be.disabled");
  });

  it("Email validation works", () => {
    cy.visit("/login");
    cy.get('[data-test=email]').type("invalid");
    cy.contains("invalid email").should("exist");
  });

  it("Password empty validation", () => {
    cy.visit("/login");
    cy.get('[data-test=email]').type("test@mail.com");
    cy.get('[data-test=login]').click();
    cy.contains("required").should("exist");
  });

  it("Redirect after login", () => {
    cy.visit("/login");
    cy.login(); // custom command (optional)
    cy.url().should("include", "/dashboard");
  });

  it("Protected route blocked", () => {
    cy.visit("/dashboard");
    cy.url().should("include", "/login");
  });

  it("Session persists after refresh", () => {
    cy.login();
    cy.reload();
    cy.url().should("include", "/dashboard");
  });

  it("Logout clears session", () => {
    cy.login();
    cy.get('[data-test=logout]').click();
    cy.url().should("include", "/login");
  });

});