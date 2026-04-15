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

  it("Login with demo credentials (mocked API)", () => {
    cy.visit("/login");

    // ✅ Mock login API
    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        token: "fake-token",
        user: {
          id: 1,
          email: "demo@finly.app"
        }
      }
    }).as("loginRequest");

    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");

    cy.contains("Sign In").click();

    cy.wait("@loginRequest");

    // ✅ Accept multiple possible routes
    cy.url().should("match", /quick-auth-setup|quick-login|dashboard/);
  });

  it("OTP screen appears if required", () => {
    cy.visit("/login");

    // ✅ Mock OTP-required response
    cy.intercept("POST", "**/login", {
      statusCode: 200,
      body: {
        requireOTP: true
      }
    }).as("loginOTP");

    cy.get('input[type="email"]').type("demo@finly.app");
    cy.get('input[type="password"]').type("demo123");

    cy.contains("Sign In").click();

    cy.wait("@loginOTP");

    cy.contains("Verify OTP").should("exist");
    cy.get("#otp-0").should("exist");
  });

});