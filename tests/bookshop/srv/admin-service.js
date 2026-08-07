const cds = require("@sap/cds")
module.exports = cds.service.impl(async function () {
  this.on("resetStock", async () => {
    const db = await cds.connect.to("db")
    const SEED_STOCK = [
      [201, 12],
      [207, 11],
      [251, 333],
      [252, 555],
      [271, 22]
    ]
    for (const [id, stock] of SEED_STOCK) {
      await db.run(`UPDATE SAP_CAPIRE_BOOKSHOP_BOOKS SET STOCK = ${stock} WHERE ID = ${id}`)
    }
    return { message: "Stock reset" }
  })
})
