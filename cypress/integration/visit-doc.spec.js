describe('doc', () => {
  it('should visit homepage', () => {
    cy.visit('/')
  })
  it('should visit guides', () => {
    cy.visit('/guides/')
  })
  it('should visit doc/doc', () => {
    cy.visit('/doc/doc')
  })
})
