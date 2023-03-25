import { ApplicationService } from '@sap/cds'
import { IListOfBooks, IBooks, IActionSubmitOrderParams } from './types/CatalogService'

export class CatalogService extends ApplicationService { async init(){
  const db = await cds.connect.to('db')
  const { Books } = db.entities
  const { ListOfBooks } = this.entities

  // Reduce stock of ordered books if available stock suffices
  this.on ('submitOrder', async req => {
    const params = req.data as IActionSubmitOrderParams
    const {book,quantity} = params
    if (quantity < 1) return req.reject (400,`quantity has to be 1 or more`)
    let b = await SELECT `stock` .from (Books,book) as IBooks
    if (!b) return req.error (404,`Book #${book} doesn't exist`)
    let {stock} = b
    if (quantity > stock) return req.reject (409,`${quantity} exceeds stock for book #${book}`)
    await UPDATE (Books,book) .with ({ stock: stock -= quantity })
    await this.emit ('OrderedBook', { book, quantity, buyer:req.user.id })
    return { stock }
  })

  // Add some discount for overstocked books
  this.after ('READ', ListOfBooks, each => {
    const listOfBooks = each as IListOfBooks
    if (listOfBooks.stock > 111) listOfBooks.title += ` -- 11% discount!`
  })

  return super.init()
}}
