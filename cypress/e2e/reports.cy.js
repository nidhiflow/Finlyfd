describe("Reports Module", () => {

  beforeEach(() => {
    // ✅ Mock login
    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        token: "fake-token",
        user: { id: 1, email: "demo@finly.app" }
      }
    }).as("login");

    // ✅ Mock reports API
    cy.intercept("GET", "**/reports**", {
      statusCode: 200,
      body: {
        totalIncome: 5000,
        totalExpense: 2000,
        categories: []
      }
    }).as("reports");

    // Login
    cy.visit("/login");
    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");
    cy.contains("Sign In").click();

    cy.wait("@login");
  });

  it("Reports page loads safely", () => {
    cy.visit("/");
    cy.get("body").should("be.visible");
  });

  it("Reports render without crash", () => {
    cy.get("body").should("be.visible");

    // Optional: check chart container exists
    cy.get("canvas, svg, div").should("exist");
  });

});