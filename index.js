const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product");
const app = express();
const jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';
app.use(cors());
app.use(express.json());


app.post('/register', async (req, res) => {
    // let data = json(req.body.body);
    let user = new User(req.body.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    if (result) {
        jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (error, token) => {
            if (error) {
                res.send({ result: "something went wrong" });
            }
            res.send({ result: result, auth: token });
        });

    }else
    res.send({result:"something went wrong"});
});

app.post('/login', async (req, res) => {
    if (req.body.body.password && req.body.body.email) {
        let user = await User.findOne(req.body.body).select("-password");
        if (user) {
            jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (error, token) => {
                if (error) {
                    res.send({ result: "something went wrong" });
                }
                res.send({ result: user, auth: token });
            });

        } else {
            res.send({ result: 'user not found....' });
        }
    } else {
        res.send({ result: 'inter user email and password ' });
    }
});
app.post("/add-product", verifyToken, async (req, res) => {
    let product = new Product(req.body.data);
    let result = await product.save();
    res.send(result);

})
app.get("/products", verifyToken, async (req, res) => {
    let products = await Product.find();
    if (products.length > 0) {
        return res.send(products);
    } else {
        res.send({ result: "no result found" });
    }
})
app.delete("/product/:id", verifyToken, async (req, res) => {
    let result = await Product.deleteOne({ _id: req.params.id });
    if (result.acknowledged) {
        res.send({ result: 'item deleted successfully' });
    } else {
        res.send({ result: 'item not deleted successfully' });
    }
})
app.get("/product/:id", verifyToken, async (req, res) => {
    const result = await Product.findOne({ _id: req.params.id });
    if (result) {
        res.send(result);
    } else {
        res.send({ result: 'data not found' });
    }
});
app.put("/product/:id", verifyToken, async (req, res) => {
    const result = await Product.updateOne(
        {
            _id: req.params.id

        }, {
        $set: req.body.body,
    });
    if (result.acknowledged) {
        res.send({ result: 'data updated successfully' });
    } else {
        res.send({ result: 'data updated successfully' });
    }
});
app.get("/search/:key", verifyToken, async (req, res) => {
    Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
        ]
    }).then((result) => {
        res.send(result);
    }).catch(() => {
        res.send({ result: 'data not found' });
    });
});
function verifyToken(req, res, next) {
    let token = req.headers.authorization || req.body.headers.authorization;
    token = token && token.split(' ')[1];
    console.log(token);
    if (token) {
        jwt.verify(token, jwtKey, (error, success) => {
            if (error) {
                res.status(401).send({ result: "please send validate token" });
            }
            else {
                next();
            }
        });
    } else {
        res.status(403).send({ result: "please add a token" });
    }
}
app.listen(5000);