# Boba Bloom

A React prototype for a boba shop with a portal hub, manager dashboard, cashier screen, and customer kiosk. The cashier and kiosk support sample drink selection and an in-browser order summary; shop data is currently static.

## Source layout

- `src/pages/` contains one component per screen: portal, manager dashboard, cashier, and customer kiosk.
- `src/components/` contains shared interface components, including the header, drink menu, and order summary.
- `src/hooks/useOrder.js` contains the shared in-browser order state.
- `src/data/shop.js` contains the sample drinks and portal links.
- `src/App.jsx` handles portal-only in-app navigation and wraps each screen in the shared layout. Refreshing returns to the portal; screens are not restored from the URL.

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
