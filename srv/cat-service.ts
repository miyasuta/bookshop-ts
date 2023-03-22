import { Service } from '@sap/cds/apis/services'

export default (srv: Service) => {
//  const { Books } = cds.entities ('sap.capire.bookshop')
  const { Books, ListOfBooks } = srv.entities

  // Reduce stock of ordered books if available stock suffices
  srv.on ('submitOrder', async req => {
    const {book,quantity} = req.data
    if (quantity < 1) return req.reject (400,`quantity has to be 1 or more`)
    let b = await SELECT `stock` .from (Books,book)
    if (!b) return req.error (404,`Book #${book} doesn't exist`)
    let {stock} = b
    if (quantity > stock) return req.reject (409,`${quantity} exceeds stock for book #${book}`)
    await UPDATE (Books,book) .with ({ stock: stock -= quantity })
    await srv.emit ('OrderedBook', { book, quantity, buyer:req.user.id })
    return { stock }
  })

  // Add some discount for overstocked books
  srv.after ('READ', ListOfBooks, each => {
    if (each.stock > 111) each.title += ` -- 11% discount!`
  })
}
