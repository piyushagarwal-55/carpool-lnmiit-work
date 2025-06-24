import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Switch,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  Users,
  MapPin,
  Car,
  Settings,
  Filter,
  RotateCcw,
  Check,
} from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  isDarkMode?: boolean;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  dateFilter: "all" | "today" | "tomorrow" | "this_week" | "custom";
  timeFilter: "all" | "morning" | "afternoon" | "evening";
  priceRange: {
    min: number;
    max: number;
  };
  seatsFilter: "all" | "1" | "2" | "3" | "4+";
  instantBooking: boolean | null;
  sortBy: "time" | "price" | "distance" | "rating";
  locations: {
    from: string[];
    to: string[];
  };
}

export default function FilterModal({
  visible,
  onClose,
  onApplyFilters,
  isDarkMode = false,
  currentFilters,
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const dateOptions = [
    { key: "all", label: "All Rides", icon: "calendar", color: "#6B7280" },
    { key: "today", label: "Today", icon: "clock", color: "#6B7280" },
    { key: "tomorrow", label: "Tomorrow", icon: "sunrise", color: "#6B7280" },
    {
      key: "this_week",
      label: "This Week",
      icon: "calendar-days",
      color: "#6B7280",
    },
  ];

  const timeOptions = [
    { key: "all", label: "Any Time", icon: "clock", color: "#6B7280" },
    {
      key: "morning",
      label: "Morning (6AM-12PM)",
      icon: "sunrise",
      color: "#6B7280",
    },
    {
      key: "afternoon",
      label: "Afternoon (12PM-6PM)",
      icon: "sun",
      color: "#6B7280",
    },
    {
      key: "evening",
      label: "Evening (6PM-12AM)",
      icon: "moon",
      color: "#6B7280",
    },
  ];

  const priceRanges = [
    { min: 0, max: 1000, label: "Any Price", color: "#6B7280" },
    { min: 0, max: 50, label: "Under ₹50", color: "#6B7280" },
    { min: 50, max: 100, label: "₹50 - ₹100", color: "#6B7280" },
    { min: 100, max: 200, label: "₹100 - ₹200", color: "#6B7280" },
    { min: 200, max: 500, label: "₹200 - ₹500", color: "#6B7280" },
    { min: 500, max: 1000, label: "₹500+", color: "#6B7280" },
  ];

  const seatOptions = [
    { key: "all", label: "Any Seats", icon: "users", color: "#6B7280" },
    { key: "1", label: "1 Seat", icon: "user", color: "#6B7280" },
    { key: "2", label: "2 Seats", icon: "users", color: "#6B7280" },
    { key: "3", label: "3 Seats", icon: "users", color: "#6B7280" },
    { key: "4+", label: "4+ Seats", icon: "users", color: "#6B7280" },
  ];

  const sortOptions = [
    { key: "time", label: "Departure Time", icon: "clock", color: "#6B7280" },
    {
      key: "price",
      label: "Price (Low to High)",
      icon: "dollar-sign",
      color: "#6B7280",
    },
    { key: "distance", label: "Distance", icon: "map-pin", color: "#6B7280" },
    { key: "rating", label: "Driver Rating", icon: "star", color: "#6B7280" },
  ];

  const popularLocations = [
    "LNMIIT Campus",
    "Jaipur Railway Station",
    "Jaipur Airport",
    "City Mall",
    "World Trade Park",
    "C-Scheme",
    "Vaishali Nagar",
    "Malviya Nagar",
  ];

  const resetFilters = () => {
    setFilters({
      dateFilter: "all",
      timeFilter: "all",
      priceRange: { min: 0, max: 1000 },
      seatsFilter: "all",
      instantBooking: null,
      sortBy: "time",
      locations: { from: [], to: [] },
    });
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const getIconComponent = (
    iconName: string,
    size: number = 16,
    color: string
  ) => {
    const iconProps = { size, color };
    switch (iconName) {
      case "calendar":
        return <Calendar {...iconProps} />;
      case "clock":
        return <Clock {...iconProps} />;
      case "sunrise":
        return <Clock {...iconProps} />; // Using clock as fallback
      case "calendar-days":
        return <Calendar {...iconProps} />;
      case "sun":
        return <Clock {...iconProps} />; // Using clock as fallback
      case "moon":
        return <Clock {...iconProps} />; // Using clock as fallback
      case "users":
        return <Users {...iconProps} />;
      case "user":
        return <Users {...iconProps} />;
      case "dollar-sign":
        return <DollarSign {...iconProps} />;
      case "map-pin":
        return <MapPin {...iconProps} />;
      case "star":
        return <Check {...iconProps} />; // Using check as fallback
      default:
        return <Calendar {...iconProps} />;
    }
  };

  const OptionCard = ({
    title,
    icon,
    color,
    isSelected,
    onPress,
  }: {
    title: string;
    icon: string;
    color: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: isSelected ? "#F8F9FA" : "#FFFFFF",
          borderColor: isSelected ? "#1F2937" : "#E5E7EB",
          borderWidth: isSelected ? 1.5 : 1,
          shadowOpacity: isSelected ? 0.12 : 0.06,
          shadowRadius: isSelected ? 6 : 3,
          elevation: isSelected ? 4 : 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isSelected ? "#F3F4F6" : "#F9FAFB" },
        ]}
      >
        {getIconComponent(icon, 18, isSelected ? "#1F2937" : "#6B7280")}
      </View>
      <Text
        style={[
          styles.optionTitle,
          {
            color: isSelected ? "#1F2937" : "#4B5563",
            fontWeight: isSelected ? "600" : "500",
          },
        ]}
      >
        {title}
      </Text>
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Check size={14} color="#059669" />
        </View>
      )}
    </TouchableOpacity>
  );

  const PreferenceSwitch = ({
    title,
    icon,
    value,
    onValueChange,
    color = "#4CAF50",
  }: {
    title: string;
    icon: string;
    value: boolean | null;
    onValueChange: (value: boolean | null) => void;
    color?: string;
  }) => (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceInfo}>
        <Text style={styles.preferenceIcon}>{icon}</Text>
        <Text style={[styles.preferenceTitle, { color: "#2A2A2A" }]}>
          {title}
        </Text>
      </View>
      <View style={styles.preferenceControls}>
        <TouchableOpacity
          style={[
            styles.preferenceOption,
            {
              backgroundColor: value === null ? color : "transparent",
              borderColor: color,
            },
          ]}
          onPress={() => onValueChange(null)}
        >
          <Text
            style={[
              styles.preferenceOptionText,
              {
                color: value === null ? "#FFF" : color,
                fontWeight: value === null ? "600" : "400",
              },
            ]}
          >
            Any
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.preferenceOption,
            {
              backgroundColor: value === true ? color : "transparent",
              borderColor: color,
            },
          ]}
          onPress={() => onValueChange(true)}
        >
          <Text
            style={[
              styles.preferenceOptionText,
              {
                color: value === true ? "#FFF" : color,
                fontWeight: value === true ? "600" : "400",
              },
            ]}
          >
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.preferenceOption,
            {
              backgroundColor: value === false ? color : "transparent",
              borderColor: color,
            },
          ]}
          onPress={() => onValueChange(false)}
        >
          <Text
            style={[
              styles.preferenceOptionText,
              {
                color: value === false ? "#FFF" : color,
                fontWeight: value === false ? "600" : "400",
              },
            ]}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFF" },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Filter size={22} color="#1F2937" />
              <Text style={styles.headerTitle}>Filter Rides</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Date Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={18} color="#6B7280" />
                <Text style={styles.sectionHeaderTitle}>Date</Text>
              </View>
              <View style={styles.optionsGrid}>
                {dateOptions.map((option) => (
                  <OptionCard
                    key={option.key}
                    title={option.label}
                    icon={option.icon}
                    color={option.color}
                    isSelected={filters.dateFilter === option.key}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        dateFilter: option.key as any,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            {/* Time Filter */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock size={18} color="#6B7280" />
                <Text style={styles.sectionHeaderTitle}>Time</Text>
              </View>
              <View style={styles.optionsGrid}>
                {timeOptions.map((option) => (
                  <OptionCard
                    key={option.key}
                    title={option.label}
                    icon={option.icon}
                    color={option.color}
                    isSelected={filters.timeFilter === option.key}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        timeFilter: option.key as any,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <DollarSign size={18} color="#6B7280" />
                <Text style={styles.sectionHeaderTitle}>Price</Text>
              </View>
              <View style={styles.optionsGrid}>
                {priceRanges.map((range) => (
                  <OptionCard
                    key={`${range.min}-${range.max}`}
                    title={range.label}
                    icon="💰"
                    color={range.color}
                    isSelected={
                      filters.priceRange.min === range.min &&
                      filters.priceRange.max === range.max
                    }
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        priceRange: { min: range.min, max: range.max },
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            {/* Available Seats */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={18} color="#6B7280" />
                <Text style={styles.sectionHeaderTitle}>Seats</Text>
              </View>
              <View style={styles.optionsGrid}>
                {seatOptions.map((option) => (
                  <OptionCard
                    key={option.key}
                    title={option.label}
                    icon={option.icon}
                    color={option.color}
                    isSelected={filters.seatsFilter === option.key}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        seatsFilter: option.key as any,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            {/* Quick Actions Section */}
            <View style={[styles.section, { backgroundColor: "#F0F8FF" }]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFF" : "#1A1A1A" },
                ]}
              >
                Quick Actions
              </Text>

              <View style={styles.quickActionRow}>
                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    { backgroundColor: "#E8F5E8" },
                  ]}
                  onPress={() =>
                    setFilters({ ...filters, dateFilter: "today" })
                  }
                >
                  <Text style={[styles.quickActionText, { color: "#2E7D32" }]}>
                    Today's Rides
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickActionButton,
                    { backgroundColor: "#FFF3E0" },
                  ]}
                  onPress={() =>
                    setFilters({ ...filters, priceRange: { min: 0, max: 100 } })
                  }
                >
                  <Text style={[styles.quickActionText, { color: "#F57C00" }]}>
                    Budget Rides
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Filter size={18} color="#6B7280" />
                <Text style={styles.sectionHeaderTitle}>Sort</Text>
              </View>
              <View style={styles.optionsGrid}>
                {sortOptions.map((option) => (
                  <OptionCard
                    key={option.key}
                    title={option.label}
                    icon={option.icon}
                    color={option.color}
                    isSelected={filters.sortBy === option.key}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: option.key as any,
                      }))
                    }
                  />
                ))}
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Apply Filters Button */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: "#FFF5F5" }]}
              onPress={resetFilters}
            >
              <RotateCcw size={16} color="#DC2626" />
              <Text style={[styles.resetButtonText, { color: "#DC2626" }]}>
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: "#E8F5E8" }]}
              onPress={applyFilters}
            >
              <Check size={16} color="#2E7D32" />
              <Text style={[styles.applyButtonText, { color: "#2E7D32" }]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    position: "relative",
    minWidth: (width - 56) / 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
    opacity: 0.1,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    letterSpacing: 0.2,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 4,
  },
  optionChipActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  optionEmoji: {
    fontSize: 16,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  optionTextActive: {
    color: "#FFF",
  },
  preferencesContainer: {
    gap: 16,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#2A2A2A",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  preferenceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  preferenceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  preferenceControls: {
    flexDirection: "row",
    gap: 6,
  },
  preferenceOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 50,
    alignItems: "center",
  },
  preferenceOptionActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  preferenceOptionText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  preferenceOptionTextActive: {
    color: "#FFF",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    gap: 16,
  },
  resetButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  applyButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  bottomPadding: {
    height: 24,
  },
  quickActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: "#F8FAFC",
  },
});
