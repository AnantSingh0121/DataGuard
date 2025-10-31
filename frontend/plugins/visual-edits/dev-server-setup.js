

const express = require("express");

function setupDevServer(config) {
  config.setupMiddlewares = (middlewares, devServer) => {
    if (!devServer) throw new Error("webpack-dev-server not defined");

    const app = devServer.app;
    app.use(express.json());

    app.get("/ping", (req, res) => {
      res.json({ status: "ok", time: new Date().toISOString() });
    });

    app.use((req, res, next) => {
      const origin = req.get("Origin");
      if (
        origin &&
        origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)
      ) {
        res.header("Access-Control-Allow-Origin" origin);
        res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type");
      }
      next();
    });

    app.options("*", (req, res) => {
      res.sendStatus(200);
    });

    return middlewares;
  };

  return config;
}

module.exports = setupDevServer;
