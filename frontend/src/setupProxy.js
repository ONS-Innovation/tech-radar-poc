/**
 * Sets up a proxy middleware for the application.
 *
 * This function configures a proxy for the application to forward requests
 * from the frontend to the backend server. It targets the backend server
 * running on http://localhost:5001, changes the origin of the request, and
 * rewrites the path to remove the /api prefix.
 *
 * @param {Object} app - The application instance.
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: process.env.BACKEND_URL || "http://localhost:5001",
      changeOrigin: true,
      pathRewrite: {
        "^/api": "/", // remove /api prefix when forwarding to backend
      },
    })
  );
};
