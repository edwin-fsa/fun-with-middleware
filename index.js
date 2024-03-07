import express from "express";
import morgan from "morgan";

const myMiddleware = (req, res) => {
  console.log("Hello, from my middleware")
}

const app = express();

app.get("/hi", (req, res) => {
  res.send("Hi")
});

app.get("/bye", (req, res) => {
  res.send("Bye")
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
