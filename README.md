# Boba Bloom

A React prototype for a boba shop with a portal hub, manager dashboard, cashier screen, and customer kiosk. The cashier and kiosk support sample drink selection and an in-browser order summary; shop data is currently static.

## Run locally

```sh
npm install
npm run dev
```

For a production build and Express server:

```sh
npm run build
npm start
```

The Express server serves the built app and provides `GET /api/health`. To deploy on Render, use `npm install && npm run build` as the build command and `npm start` as the start command. Database credentials and PostgreSQL integration are not included in this UI prototype.
