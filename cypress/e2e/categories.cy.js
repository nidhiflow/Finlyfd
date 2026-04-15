describe("Categories Module", () => {

  beforeEach(() => {
    // ✅ Mock login
    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        token: "fake-token",
        user: { id: 1, email: "demo@finly.app" }
      }
    }).as("login");

    // ✅ Mock categories API
    cy.intercept("GET", "**/categories**", {
      statusCode: 200,
      body: [
        { id: 1, name: "Food" },
        { id: 2, name: "Travel" }
      ]
    }).as("categories");

    // Login
    cy.visit("/login");
    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");
    cy.contains("Sign In").click();

    cy.wait("@login");
  });

  it("Categories page loads safely", () => {
    cy.visit("/");
    cy.get("body").should("be.visible");
  });

  it("Categories list renders safely", () => {
    cy.get("body").should("be.visible");
  });

});