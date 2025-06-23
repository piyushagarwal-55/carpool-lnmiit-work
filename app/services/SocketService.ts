import { io, Socket } from "socket.io-client";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  rideId: string;
  senderPhoto?: string;
}

interface RideRequest {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rideId: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: Date;
}

class SocketService {
  private socket: Socket | null = null;
  private serverUrl = "http://localhost:3001"; // Replace with your server URL

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.serverUrl, {
      query: { userId },
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat functionality
  joinRideChat(rideId: string) {
    if (this.socket) {
      this.socket.emit("join_ride_chat", { rideId });
    }
  }

  leaveRideChat(rideId: string) {
    if (this.socket) {
      this.socket.emit("leave_ride_chat", { rideId });
    }
  }

  sendMessage(message: Omit<ChatMessage, "id" | "timestamp">) {
    if (this.socket) {
      this.socket.emit("send_message", message);
    }
  }

  onNewMessage(callback: (message: ChatMessage) => void) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off("new_message");
    }
  }

  // Ride request functionality
  sendRideRequest(
    rideRequest: Omit<RideRequest, "id" | "timestamp" | "status">
  ) {
    if (this.socket) {
      this.socket.emit("send_ride_request", rideRequest);
    }
  }

  acceptRideRequest(requestId: string) {
    if (this.socket) {
      this.socket.emit("accept_ride_request", { requestId });
    }
  }

  rejectRideRequest(requestId: string) {
    if (this.socket) {
      this.socket.emit("reject_ride_request", { requestId });
    }
  }

  onRideRequest(callback: (request: RideRequest) => void) {
    if (this.socket) {
      this.socket.on("ride_request", callback);
    }
  }

  onRideRequestResponse(
    callback: (response: {
      requestId: string;
      status: "accepted" | "rejected";
    }) => void
  ) {
    if (this.socket) {
      this.socket.on("ride_request_response", callback);
    }
  }

  offRideRequest() {
    if (this.socket) {
      this.socket.off("ride_request");
    }
  }

  offRideRequestResponse() {
    if (this.socket) {
      this.socket.off("ride_request_response");
    }
  }

  // Ride updates
  onRideUpdate(
    callback: (update: {
      rideId: string;
      availableSeats: number;
      passengers: any[];
    }) => void
  ) {
    if (this.socket) {
      this.socket.on("ride_update", callback);
    }
  }

  offRideUpdate() {
    if (this.socket) {
      this.socket.off("ride_update");
    }
  }
}

export const socketService = new SocketService();
export type { ChatMessage, RideRequest };

// Default export to fix the warning
export default SocketService;
