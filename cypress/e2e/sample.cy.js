describe("App Load", () => {
  it("should load homepage", () => {
    cy.visit("/");
    cy.contains("Finly"); // change based on your UI
  });
});