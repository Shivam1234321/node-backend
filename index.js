const express = require("express");
const cors = require('cors');
require('./db/config');
const User = require('./db/User');
const Product = require('./db/Product');
const app = express();
const jwt= require("jsonwebtoken");

const jwtKey= "jwt-key";

app.use(express.json());
app.use(cors());

app.listen(3030);

app.post('/register', async (req, res) => {
    let user = new User(req.body);
    let result = await user.save();
    result= result.toObject();
    delete result.password;
    jwt.sign({result}, jwtKey, {expiresIn: "2h"}, (err, token) =>{
        if(err){    
            res.send({status: false, message: "Please try again."});
        }else{
            res.send({ 'status': true, 'data': result, auth: token });
        }
    });
    
})

app.post('/login', async (req, res) => {
    if (req.body.email && req.body.password) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            jwt.sign({user}, jwtKey, {expiresIn: "2h"}, (err, token) =>{
                if(err){    
                    res.send({status: false, message: "Please try again."});
                }else{
                    res.send({user, auth: token});
                }
            });
            
        } else {
            res.send({status: false, message: "User not found."});
        }
    } else {
        res.send({status: false, message: "All field required."});
    }
});

app.post('/add-product', async (req, res) =>{
    let product= new Product(req.body);
    let result= await product.save();
    res.send(result);
})

app.get('/products', async (req, res) =>{
    let products= await Product.find({});
    if(products.length){
        res.send(products);
    }else{
        res.send({status: false, message: "Product not found."});
    }
})

app.delete('/product/:id', async (req, res) =>{
    try{
        let result= await Product.deleteOne({_id: req.params.id});
        res.send(result);
    }catch(err){
        res.send({status: false, message: "Product not found."});
    }
});

app.get('/product/:id', async (req, res) =>{
    try{
        let product= await Product.findOne({_id: req.params.id});
        res.send(product);
    }catch(err){
        res.send({status: false, message: "Product not found."});
    }
});

app.put('/product/:id', async (req, res) =>{
    try{
        let product= await Product.updateOne({_id: req.params.id},{$set: req.body});
        res.send(product);
    }catch(err){
        res.send({status: false, message: "Product not found."});
    }
});

app.get('/search/:key', varifyToken, async (req, res)=>{
    let result= await Product.find({
        '$or':[
            {name: {"$regex": req.params.key}},
            {company: {"$regex": req.params.key}},
            {category: {"$regex": req.params.key}}
        ]
    });
    res.send(result);
});

function varifyToken(req, res, next){
    let token= req.headers['authorization'];
    if(token){
        token= token.split("bearer")[1];
        token= token.trim();
        jwt.verify(token, jwtKey, (err, success) =>{
            if(err){
                res.send({status: false, message: "Please send valid token."});
            }else{
                next();
            }
        });
    }else{
        res.send({status: false, message: "Please send a token."});
    }
}
