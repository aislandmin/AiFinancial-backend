const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const app = express();
const jsonParser = bodyParser.json();
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const getFile = (url) => {
  return new Promise((resolve, reject) => {
    fs.readFile(url, "utf-8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
};

app.post("/login", jsonParser, async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    await client.connect();
    const db = client.db("AiFinancial");
    const collection = db.collection("users");
    const matchRes = await collection.find({ Name: username }).toArray();
    let data = null;
    console.log("get matchRes: ", matchRes);
    if (matchRes.length == 0) {
      console.log("matchRes.length == 0");
      data = await getFile("./mock/login_notexist.json");
    } else {
      if (matchRes[0].Password !== password) {
        console.log("matchRes[0].password !== password!");
        data = await getFile("./mock/login_fail.json");
      } else {
        data = await getFile("./mock/login.json");
        console.log("login sucessfully!");
      }
    }
    res.json(JSON.parse(data));
  } finally {
    await client.close();
  }
});

app.post("/signup", jsonParser, async (req, res) => {
  try {
    const userData = req.body.userData;
    const username = userData.Name;
    await client.connect();
    const db = client.db("AiFinancial");
    const collection = db.collection("users");
    const matchRes = await collection.find({ Name: username }).toArray();
    if (matchRes.length !== 0) {
      const data = await getFile("./mock/signup_fail.json");
      res.json(JSON.parse(data));
    } else {
      await collection.insertOne(userData);
      const data = await getFile("./mock/signup.json");
      res.json(JSON.parse(data));
    }
  } finally {
    await client.close();
  }
});

app.post("/api/products", jsonParser, async (req, res) => {
  try {
    await client.connect();
    const db = client.db("AiFinancial");
    const collection = db.collection("products");
    const matchRes = await collection.find({}).toArray();
    console.log("get products successfully! ");
    res.json(matchRes);
  } finally {
    await client.close();
  }
});

app.post("/api/transactions", jsonParser, async (req, res) => {
  try {
    const productCode = req.body.code;
    await client.connect();
    const db = client.db("AiFinancial");
    const collection = db.collection("transactions");
    const matchRes = await collection.find({ Code: productCode }).toArray();
    console.log("get transactions successfully! ");
    res.json(matchRes);
  } finally {
    await client.close();
  }
});

app.post("/api/product/update", jsonParser, async (req, res) => {
  try {
    const productCode = req.body.code;
    const updateProductObj = req.body.updateProductObj;
    // console.log("/api/product/update: ", productCode, " ", updateProductObj);
    await client.connect();
    const db = client.db("AiFinancial");
    const collection = db.collection("products");
    const result = await collection.updateOne(
      { Code: productCode },
      { $set: updateProductObj },
      { upsert: true }
    );
    console.log(
      `/api/product/update ${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
    );

    const data = await getFile("./mock/update.json");
    res.json(JSON.parse(data));
  } finally {
    await client.close();
  }
});

app.post("/api/product/new", jsonParser, async (req, res) => {
  try {
    const productCode = req.body.code;
    const updateProductObj = req.body.updateProductObj;
    console.log("/api/product/new: ", productCode, " ", updateProductObj);
    await client.connect();
    const db = client.db("AiFinancial");
    const collection = db.collection("products");
    const matchRes = await collection.find({ Code: productCode }).toArray();
    if (matchRes.length > 0) {
      const data = await getFile("./mock/newFailforRepeat.json");
      res.json(JSON.parse(data));
    } else {
      const result = await collection.insertOne(updateProductObj);
      console.log(
        `/api/product/update ${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
      );

      const data = await getFile("./mock/new.json");
      res.json(JSON.parse(data));
    }
  } finally {
    await client.close();
  }
});

app.post("/resetpassword", jsonParser, async (req, res) => {
  try {
    const { password: newPassword, email } = req.body;
    await client.connect();
    const db = client.db("AiFinancial");
    const collection = db.collection("users");

    const result = await collection.updateOne(
      { Email: email },
      { $set: { Password: newPassword } },
      { upsert: true }
    );
    console.log(
      `resetpassword ${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
    );

    const data = await getFile("./mock/resetPw.json");
    res.json(JSON.parse(data));
  } finally {
    await client.close();
  }
});

app.post("/api/product/delete", jsonParser, async (req, res) => {
  try {
    const productCode = req.body.code;
    await client.connect();
    const db = client.db("AiFinancial");
    const collection = db.collection("products");
    const result = await collection.deleteOne({ Code: productCode });

    if (result.deletedCount === 1) {
      console.log("Successfully deleted one document.");
    } else {
      console.log("No documents matched the query. Deleted 0 documents.");
    }

    const data = await getFile("./mock/delete.json");
    res.json(JSON.parse(data));
  } finally {
    await client.close();
  }
});

app.listen(3333, () => {
  console.log("listening at http://localhost:3333");
});
