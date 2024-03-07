# Middleware
This repo is a simple demonstration of [express middleware](https://expressjs.com/en/guide/using-middleware.html)

## Set up
To begin using this repo, install dependencies and run the dev server:
```
npm i
npm run start:dev
```

You should now be able to open http://localhost:3000 in your browser, which will show `Cannot GET /`. If, however, you
visit `http://localhost:3000/hi` or `http://localhot:3000/bye`, you should be greeted with unsurprising messages.

## Introduction
At the heart of it all, middleware is just a function that takes 3 arguments;
- the request
- the response
- function to continue processing other middleware (next)

Once you've defined middleware, you can chose to either use them for *every* request that hits your server, or
only specific routes. 

## Morgan
[Morgan](https://www.npmjs.com/package/morgan) is middleware that adds useful logging to each request.
If you look at the terminal where your server is running as you hit the `/`, `/hi`, and `/bye` routes, you
undoubtedly noticed a distinct absense of useful logs. 

We can enable `morgan` for all routes by "using" it. Try making the following change to `index.js`:

```diff
diff --git a/index.js b/index.js
index 8fe2a6a..5e348f9 100644
--- a/index.js
+++ b/index.js
@@ -9,6 +9,7 @@ const myMiddleware = (req, res, next) => {
 
 // our express app
 const app = express();
+app.use(morgan());
 
 app.get("/hi", (req, res) => {
   res.send("Hi")
```

If you try hitting your `/hi` and /bye` endpoints (and even `/`), you should now see some useful logs. Something like the following:
```shell
::1 - - [Thu, 07 Mar 2024 22:16:32 GMT] "GET / HTTP/1.1" 404 139 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
::1 - - [Thu, 07 Mar 2024 22:16:37 GMT] "GET /hi HTTP/1.1" 200 2 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
::1 - - [Thu, 07 Mar 2024 22:16:37 GMT] "GET /favicon.ico HTTP/1.1" 404 150 "http://localhost:3000/hi" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
```

Informative, but perhaps a bit messy, right? We can pass arguments to the morgan middleware to clean that up, though:
```diff
diff --git a/index.js b/index.js
index 8fe2a6a..35f469f 100644
--- a/index.js
+++ b/index.js
@@ -9,6 +9,7 @@ const myMiddleware = (req, res, next) => {
 
 // our express app
 const app = express();
+app.use(morgan("dev"));
 
 app.get("/hi", (req, res) => {
   res.send("Hi")
```

Now the logs should be easier to read:
```shell
GET /hi 304 2.256 ms - -
GET /bye 200 0.457 ms - 3
```

Being able to configure the middleware is precisely why morgan takes arguments. If that doesn't make sense yet,
hopefully it'll be clearer when we talk about custom middleware.

What's important for now, though is the following:
- we use `app.use` here because we want *all* requests to be logged in this pretty format
- morgan is a function that can take and argument and *returns* middleware

## Custom Middleware
If you look at lines 5-7, we have custom middleware defined:
```javascript
const myMiddleware = (req, res, next) => {
  console.log("Hello, from my middleware")
  next();
}
```

All this dones, when active, is log a message to the screen when it's processed. 

### Global middlewaree
Processed? Yes, we have to tell express *when* to use middleware. Just like with morgan, we can use `app.use` to 
enable our middleware for all requests:
```diff
diff --git a/index.js b/index.js
index 35f469f..c8a4354 100644
--- a/index.js
+++ b/index.js
@@ -10,6 +10,7 @@ const myMiddleware = (req, res, next) => {
 // our express app
 const app = express();
 app.use(morgan("dev"));
+app.use(myMiddleware);
 
 app.get("/hi", (req, res) => {
   res.send("Hi")
```
*Unlike morgan, our middleware doesn't take options. That is, instead of being a function that _returns_ a function (does your head hurt yet?),
it's just a function. That's why we don't have to write `app.use(myMiddleware())`. 

Anyway, if you visit any of the routes (including ones that don't exist, like say `/hola`, you should now see `Hello, from my middleware` before the typical
log lines in your terminal. 

### Per-route middleware
What if you only want to run this middleware on specific requests? Well, we can just add another argument to
your route handlers when you want to use a given middleware. If we only wanted to see the message when
visiting `/bye`, for instance, we would do this instead:
```diff
diff --git a/index.js b/index.js
index c8a4354..0552c26 100644
--- a/index.js
+++ b/index.js
@@ -10,13 +10,12 @@ const myMiddleware = (req, res, next) => {
 // our express app
 const app = express();
 app.use(morgan("dev"));
-app.use(myMiddleware);
 
 app.get("/hi", (req, res) => {
   res.send("Hi")
 });
 
-app.get("/bye", (req, res) => {
+app.get("/bye", myMiddleware, (req, res) => {
   res.send("Bye")
 });
```

Now, you should only see the custom log message when visiting `/bye`, but not `/hi` or any other route.

### Bonus: Customizable middleware
What if you *did* want to make your middleware customizable like `morgan`? Well, you'd need to, instead of writing
a function, write a function that returns a function. 

Um...huh?

Let's work through it together. Instead of console logging anything, we want to log whatever message was passed 
into our custom middleware. We'll convert our function that console logs into a function that takes a name and returns a 
function that console logs using that name. We'll also give it a default argument so that people can use
our middleware without passing arguments:
```diff
diff --git a/index.js b/index.js
index 0552c26..13e7022 100644
--- a/index.js
+++ b/index.js
@@ -2,8 +2,8 @@ import express from "express";
 import morgan from "morgan";
 
 // middleware that just console logs stuff
-const myMiddleware = (req, res, next) => {
-  console.log("Hello, from my middleware")
+const myMiddleware = (name = "World") => (req, res, next) => {
+  console.log(`Hello, ${name}`);
   next();
 }
 
@@ -15,7 +15,7 @@ app.get("/hi", (req, res) => {
   res.send("Hi")
 });
 
-app.get("/bye", myMiddleware, (req, res) => {
+app.get("/bye", myMiddleware(), (req, res) => {
   res.send("Bye")
 });
```

Now, if you visit `/bye`, you should see "Hello, World!" in your terminal! Finally, let's make things interesting
and add our middleware to the `/hi` route, but pass an argument this time:
```diff
diff --git a/index.js b/index.js
index 13e7022..768d358 100644
--- a/index.js
+++ b/index.js
@@ -11,7 +11,7 @@ const myMiddleware = (name = "World") => (req, res, next) => {
 const app = express();
 app.use(morgan("dev"));
 
-app.get("/hi", (req, res) => {
+app.get("/hi", myMiddleware("Universe"), (req, res) => {
   res.send("Hi")
 });
```

Now, when you visit `/hi`, you should see "Hello, Universe", while `/bye` still shows "Hello, World", and any other route
shows nothing at all. 

### What is custom middleware good for?
So our middleware is kinda cool, but pretty useless. One think you can do with custom middleware is take 
advantage of the `req`uest option to inspect the Authorization header that you receive from clients (like a react app),
then use that to either process the request as normal if there aren't any problems (`next()`), or return an error message
telling them they are not authorized (403). 

I won't be demonstrating how to do that in this repo as it's out of scope.

## Conclusion
Hopefully, this repo helped you get a better understanding of express middleware, namely:
- what they are
- how to use them across the entire app and on specific routes
- and how to make them customizable

If the idea of writing functions that return functions is still blowing your mind, try googling some of the following terms (these are deep dives, so be warned, what you find will be very technical):
- [higher-order functions](https://www.google.com/search?q=higher+order+functions&rlz=1C5GCEM_en&oq=higher+order+functions&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCDI4MzlqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8)
- [factory functions](https://www.google.com/search?q=factory+function&sca_esv=7fb4d62672696752&rlz=1C5GCEM_en&sxsrf=ACQVn09nF57muOpeZUsk2X9AzfTvFFyeJA%3A1709851146653&ei=CkLqZdK2J7eF0PEP-8KsuAQ&ved=0ahUKEwjS49vxm-OEAxW3AjQIHXshC0cQ4dUDCBE&uact=5&oq=factory+function&gs_lp=Egxnd3Mtd2l6LXNlcnAiEGZhY3RvcnkgZnVuY3Rpb24yCxAAGIAEGIoFGJECMgsQABiABBiKBRiRAjILEAAYgAQYigUYkQIyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAESLMTUIQFWNMRcAJ4AZABAJgBUKABkAWqAQE5uAEDyAEA-AEBmAILoALBBcICChAAGEcY1gQYsAPCAggQABgWGB4YD8ICBhAAGBYYHsICCxAAGIAEGIoFGIYDmAMAiAYBkAYIkgcCMTGgB-o8&sclient=gws-wiz-serp) (though in this case, what we have is a middleware factory -- the object returned is itself a function)
- [decorator pattern](https://www.google.com/search?q=decorator+pattern&rlz=1C5GCEM_en&oq=decorator+pattern&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCDE3OTNqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8) (here, we're decorating our middleware with a custom name) 
