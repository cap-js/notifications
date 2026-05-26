const cds = require('@sap/cds')
module.exports = cds.service.impl(async function () {
  const alert = await cds.connect.to('notifications')

  this.on('submitOrder', async req => {
    const { book: bookId, quantity } = req.data

    const book = await SELECT.one.from('sap.capire.bookshop.Books').where({ ID: bookId })
    if (!book) return req.error(404, `Book ${bookId} not found`)
    if (book.stock < quantity) return req.error(400, `Not enough stock for book ${bookId}`)

    await UPDATE('sap.capire.bookshop.Books').set({ stock: book.stock - quantity }).where({ ID: bookId })

    await alert.notify('BookOrdered', {
      recipients: ['eric.peairs@sap.com'],
      data: { title: book.title, buyer: req.user.id }
    })
    return { stock: book.stock - quantity }
  })
})