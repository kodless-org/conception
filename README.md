# 6.1040 Social Media Starter Backend Code

## Getting Started

If you are using VSCode/VSCodium, install the ESLint and Prettier extensions.
The project is already configured to use ESLint and Prettier,
but feel free to add your own rules if you want.
Right now, the code is formatted on save; you can change this in `.vscode/settings.json`
by disabling `editor.formatOnSave`.

Run `npm install` to install dependencies.

## Creating MongoDb Atlas Instance
To run the server, you need to create a MongoDb Atlas instance.
TODO: create account, project and .env file, add
```
MONGO_SRV=<connection url>
```
to the `.env` file.

## Running Locally

Run `npm start` to start the server and the testing client.
If you make changes to code, you need to manually restart the server.

Run `npm watch` to watch for changes and restart the server automatically.
Note that this is not recommended when actively developing;
use this when testing your code so your small changes get reflected in the server.

## Testing

There is a testing client under `public` directory.
Add more operations to `public/util.ts` to test your server code.
Make sure to refresh the page after making changes to the client code.
Add some fancy CSS to make your page look nicer!

Keep in mind that we are using `MongoStore` for session management,
so your session will be persisted across server restarts.

## Deploying to Vercel

1. Fork this repo.
2. Create a new project on Vercel and link it to your GitHub project.
3. Under "Build & Development Settings", change "Output Directory" to `dist/public`.
4. Add the following environment variables to your Vercel project: Key: `MONGO_SRV`, Value: `<your mongo connection string from .env file>`
5. Deploy!