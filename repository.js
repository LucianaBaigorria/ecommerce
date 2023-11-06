const { google} = require ("googleapis");

const OAuth2Client = new google.auth.OAuth2(
    "620686262535-gmotu6ve82apni7em4rbedj53bdc0dbn.apps.googleusercontent.com",
    "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",
    "http://localhost"
)

OAuth2Client.setCredentials({
    type: "authorized_user",
    client_id: "620686262535-gmotu6ve82apni7em4rbedj53bdc0dbn.apps.googleusercontent.com",
    client_secret: "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",
    refresh_token: "1//0h9__UndVy-sBCgYIARAAGBESNwF-L9Irfi0Gp1hJiH6lyDqvImYXWjNtm4dW0PXGRWnycTSYwEebuFj9ylARoDdc0AEuZOQAFbg"

});

const sheets = google.sheets({version: "v4", auth:OAuth2Client});

async function read(){

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId:'162rNKzErMwtXBRvoSqiITqiVC7Rin8O3stWkMh3ZgsU',
        range: 'Products!A2:F',
    });

    const rows = response.data.values;
    const products = rows.map((row) => ({
        id: +row[0],
        name: row[1],
        price: +row[2],
        image: row[3],
        stock: +row[4],
        category: row[5],
    }));
  
    return products;

}
async function write(products) {
    let values = products.map((p) => [p.id, p.name, p.price, p.image, p.stock, p.category]);
  
    const resource = {
      values,
    };
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: '162rNKzErMwtXBRvoSqiITqiVC7Rin8O3stWkMh3ZgsU',
      range: "Products!A2:F",
      valueInputOption: "RAW",
      resource,
    });
  
   // console.log(result.updatedCells);
}

async function writeOrders(orders) {
    let values = orders.map((order) => [
      order.date,
      order.preferenceId,
      order.shipping.name,
      order.shipping.email,
      JSON.stringify(order.items),
      JSON.stringify(order.shipping),
      order.status,
    ]);
  
    const resource = {
      values,
    };
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: '162rNKzErMwtXBRvoSqiITqiVC7Rin8O3stWkMh3ZgsU',
      range: "Orders!A2:G",
      valueInputOption: "RAW",
      resource,
    });
  }
  
  async function readOrders() {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '162rNKzErMwtXBRvoSqiITqiVC7Rin8O3stWkMh3ZgsU',
      range: "Orders!A2:G",
    });

    const rows = response.data.values || [];
    const orders = rows.map((row) => ({
      date: row[0],
      preferenceId: row[1],
      name: row[2],
      email: row[3],
      items: JSON.parse(row[4]),
      shipping: JSON.parse(row[5]),
      status: row[6],
    }));
  
    return orders;
  }
  
  async function updateOrderByPreferenceId(preferenceId, status) {
    const orders = await readOrders();
    const order = orders.find(o => o.preferenceId === preferenceId)
    order.status = status;
    await writeOrders(orders);
  }


/*async function readAndWrite() {
    const products = await read();
    products[0].stock = 20;
    await write(products);
}

readAndWrite();
*/
module.exports = {
    read,
    write,
    writeOrders,
    updateOrderByPreferenceId,
    readOrders,
  
};
  