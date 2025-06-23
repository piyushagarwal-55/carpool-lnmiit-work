import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  FlatList,
} from "react-native";
import { useTheme, TextInput, Button, Card } from "react-native-paper";
import {
  MapPin,
  Clock,
  User,
  Car,
  Star,
  DollarSign,
  Navigation,
  X,
} from "lucide-react-native";

interface RideBookingFlowProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

const { width, height } = Dimensions.get("window");

const RideBookingFlow: React.FC<RideBookingFlowProps> = ({
  visible,
  onClose,
  isDarkMode = false,
}) => {
  const theme = useTheme();
  const [step, setStep] = useState(1); // 1: Enter destination, 2: Choose ride, 3: Confirm
  const [destination, setDestination] = useState("");
  const [selectedRide, setSelectedRide] = useState(null);
  const [pickup, setPickup] = useState("LNMIIT Campus");

  const rideOptions = [
    {
      id: "uberx",
      name: "UberX",
      type: "Student Share",
      price: "₹45",
      time: "8:15am",
      duration: "3 min away",
      capacity: "1-4 passengers",
      icon: "🚗",
      popular: true,
    },
    {
      id: "uberxl",
      name: "UberXL",
      type: "Group Ride",
      price: "₹85",
      time: "8:18am",
      duration: "5 min away",
      capacity: "1-6 passengers",
      icon: "🚙",
      popular: false,
    },
    {
      id: "share",
      name: "UberX Share",
      type: "Shared",
      price: "₹25",
      time: "8:25am",
      duration: "8 min away",
      capacity: "Share with others",
      icon: "👥",
      popular: false,
    },
  ];

  const popularDestinations = [
    "Jaipur Railway Station",
    "Malviya Nagar Metro",
    "Pink City Metro Station",
    "Ajmer Road",
    "Mansarovar",
    "C-Scheme",
  ];

  const renderDestinationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
          Enter your destination
        </Text>
        <Text
          style={[
            styles.stepSubtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Tap to get a ride
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <View style={styles.inputDot} />
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            value={pickup}
            editable={false}
            left={<TextInput.Icon icon="home" />}
          />
        </View>

        <View style={styles.inputRow}>
          <View
            style={[styles.inputDot, { backgroundColor: theme.colors.primary }]}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            value={destination}
            onChangeText={setDestination}
            placeholder="Where to?"
            autoFocus
            left={<TextInput.Icon icon="map-marker" />}
            right={
              destination ? (
                <TextInput.Icon icon="plus" onPress={() => setStep(2)} />
              ) : null
            }
          />
        </View>
      </View>

      <View style={styles.suggestionsContainer}>
        <Text
          style={[styles.suggestionsTitle, { color: theme.colors.onSurface }]}
        >
          Popular destinations
        </Text>
        {popularDestinations.map((dest, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionItem}
            onPress={() => {
              setDestination(dest);
              setStep(2);
            }}
          >
            <Navigation size={20} color={theme.colors.onSurfaceVariant} />
            <Text
              style={[styles.suggestionText, { color: theme.colors.onSurface }]}
            >
              {dest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.progressContainer}>
        <Text
          style={[
            styles.progressText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          1/4
        </Text>
      </View>
    </View>
  );

  const renderRideSelection = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setStep(1)} style={styles.closeButton}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
          Choose UberX
        </Text>
        <Text
          style={[
            styles.stepSubtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {destination}
        </Text>
      </View>

      <FlatList
        data={rideOptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.rideOption,
              { backgroundColor: theme.colors.surface },
              selectedRide?.id === item.id && styles.selectedRide,
            ]}
            onPress={() => setSelectedRide(item)}
          >
            <View style={styles.rideIcon}>
              <Text style={styles.rideEmoji}>{item.icon}</Text>
            </View>

            <View style={styles.rideInfo}>
              <View style={styles.rideHeader}>
                <Text
                  style={[styles.rideName, { color: theme.colors.onSurface }]}
                >
                  {item.name}
                </Text>
                {item.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Most popular</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.rideType,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {item.type} • {item.capacity}
              </Text>
              <Text
                style={[
                  styles.rideTime,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {item.time} • {item.duration}
              </Text>
            </View>

            <View style={styles.ridePrice}>
              <Text
                style={[styles.priceText, { color: theme.colors.onSurface }]}
              >
                {item.price}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      {selectedRide && (
        <View style={styles.bottomActions}>
          <Button
            mode="contained"
            onPress={() => setStep(3)}
            style={styles.chooseButton}
            labelStyle={styles.chooseButtonText}
          >
            Choose {selectedRide.name}
          </Button>
        </View>
      )}

      <View style={styles.progressContainer}>
        <Text
          style={[
            styles.progressText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          2/4
        </Text>
      </View>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => setStep(2)} style={styles.closeButton}>
          <X size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
          Plan your ride
        </Text>
        <Text
          style={[
            styles.stepSubtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          For me • Pickup now
        </Text>
      </View>

      <View style={styles.confirmationDetails}>
        <View style={styles.routeContainer}>
          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <View style={styles.routeDot} />
              <Text
                style={[styles.routeText, { color: theme.colors.onSurface }]}
              >
                {pickup}
              </Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View
                style={[
                  styles.routeDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <Text
                style={[styles.routeText, { color: theme.colors.onSurface }]}
              >
                {destination}
              </Text>
            </View>
          </View>
        </View>

        {selectedRide && (
          <Card style={styles.rideCard}>
            <Card.Content style={styles.rideCardContent}>
              <Text style={styles.rideEmoji}>{selectedRide.icon}</Text>
              <View style={styles.rideCardInfo}>
                <Text
                  style={[styles.rideName, { color: theme.colors.onSurface }]}
                >
                  {selectedRide.name}
                </Text>
                <Text
                  style={[
                    styles.rideTime,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {selectedRide.time} • {selectedRide.duration}
                </Text>
              </View>
              <Text
                style={[styles.priceText, { color: theme.colors.onSurface }]}
              >
                {selectedRide.price}
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>

      <View style={styles.bottomActions}>
        <Button
          mode="contained"
          onPress={() => {
            // Handle ride confirmation
            onClose();
            setStep(1);
            setDestination("");
            setSelectedRide(null);
          }}
          style={styles.confirmButton}
          labelStyle={styles.confirmButtonText}
        >
          Confirm {selectedRide?.name}
        </Button>
      </View>

      <View style={styles.progressContainer}>
        <Text
          style={[
            styles.progressText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          4/4
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderDestinationStep();
      case 2:
        return renderRideSelection();
      case 3:
        return renderConfirmation();
      default:
        return renderDestinationStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {renderCurrentStep()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    left: 0,
    top: 20,
    padding: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  inputDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9ca3af",
    marginRight: 16,
  },
  input: {
    flex: 1,
  },
  suggestionsContainer: {
    flex: 1,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  suggestionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  progressContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  progressText: {
    fontSize: 14,
  },
  rideOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedRide: {
    borderWidth: 2,
    borderColor: "#6366f1",
  },
  rideIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    marginRight: 16,
  },
  rideEmoji: {
    fontSize: 24,
  },
  rideInfo: {
    flex: 1,
  },
  rideHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rideName: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  popularBadge: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  popularText: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
  },
  rideType: {
    fontSize: 14,
    marginBottom: 2,
  },
  rideTime: {
    fontSize: 12,
  },
  ridePrice: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomActions: {
    paddingVertical: 20,
  },
  chooseButton: {
    height: 52,
    justifyContent: "center",
  },
  chooseButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmationDetails: {
    flex: 1,
  },
  routeContainer: {
    marginBottom: 24,
  },
  routeInfo: {
    paddingLeft: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9ca3af",
    marginRight: 16,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: "#e5e7eb",
    marginLeft: 4,
    marginVertical: 4,
  },
  routeText: {
    fontSize: 16,
  },
  rideCard: {
    marginBottom: 24,
  },
  rideCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rideCardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  confirmButton: {
    height: 52,
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RideBookingFlow;
