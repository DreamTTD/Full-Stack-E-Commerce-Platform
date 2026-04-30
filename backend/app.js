
const express = require('express');
const app = express();

const products = [{ id:1, name:"Phone", price:500 }];

app.get('/products', (req,res)=> res.json(products));

app.listen(3000);
