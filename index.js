const express = require("express");
//const bodyParser = require("body-parser");
const repository = require("./repository");
const mercadopago = require("mercadopago");
const app = express();
const port = process.env.PORT || 3000;


mercadopago.configure({
    access_token: 
    'TEST-7175856941881122-110422-4f1180030fa16c67f4313dc9021f22cf-191410359',
});

/*app.use(bodyParser.urlencoded({ extended:true }));
//app.use(bodyParser.json());*/

app.use(express.json());

app.get("/api/products", async (req, res) => {
  res.send(await repository.read());
});

app.post("/api/pay", async (req, res) => {
    const order = req.body;
    const ids = order.items.map((p) => p.id);
    const productsCopy = await repository.read();
    /*const client = new MercadoPagoConfig({ 
        accessToken: 'TEST-7175856941881122-110422-4f1180030fa16c67f4313dc9021f22cf-191410359', 
        options: { timeout: 5000, idempotencyKey: 'abc' } })*/

    let preference = {
        items: [],
        back_urls: {
            success: "http://localhost:3000/feedback",
            failure: "http://localhost:3000/feedback",
            pending: "http://localhost:3000/feedback",
        },
        auto_return: "approved",
    }

    let error = false;
    ids.forEach((id) => {
        const product = productsCopy.find(p => p.id === id);
        if(product.stock > 0){
            product.stock --;
            preference.items.push({
                    title: product.name,
                    unit_price: product.price,
                    quantity: 1,
            });

        } else {
            error = true;
        }   
    });

    if (error){
        res.send("Sin stock").statusCode(400);
    } else{
        const response = await mercadopago.preferences.create(preference);
        const preferenceId = response.body.id;

        await repository.write(productsCopy);
        order.date = new Date().toISOString();
        order.preferenceId = preferenceId;
        order.status = "pending";
        const orders = await repository.readOrders();
        orders.push(order);
        await repository.writeOrders(orders);
        res.send({preferenceId});

    }
    
    });

app.get("/feedback", async (req, res) => {
    const payment = await mercadopago.payment.findById(req.query.payment_id);
    const merchantOrder = await mercadopago.merchant_orders.findById(payment.body.order.id);
    const preferenceId = merchantOrder.body.preference_id;
    const status = payment.body.status;
    await repository.updateOrderByPreferenceId(preferenceId, status);
  
    res.sendFile(require.resolve("./Front/index.html"));
  });


app.use("/", express.static("Front"));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});