# Pearl Garden

A React prototype for a boba shop with a portal hub, manager dashboard, cashier screen, and customer kiosk. The customer kiosk supports guest checkout and optional Google sign-in for order history.

## Source layout

- `src/pages/` contains one component per screen: portal, manager dashboard, cashier, and customer kiosk.
- `src/components/` contains shared interface components, including the header, drink menu, and order summary.
- `src/hooks/useOrder.js` contains the shared in-browser order state.
- `src/data/shop.js` contains the sample drinks and portal links.
- `src/App.jsx` handles portal-only in-app navigation and wraps each screen in the shared layout. Refreshing returns to the portal; screens are not restored from the URL.

## Optional customer sign-in

The customer kiosk keeps guest checkout available. Customers may optionally use Google sign-in to link new kiosk orders to their account and view those orders in **My orders**. Existing guest orders are not linked, and reward points are not currently included. Customer order links are stored in the `customer_order_links` table, which the server creates at startup.

To enable Google sign-in:

1. Create a Google OAuth client ID for a **Web application** and add the local and deployed site origins to its authorized JavaScript origins (for local Vite development, `http://localhost:5173`).
2. Put the client ID in `.env` for both the browser and server, and set a random session secret of at least 32 characters:

   ```dotenv
   GOOGLE_CLIENT_ID=your-client-id
   VITE_GOOGLE_CLIENT_ID=your-client-id
   SESSION_SECRET=replace-with-a-random-secret-at-least-32-characters
   ```

   `SESSION_SECRET` is server-only; do not prefix it with `VITE_`. The server sets a signed, HTTP-only session cookie that expires after 30 minutes. Google sign-in is unavailable until both client ID settings and the session secret are configured; guest checkout remains available.

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

The Express server serves the built app and provides the kiosk and manager APIs, which require the configured PostgreSQL database. The customer order-link table is created at server startup. To deploy on Render, use `npm install && npm run build` as the build command and `npm start` as the start command; provide the Google environment variables during the build and runtime.
