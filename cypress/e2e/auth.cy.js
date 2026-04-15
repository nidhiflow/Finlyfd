describe("Auth Module", () => {

  it("Login page loads", () => {
    cy.visit("/login");
    cy.contains("Welcome back").should("exist");
  });

  it("Email and password inputs exist", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').should("exist");
    cy.get('input[type="password"]').should("exist");
  });

  it("Login button exists", () => {
    cy.visit("/login");
    cy.contains("Sign In").should("exist");
  });

  it("Login with demo credentials", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");

    cy.contains("Sign In").click();

    // Accept multiple possible flows
    cy.url().should("match", /quick-auth-setup|quick-login|dashboard/);
  });

  it("OTP screen appears if required", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");
    cy.contains("Sign In").click();

    // Check if OTP UI appears
    cy.get("body").then(($body) => {
      if ($body.text().includes("Verify OTP")) {
        cy.get('#otp-0').should("exist");
      }
    });
  });

});