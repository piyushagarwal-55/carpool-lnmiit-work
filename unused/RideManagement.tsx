import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Search,
  Plus,
  ChevronRight,
  Navigation,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Ride = {
  id: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  price: number;
  driverName: string;
  driverRating: number;
  driverAvatar: string;
  status?: "active" | "completed" | "cancelled";
};

type RideManagementProps = {
  userRole?: "driver" | "passenger";
  onRideSelect?: (ride: Ride) => void;
  onRidePost?: (
    rideDetails: Omit<
      Ride,
      "id" | "driverName" | "driverRating" | "driverAvatar"
    >,
  ) => void;
  isDarkMode?: boolean;
};

export default function RideManagement({
  userRole = "passenger",
  onRideSelect = () => {},
  onRidePost = () => {},
  isDarkMode = false,
}: RideManagementProps) {
  const [activeTab, setActiveTab] = useState<"find" | "post" | "my">(
    userRole === "driver" ? "post" : "find",
  );

  const [rideDetails, setRideDetails] = useState({
    origin: "",
    destination: "",
    date: "",
    time: "",
    seats: "1",
    price: "50",
  });

  const [searchFilters, setSearchFilters] = useState({
    origin: "",
    destination: "",
    date: "",
  });

  // Mock data for available rides
  const availableRides: Ride[] = [
    {
      id: "1",
      origin: "LNMIIT Campus",
      destination: "Jaipur Railway Station",
      date: "2023-06-15",
      time: "14:30",
      seats: 3,
      price: 120,
      driverName: "Rahul Sharma",
      driverRating: 4.8,
      driverAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
    },
    {
      id: "2",
      origin: "LNMIIT Campus",
      destination: "World Trade Park",
      date: "2023-06-15",
      time: "16:00",
      seats: 2,
      price: 150,
      driverName: "Priya Patel",
      driverRating: 4.5,
      driverAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    },
    {
      id: "3",
      origin: "Pink Square Mall",
      destination: "LNMIIT Campus",
      date: "2023-06-16",
      time: "18:30",
      seats: 4,
      price: 130,
      driverName: "Amit Kumar",
      driverRating: 4.9,
      driverAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amit",
    },
  ];

  // Mock data for my rides
  const myRides: Ride[] = [
    {
      id: "4",
      origin: "LNMIIT Campus",
      destination: "Jaipur Airport",
      date: "2023-06-18",
      time: "09:00",
      seats: 2,
      price: 200,
      driverName: "Self",
      driverRating: 0,
      driverAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=self",
      status: "active",
    },
    {
      id: "5",
      origin: "Gaurav Tower",
      destination: "LNMIIT Campus",
      date: "2023-06-10",
      time: "19:30",
      seats: 3,
      price: 140,
      driverName: "Vikram Singh",
      driverRating: 4.7,
      driverAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=vikram",
      status: "completed",
    },
  ];

  const handlePostRide = () => {
    const newRide = {
      origin: rideDetails.origin,
      destination: rideDetails.destination,
      date: rideDetails.date,
      time: rideDetails.time,
      seats: parseInt(rideDetails.seats),
      price: parseInt(rideDetails.price),
    };
    onRidePost(newRide);
    // Reset form or show confirmation
    alert("Ride posted successfully!");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "find":
        return (
          <View className="bg-white p-4 rounded-lg">
            <Text className="text-lg font-bold mb-4">Find a Ride</Text>

            <View className="mb-4">
              <Text className="text-sm font-medium mb-1">From</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                <MapPin size={20} color="#4F46E5" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="Origin"
                  value={searchFilters.origin}
                  onChangeText={(text) =>
                    setSearchFilters({ ...searchFilters, origin: text })
                  }
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium mb-1">To</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                <MapPin size={20} color="#4F46E5" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="Destination"
                  value={searchFilters.destination}
                  onChangeText={(text) =>
                    setSearchFilters({ ...searchFilters, destination: text })
                  }
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium mb-1">Date</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                <Calendar size={20} color="#4F46E5" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="YYYY-MM-DD"
                  value={searchFilters.date}
                  onChangeText={(text) =>
                    setSearchFilters({ ...searchFilters, date: text })
                  }
                />
              </View>
            </View>

            <TouchableOpacity
              className="bg-indigo-600 py-3 rounded-lg items-center mb-6"
              onPress={() =>
                console.log("Searching rides with filters:", searchFilters)
              }
            >
              <Text className="text-white font-semibold">Search Rides</Text>
            </TouchableOpacity>

            <Text className="text-lg font-bold mb-4">Available Rides</Text>

            {availableRides.map((ride) => (
              <TouchableOpacity
                key={ride.id}
                className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50"
                onPress={() => onRideSelect(ride)}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-bold text-base">
                    {ride.origin} → {ride.destination}
                  </Text>
                  <Text className="font-bold text-indigo-600">
                    ₹{ride.price}
                  </Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-1 mr-3">{ride.date}</Text>
                  <Clock size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-1">{ride.time}</Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: ride.driverAvatar }}
                      className="w-8 h-8 rounded-full"
                    />
                    <View className="ml-2">
                      <Text className="font-medium">{ride.driverName}</Text>
                      <View className="flex-row items-center">
                        <Text className="text-yellow-500">★</Text>
                        <Text className="text-sm text-gray-600">
                          {ride.driverRating}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Users size={16} color="#6B7280" />
                    <Text className="text-gray-600 ml-1">
                      {ride.seats} seats left
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "post":
        return (
          <View className="bg-white p-4 rounded-lg">
            <Text className="text-lg font-bold mb-4">Post a Ride</Text>

            <View className="mb-4">
              <Text className="text-sm font-medium mb-1">From</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                <MapPin size={20} color="#4F46E5" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="Origin"
                  value={rideDetails.origin}
                  onChangeText={(text) =>
                    setRideDetails({ ...rideDetails, origin: text })
                  }
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium mb-1">To</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                <MapPin size={20} color="#4F46E5" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="Destination"
                  value={rideDetails.destination}
                  onChangeText={(text) =>
                    setRideDetails({ ...rideDetails, destination: text })
                  }
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium mb-1">Date</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                <Calendar size={20} color="#4F46E5" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="YYYY-MM-DD"
                  value={rideDetails.date}
                  onChangeText={(text) =>
                    setRideDetails({ ...rideDetails, date: text })
                  }
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium mb-1">Time</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                <Clock size={20} color="#4F46E5" />
                <TextInput
                  className="flex-1 ml-2"
                  placeholder="HH:MM"
                  value={rideDetails.time}
                  onChangeText={(text) =>
                    setRideDetails({ ...rideDetails, time: text })
                  }
                />
              </View>
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-medium mb-1">
                  Available Seats
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                  <Users size={20} color="#4F46E5" />
                  <TextInput
                    className="flex-1 ml-2"
                    placeholder="Seats"
                    keyboardType="numeric"
                    value={rideDetails.seats}
                    onChangeText={(text) =>
                      setRideDetails({ ...rideDetails, seats: text })
                    }
                  />
                </View>
              </View>

              <View className="flex-1 ml-2">
                <Text className="text-sm font-medium mb-1">
                  Price per Seat (₹)
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg p-2">
                  <Text className="text-gray-500 font-bold">₹</Text>
                  <TextInput
                    className="flex-1 ml-2"
                    placeholder="Price"
                    keyboardType="numeric"
                    value={rideDetails.price}
                    onChangeText={(text) =>
                      setRideDetails({ ...rideDetails, price: text })
                    }
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="bg-indigo-600 py-3 rounded-lg items-center"
              onPress={handlePostRide}
            >
              <Text className="text-white font-semibold">Post Ride</Text>
            </TouchableOpacity>
          </View>
        );

      case "my":
        return (
          <View className="bg-white p-4 rounded-lg">
            <Text className="text-lg font-bold mb-4">My Rides</Text>

            <View className="mb-4">
              <Text className="font-medium text-base mb-2">Active Rides</Text>
              {myRides
                .filter((ride) => ride.status === "active")
                .map((ride) => (
                  <View
                    key={ride.id}
                    className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-base">
                        {ride.origin} → {ride.destination}
                      </Text>
                      <View className="bg-green-100 px-2 py-1 rounded">
                        <Text className="text-green-800 text-xs font-medium">
                          Active
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-2">
                      <Calendar size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-1 mr-3">
                        {ride.date}
                      </Text>
                      <Clock size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-1">{ride.time}</Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Users size={16} color="#6B7280" />
                        <Text className="text-gray-600 ml-1">
                          {ride.seats} seats
                        </Text>
                      </View>

                      <TouchableOpacity
                        className="flex-row items-center bg-indigo-100 px-3 py-1 rounded"
                        onPress={() => console.log("Track ride:", ride.id)}
                      >
                        <Navigation size={16} color="#4F46E5" />
                        <Text className="text-indigo-600 ml-1 font-medium">
                          Track
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

              {myRides.filter((ride) => ride.status === "active").length ===
                0 && (
                <Text className="text-gray-500 italic">No active rides</Text>
              )}
            </View>

            <View>
              <Text className="font-medium text-base mb-2">Past Rides</Text>
              {myRides
                .filter((ride) => ride.status === "completed")
                .map((ride) => (
                  <View
                    key={ride.id}
                    className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-base">
                        {ride.origin} → {ride.destination}
                      </Text>
                      <View className="bg-gray-100 px-2 py-1 rounded">
                        <Text className="text-gray-800 text-xs font-medium">
                          Completed
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-2">
                      <Calendar size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-1 mr-3">
                        {ride.date}
                      </Text>
                      <Clock size={16} color="#6B7280" />
                      <Text className="text-gray-600 ml-1">{ride.time}</Text>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: ride.driverAvatar }}
                          className="w-8 h-8 rounded-full"
                        />
                        <Text className="ml-2 font-medium">
                          {ride.driverName}
                        </Text>
                      </View>

                      <Text className="font-bold text-indigo-600">
                        ₹{ride.price}
                      </Text>
                    </View>
                  </View>
                ))}

              {myRides.filter((ride) => ride.status === "completed").length ===
                0 && (
                <Text className="text-gray-500 italic">No past rides</Text>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? "bg-dark-primary" : "bg-gray-100"}`}
    >
      <ScrollView className="flex-1">
        <View className="p-4">
          <Text
            className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-dark-primary" : "text-gray-900"}`}
          >
            Ride Management
          </Text>

          <View className="flex-row bg-gray-200 rounded-lg p-1 mb-4">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-md items-center ${activeTab === "find" ? "bg-white" : ""}`}
              onPress={() => setActiveTab("find")}
            >
              <Text
                className={`font-medium ${activeTab === "find" ? "text-indigo-600" : "text-gray-600"}`}
              >
                <Search size={16} style={{ marginRight: 4 }} />
                Find Ride
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2 rounded-md items-center ${activeTab === "post" ? "bg-white" : ""}`}
              onPress={() => setActiveTab("post")}
            >
              <Text
                className={`font-medium ${activeTab === "post" ? "text-indigo-600" : "text-gray-600"}`}
              >
                <Plus size={16} style={{ marginRight: 4 }} />
                Post Ride
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2 rounded-md items-center ${activeTab === "my" ? "bg-white" : ""}`}
              onPress={() => setActiveTab("my")}
            >
              <Text
                className={`font-medium ${activeTab === "my" ? "text-indigo-600" : "text-gray-600"}`}
              >
                <ChevronRight size={16} style={{ marginRight: 4 }} />
                My Rides
              </Text>
            </TouchableOpacity>
          </View>

          {renderTabContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
