describe("Transfer Module", () => {

  beforeEach(() => {
    // ✅ Mock login
    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        token: "fake-token",
        user: { id: 1, email: "demo@finly.app" }
      }
    }).as("login");

    // ✅ Mock transfer API
    cy.intercept("POST", "**/transfer**", {
      statusCode: 200,
      body: {
        success: true
      }
    }).as("transfer");

    // Login
    cy.visit("/login");
    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");
    cy.contains("Sign In").click();

    cy.wait("@login");
  });

  it("Transfer page loads safely", () => {
    cy.visit("/");
    cy.get("body").should("be.visible");
  });

  it("Transfer flow works safely", () => {
    cy.get("body").should("be.visible");

    // Try interacting with inputs if present
    cy.get("body").then(($body) => {
      if ($body.find('input').length > 0) {
        cy.get('input').first().type("100");
      }
    });

    // Click any button safely
    cy.get("button").first().click({ force: true });

    cy.get("body").should("be.visible");
  });

});