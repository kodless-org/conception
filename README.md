# 6.1040 Social Media Starter Backend Code

## Getting Started

If you are using VSCode/VSCodium, install the ESLint and Prettier extensions.
The project is already configured to use ESLint and Prettier,
but feel free to add your own rules if you want.
Right now, the code is formatted on save; you can change this in `.vscode/settings.json`
by disabling `editor.formatOnSave`.

Run `npm install` to install dependencies.

## Creating MongoDb Atlas Instance
To run the server, you need to create a MongoDb Atlas instance and connect your project. Feel free to follow the instructions below or use these [slides](https://docs.google.com/presentation/d/1HJ4Lz1a2IH5oKu21fQGYgs8G2irtMqnVI9vWDheGfKM/edit?usp=sharing).
1. Create your [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account.
2. When selecting a template, choose the __free__ option, M0. 
3. At the Security Quickstart page, select how you want to authenticate your connection and keep the rest of the defaults.
4. Once created, click the __CONNECT__ button, select __driver__, and copy the srv connection string. If using username and password, the url should look something like this: `mongodb+srv://<username>:<password>@cluster0.p82ijqd.mongodb.net/?retryWrites=true&w=majority`. Make sure to replace username and password with your actual values.
5. Now go to your project files and create a new file at the root directory called `.env` (don't forget the 'dot' at the front). Add the line (without `<` and `>`)
    ```
    MONGO_SRV=<connection url>
    ```
    to the `.env` file. 

__Congrats!__ You're ready to run locally! Don't hesitate to reach out if you run into issues. 

## Running Locally

Run `npm start` to start the server and the testing client.
If you make changes to code, you need to manually restart the server.

Run `npm watch` to watch for changes and restart the server automatically.
Note that this is not recommended when actively developing;
use this when testing your code so your small changes get reflected in the server.

## Testing

There is a testing client under `public` directory.
Locate to `http://localhost:3000` (or a different port if you changed it) to see the testing client.
Add more operations to `public/util.ts` to test your server code.
Make sure to refresh the page after making changes to the client code.
Add some fancy CSS to make your page look nicer!

Keep in mind that we are using `MongoStore` for session management,
so your session will be persisted across server restarts.

## Deploying to Vercel

1. Fork this repo.
2. Create a new project on Vercel and link it to your GitHub project.
3. Under "Build & Development Settings", change "Output Directory" to `dist/public`.
4. Add the following environment variables to your Vercel project:
Key: `MONGO_SRV`, Value: `<your mongo connection string from .env file>`
5. Deploy!

## Understanding the Structure

The main entry point to the server is `api/index.ts`.
This is how the server is started and how the routes are registered.