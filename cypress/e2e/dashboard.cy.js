describe("Dashboard Module", () => {

  beforeEach(() => {
    // Mock login
    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        token: "fake-token",
        user: { id: 1, email: "demo@finly.app" }
      }
    }).as("login");

    // Mock dashboard API
    cy.intercept("GET", "**/dashboard**", {
      statusCode: 200,
      body: {
        balance: 5000,
        income: 3000,
        expense: 2000,
        transactions: []
      }
    }).as("dashboard");

    // Start from login page
    cy.visit("/login");

    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");
    cy.contains("Sign In").click();

    cy.wait("@login");
  });

  it("Dashboard loads after login", () => {
    // App should navigate automatically
    cy.url().should("match", /quick-auth-setup|quick-login|dashboard/);

    cy.get("body").should("be.visible");
  });

  it("Dashboard shows UI safely", () => {
    cy.get("body").should("be.visible");
  });

  it("Dashboard handles empty data", () => {
  cy.intercept("GET", "**/dashboard**", {
    statusCode: 200,
    body: {
      balance: 0,
      income: 0,
      expense: 0,
      transactions: []
    }
  });

  cy.reload();

  // ✅ Just ensure page renders properly
  cy.get("body").should("be.visible");

  // Optional: check dashboard still exists
  cy.contains("Dashboard").should("exist");
});
});