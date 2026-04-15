describe("Registration Module", () => {

  beforeEach(() => {
    // ✅ Mock registration API
    cy.intercept("POST", "**/signup", {
      statusCode: 200,
      body: {
        success: true,
        user: {
          id: 1,
          email: "newuser@finly.app"
        }
      }
    }).as("signup");
  });

  it("Signup page loads", () => {
    cy.visit("/signup");
    cy.get("body").should("be.visible");
  });

  it("Signup flow works safely", () => {
    cy.visit("/signup");

    // Try to fill inputs if present
    cy.get("body").then(($body) => {
      const inputs = $body.find("input");

      if (inputs.length > 0) {
        cy.wrap(inputs[0]).type("newuser@finly.app");

        if (inputs.length > 1) {
          cy.wrap(inputs[1]).type("password123");
        }
      }
    });

    // Click button safely
    cy.get("button").first().click({ force: true });

    cy.wait("@signup");

    // Ensure no crash
    cy.get("body").should("be.visible");
  });

});