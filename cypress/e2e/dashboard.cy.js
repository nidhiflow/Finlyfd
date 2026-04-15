describe("Dashboard Module", () => {

  beforeEach(() => {
    // ✅ Mock login
    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        token: "fake-token",
        user: { id: 1, email: "demo@finly.app" }
      }
    }).as("login");

    // ✅ Mock dashboard data API (adjust if needed)
    cy.intercept("GET", "**/dashboard**", {
      statusCode: 200,
      body: {
        balance: 5000,
        income: 3000,
        expense: 2000,
        transactions: []
      }
    }).as("dashboard");

    // Perform login
    cy.visit("/login");
    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");
    cy.contains("Sign In").click();

    cy.wait("@login");
  });

  it("Dashboard loads after login", () => {
    cy.visit("/dashboard");
    cy.wait("@dashboard");

    cy.get("body").should("be.visible");
  });

  it("Dashboard shows balance", () => {
    cy.visit("/dashboard");
    cy.contains("5000").should("exist"); // adjust if formatted
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
    }).as("emptyDashboard");

    cy.visit("/dashboard");
    cy.wait("@emptyDashboard");

    cy.get("body").should("be.visible");
  });

});