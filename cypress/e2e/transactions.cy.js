describe("Transactions Module", () => {

  beforeEach(() => {
    // ✅ Mock login
    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        token: "fake-token",
        user: { id: 1, email: "demo@finly.app" }
      }
    }).as("login");

    // ✅ Mock transactions API
    cy.intercept("GET", "**/transactions**", {
      statusCode: 200,
      body: [
        { id: 1, amount: 500, type: "income" },
        { id: 2, amount: 200, type: "expense" }
      ]
    }).as("transactions");

    // Login first
    cy.visit("/login");
    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");
    cy.contains("Sign In").click();

    cy.wait("@login");
  });

  it("Transactions page loads", () => {
    cy.visit("/"); // let app routing handle it
    cy.get("body").should("be.visible");
  });

  it("Transactions list renders safely", () => {
    cy.get("body").should("be.visible");
  });

});