const http = require("http");
const url = require("url");
const Busboy = require("busboy"); 
const path = require("path");
const os = require("os");
const fs = require("fs");

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    let [name, ...rest] = cookie.split("=");
    name = name?.trim();
    if (!name) return;
    const value = rest.join("=").trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

async function runMiddlewareChain(req, res, handlers) {
  let index = 0;
  async function next(err) {
    if (err) {
      console.error("Handler Error:", err);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
    if (index < handlers.length) {
      const handler = handlers[index++];
      try {
        await handler(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  }
  await next();
}

//  Router  
function createRouter() {
  const routes = [];

  return {
    isRouter: true, // Marker property instead of instanceof
    get: function (path, ...handlers) { routes.push({ method: "GET", path, handlers }); },
    post: function (path, ...handlers) { routes.push({ method: "POST", path, handlers }); },
    put: function (path, ...handlers) { routes.push({ method: "PUT", path, handlers }); },
    delete: function (path, ...handlers) { routes.push({ method: "DELETE", path, handlers }); },
    patch: function (path, ...handlers) { routes.push({ method: "PATCH", path, handlers }); },

    handle: async function (req, res, subPath) {
      const method = req.method.toUpperCase();

      for (const route of routes) {
        if (route.method === method && route.path === subPath) {
          await runMiddlewareChain(req, res, route.handlers);
          return true;
        }
      }
      return false;
    }
  };
}

function createHttpApp() {
  const middlewares = [];
  const routes = [];

  const app = {
    use: function (...args) {
      if (args.length === 1) {
        middlewares.push(args[0]);
      } else if (args.length === 2) {
        const [prefix, routerOrMiddleware] = args;
        routes.push({ prefix, handler: routerOrMiddleware });
      }
    },

    get: function (path, ...handlers) {
      routes.push({ prefix: path, method: "GET", handlers });
    },

    post: function (path, ...handlers) {
      routes.push({ prefix: path, method: "POST", handlers });
    },

    listen: function (port, callback) {
      const server = http.createServer(async (req, res) => {
        
        // 1. Request Utility Bindings (Express Style Compatibility)
        req.header = req.get = function (name) {
          if (!name) return undefined;
          const lc = name.toLowerCase();
          if (lc === 'referer' || lc === 'referrer') {
            return req.headers['referrer'] || req.headers['referer'];
          }
          return req.headers[lc];
        };

        req.cookies = parseCookies(req.headers.cookie);

        // 2. Response Utility Bindings
        res.status = function (code) {
          res.statusCode = code;
          return res;
        };

        res.json = function (data) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        };

        res.send = function (body) {
          if (typeof body === 'object') {
            return res.json(body);
          }
          res.setHeader("Content-Type", "text/html");
          res.end(body);
        };

        res.cookie = function (name, value, options = {}) {
          let cookieString = `${name}=${encodeURIComponent(value)}`;

          if (options.expires) cookieString += `; Expires=${options.expires.toUTCString()}`;
          if (options.maxAge) cookieString += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
          if (options.domain) cookieString += `; Domain=${options.domain}`;
          if (options.path) cookieString += `; Path=${options.path}`;
          if (options.secure) cookieString += `; Secure`;
          if (options.httpOnly) cookieString += `; HttpOnly`;
          if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;

          const existing = res.getHeader("Set-Cookie");
          if (existing) {
            if (Array.isArray(existing)) {
              res.setHeader("Set-Cookie", [...existing, cookieString]);
            } else {
              res.setHeader("Set-Cookie", [existing, cookieString]);
            }
          } else {
            res.setHeader("Set-Cookie", cookieString);
          }

          return res;
        };

        //   3. Cookie Clear Method (Required for Logout)
        res.clearCookie = function (name, options = {}) {
          return res.cookie(name, "", {
            ...options,
            expires: new Date(0),
            maxAge: 0,
          });
        };

        //   Request Parsing (Handling JSON Body & Files)
        const contentType = req.headers["content-type"] || "";

        if (contentType.includes("multipart/form-data")) {
          // Multipart Form-Data (Image/File Upload) Parsing
          req.body = {};
          req.files = {};

          await new Promise((resolve) => {
            try {
              const busboy = Busboy({ headers: req.headers });

              busboy.on("field", (fieldname, val) => {
                req.body[fieldname] = val;
              });

              busboy.on("file", (fieldname, file, info) => {
                const { filename, encoding, mimeType } = info;
                const saveTo = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
                const writeStream = fs.createWriteStream(saveTo);

                file.pipe(writeStream);

                req.files[fieldname] = {
                  name: filename,
                  tempFilePath: saveTo,
                  mimetype: mimeType,
                  size: 0,
                };
              });

              busboy.on("finish", () => resolve());
              req.pipe(busboy);
            } catch {
              resolve();
            }
          });
        } else {
          // Standard JSON Body Parsing
          let bodyData = "";
          await new Promise((resolve) => {
            req.on("data", (chunk) => (bodyData += chunk.toString()));
            req.on("end", () => {
              try {
                req.body = bodyData ? JSON.parse(bodyData) : {};
              } catch {
                req.body = {};
              }
              resolve();
            });
          });
        }

        const parsedUrl = url.parse(req.url, true);
        const reqPath = parsedUrl.pathname;
        req.query = parsedUrl.query;

        for (const middleware of middlewares) {
          if (typeof middleware === "function") {
            await new Promise((resolve) => {
              try {
                middleware(req, res, () => resolve());
              } catch {
                resolve();
              }
            });
          }
        }

        let handled = false;

        for (const route of routes) {
          if (route.method && route.prefix === reqPath) {
            await runMiddlewareChain(req, res, route.handlers);
            handled = true;
            break;
          }

          if (!route.method && reqPath.startsWith(route.prefix)) {
            const subPath = reqPath.replace(route.prefix, "") || "/";

            // Check using marker property instead of instanceof
            if (route.handler && route.handler.isRouter) {
              handled = await route.handler.handle(req, res, subPath);
              if (handled) break;
            }
          }
        }

        if (!handled && !res.writableEnded) {
          res.status(404).json({ success: false, message: "Route Not Found" });
        }
      });

      return server.listen(port, callback);
    },
  };

  return app;
}

createHttpApp.Router = function () {
  return createRouter();
};

createHttpApp.json = function () {
  return (req, res, next) => {
    if (typeof next === "function") next();
  };
};

module.exports = createHttpApp;