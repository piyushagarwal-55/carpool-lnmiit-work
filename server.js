const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Store active users and ride data
const activeUsers = new Map();
const rideChats = new Map();
const rideRequests = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user connection with userId
  socket.on("join", (data) => {
    const { userId } = data;
    activeUsers.set(socket.id, userId);
    socket.userId = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  // Handle joining ride chat
  socket.on("join_ride_chat", (data) => {
    const { rideId } = data;
    socket.join(`ride_${rideId}`);
    console.log(`User ${socket.userId} joined ride chat: ${rideId}`);
  });

  // Handle leaving ride chat
  socket.on("leave_ride_chat", (data) => {
    const { rideId } = data;
    socket.leave(`ride_${rideId}`);
    console.log(`User ${socket.userId} left ride chat: ${rideId}`);
  });

  // Handle sending messages
  socket.on("send_message", (messageData) => {
    const message = {
      id: Date.now().toString(),
      ...messageData,
      timestamp: new Date(),
    };

    // Store message in ride chat
    if (!rideChats.has(messageData.rideId)) {
      rideChats.set(messageData.rideId, []);
    }
    rideChats.get(messageData.rideId).push(message);

    // Broadcast to all users in the ride chat
    io.to(`ride_${messageData.rideId}`).emit("new_message", message);
    console.log(`Message sent in ride ${messageData.rideId}:`, message.message);
  });

  // Handle ride requests
  socket.on("send_ride_request", (requestData) => {
    const request = {
      id: Date.now().toString(),
      ...requestData,
      status: "pending",
      timestamp: new Date(),
    };

    // Store request
    if (!rideRequests.has(requestData.rideId)) {
      rideRequests.set(requestData.rideId, []);
    }
    rideRequests.get(requestData.rideId).push(request);

    // Send to ride owner (broadcast to ride chat for now)
    socket.to(`ride_${requestData.rideId}`).emit("ride_request", request);
    console.log(`Ride request sent for ride ${requestData.rideId}:`, request);
  });

  // Handle accepting ride requests
  socket.on("accept_ride_request", (data) => {
    const { requestId } = data;

    // Find and update request
    for (const [rideId, requests] of rideRequests.entries()) {
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        request.status = "accepted";

        // Notify requester
        io.emit("ride_request_response", {
          requestId,
          status: "accepted",
          rideId,
        });

        // Update ride data (decrease available seats)
        io.to(`ride_${rideId}`).emit("ride_update", {
          rideId,
          availableSeats: 2, // This should be calculated properly
          passengers: [], // This should include the new passenger
        });

        console.log(`Ride request ${requestId} accepted`);
        break;
      }
    }
  });

  // Handle rejecting ride requests
  socket.on("reject_ride_request", (data) => {
    const { requestId } = data;

    // Find and update request
    for (const [rideId, requests] of rideRequests.entries()) {
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        request.status = "rejected";

        // Notify requester
        io.emit("ride_request_response", {
          requestId,
          status: "rejected",
          rideId,
        });

        console.log(`Ride request ${requestId} rejected`);
        break;
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userId = activeUsers.get(socket.id);
    activeUsers.delete(socket.id);
    console.log(`User ${userId} disconnected`);
  });
});

// API endpoint to get ride messages
app.get("/api/rides/:rideId/messages", (req, res) => {
  const { rideId } = req.params;
  const messages = rideChats.get(rideId) || [];
  res.json(messages);
});

// API endpoint to get ride requests
app.get("/api/rides/:rideId/requests", (req, res) => {
  const { rideId } = req.params;
  const requests = rideRequests.get(rideId) || [];
  res.json(requests);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Chat server ready for LNMIIT Carpool app`);
});
