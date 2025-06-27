import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconButton, Button, Card, Avatar } from 'react-native-paper';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  branch?: string;
  year?: string;
  phone?: string;
  rating?: number;
  profilePicture?: string;
  ridesCompleted?: number;
}

interface UserProfileSafetyProps {
  user: User;
  busBookings: any[];
  onLogout: () => void;
  isDarkMode: boolean;
}

interface BookingHistory {
  id: string;
  type: 'carpool' | 'bus';
  title: string;
  date: string;
  status: 'completed' | 'upcoming' | 'cancelled';
  amount?: number;
  details: string;
}

interface SafetySettings {
  shareLocation: boolean;
  emergencyContacts: string[];
  autoAlert: boolean;
  rideVerification: boolean;
}

interface GeneralSettings {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  autoBook: boolean;
}

const UserProfileSafety: React.FC<UserProfileSafetyProps> = ({
  user,
  busBookings,
  onLogout,
  isDarkMode,
}) => {
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [safetySettings, setSafetySettings] = useState<SafetySettings>({
    shareLocation: true,
    emergencyContacts: [],
    autoAlert: true,
    rideVerification: true,
  });
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    notifications: true,
    darkMode: isDarkMode,
    language: 'English',
    autoBook: false,
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [showSafetySettings, setShowSafetySettings] = useState(false);
  const [showGeneralSettings, setShowGeneralSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  // Fetch booking history
  useEffect(() => {
    fetchBookingHistory();
    fetchUserSettings();
  }, [user.id]);

  const fetchBookingHistory = async () => {
    try {
      // Fetch carpool bookings
      const { data: carpoolData, error: carpoolError } = await supabase
        .from('carpool_bookings')
        .select(`
          id,
          created_at,
          status,
          seats_booked,
          carpool_rides (
            from_location,
            to_location,
            departure_time,
            price_per_seat
          )
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch bus bookings
      const { data: busData, error: busError } = await supabase
        .from('bus_bookings')
        .select(`
          id,
          created_at,
          status,
          seats_booked,
          buses (
            route_name,
            departure_time,
            fare
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const history: BookingHistory[] = [];

      // Process carpool bookings
      if (carpoolData && !carpoolError) {
        carpoolData.forEach((booking: any) => {
          history.push({
            id: booking.id,
            type: 'carpool',
            title: `${booking.carpool_rides?.from_location} → ${booking.carpool_rides?.to_location}`,
            date: new Date(booking.created_at).toLocaleDateString(),
            status: booking.status,
            amount: booking.carpool_rides?.price_per_seat * booking.seats_booked,
            details: `${booking.seats_booked} seats booked`,
          });
        });
      }

      // Process bus bookings
      if (busData && !busError) {
        busData.forEach((booking: any) => {
          history.push({
            id: booking.id,
            type: 'bus',
            title: booking.buses?.route_name || 'Bus Route',
            date: new Date(booking.created_at).toLocaleDateString(),
            status: booking.status,
            amount: booking.buses?.fare * booking.seats_booked,
            details: `${booking.seats_booked} seats booked`,
          });
        });
      }

      // Sort by date
      history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBookingHistory(history);
    } catch (error) {
      console.error('Error fetching booking history:', error);
      setBookingHistory([
        {
          id: '1',
          type: 'carpool',
          title: 'LNMIIT → Jaipur Railway Station',
          date: '2024-06-20',
          status: 'completed',
          amount: 150,
          details: '2 seats booked',
        },
        {
          id: '2',
          type: 'bus',
          title: 'Campus to City Center',
          date: '2024-06-18',
          status: 'completed',
          amount: 25,
          details: '1 seat booked',
        },
      ]);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setSafetySettings({
          shareLocation: data.share_location ?? true,
          emergencyContacts: data.emergency_contacts || [],
          autoAlert: data.auto_alert ?? true,
          rideVerification: data.ride_verification ?? true,
        });
        setGeneralSettings({
          notifications: data.notifications ?? true,
          darkMode: data.dark_mode ?? isDarkMode,
          language: data.language || 'English',
          autoBook: data.auto_book ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    }
  };

  const updateUserProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: editedUser.name,
          phone: editedUser.phone,
          branch: editedUser.branch,
          year: editedUser.year,
        }
      });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSafetySettings = async (newSettings: Partial<SafetySettings>) => {
    const updatedSettings = { ...safetySettings, ...newSettings };
    setSafetySettings(updatedSettings);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          share_location: updatedSettings.shareLocation,
          emergency_contacts: updatedSettings.emergencyContacts,
          auto_alert: updatedSettings.autoAlert,
          ride_verification: updatedSettings.rideVerification,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating safety settings:', error);
    }
  };

  const updateGeneralSettings = async (newSettings: Partial<GeneralSettings>) => {
    const updatedSettings = { ...generalSettings, ...newSettings };
    setGeneralSettings(updatedSettings);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications: updatedSettings.notifications,
          dark_mode: updatedSettings.darkMode,
          language: updatedSettings.language,
          auto_book: updatedSettings.autoBook,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating general settings:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'upcoming': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'upcoming': return '🕒';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  const containerStyle = {
    flex: 1,
    backgroundColor: isDarkMode ? '#000000' : '#F8F9FA',
  };

  const cardStyle = {
    backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  };

  const textStyle = {
    color: isDarkMode ? '#FFFFFF' : '#000000',
  };

  const secondaryTextStyle = {
    color: isDarkMode ? '#CCCCCC' : '#666666',
  };

  return (
    <SafeAreaView style={containerStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000000' : '#F8F9FA'}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#000000' : '#F8F9FA' }]}>
        <Text style={[styles.headerTitle, textStyle]}>My Account</Text>
        <TouchableOpacity style={styles.menuButton}>
          <IconButton
            icon="menu"
            size={24}
            iconColor={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>
     {/* User Card */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={[cardStyle, styles.profileCard]}>
          <LinearGradient
            colors={isDarkMode ? ['#1A1A1A', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
            style={styles.profileGradient}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Avatar.Image
                  size={80}
                  source={{
                    uri: user.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                  }}
                />
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, textStyle]}>{user.name}</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>⭐</Text>
                  <Text style={[styles.rating, secondaryTextStyle]}>
                    {user.rating?.toFixed(1) || '4.5'}
                  </Text>
                </View>
              </View>
            </View>

            {/* User Details */}
            <View style={styles.userDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, secondaryTextStyle]}>Email</Text>
                <Text style={[styles.detailValue, textStyle]}>{user.email}</Text>
              </View>
              {user.branch && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, secondaryTextStyle]}>Branch</Text>
                  <Text style={[styles.detailValue, textStyle]}>{user.branch}</Text>
                </View>
              )}
              {user.year && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, secondaryTextStyle]}>Year</Text>
                  <Text style={[styles.detailValue, textStyle]}>{user.year}</Text>
                </View>
              )}
              {user.phone && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, secondaryTextStyle]}>Mobile</Text>
                  <Text style={[styles.detailValue, textStyle]}>{user.phone}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditProfile(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Invite Friends Card */}
        <View style={[cardStyle, styles.inviteCard]}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.inviteGradient}
          >
            <View style={styles.inviteContent}>
              <View style={styles.inviteText}>
                <Text style={styles.inviteTitle}>Invite Friends</Text>
                <Text style={styles.inviteSubtitle}>
                  Invite your friends to join carpool and get ₹100 each!
                </Text>
              </View>
              <View style={styles.inviteIcons}>
                <Text style={styles.inviteEmoji}>👥</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {/* My Account */}
          <TouchableOpacity
            style={[cardStyle, styles.menuItem]}
            onPress={() => setShowEditProfile(true)}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.menuIconText}>👤</Text>
                </View>
                <Text style={[styles.menuItemText, textStyle]}>My Account</Text>
              </View>
              <IconButton
                icon="chevron-right"
                size={20}
                iconColor={isDarkMode ? '#CCCCCC' : '#666666'}
              />
            </View>
          </TouchableOpacity>

          {/* My Booking History */}
          <TouchableOpacity
            style={[cardStyle, styles.menuItem]}
            onPress={() => setShowBookingHistory(true)}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#2196F3' }]}>
                  <Text style={styles.menuIconText}>📋</Text>
                </View>
                <Text style={[styles.menuItemText, textStyle]}>My Booking History</Text>
              </View>
              <IconButton
                icon="chevron-right"
                size={20}
                iconColor={isDarkMode ? '#CCCCCC' : '#666666'}
              />
            </View>
          </TouchableOpacity>

          {/* Safety */}
          <TouchableOpacity
            style={[cardStyle, styles.menuItem]}
            onPress={() => setShowSafetySettings(true)}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#FF9800' }]}>
                  <Text style={styles.menuIconText}>🛡️</Text>
                </View>
                <Text style={[styles.menuItemText, textStyle]}>Safety</Text>
              </View>
              <IconButton
                icon="chevron-right"
                size={20}
                iconColor={isDarkMode ? '#CCCCCC' : '#666666'}
              />
            </View>
          </TouchableOpacity>

          {/* General Settings */}
          <TouchableOpacity
            style={[cardStyle, styles.menuItem]}
            onPress={() => setShowGeneralSettings(true)}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#9C27B0' }]}>
                  <Text style={styles.menuIconText}>⚙️</Text>
                </View>
                <Text style={[styles.menuItemText, textStyle]}>General Settings</Text>
              </View>
              <IconButton
                icon="chevron-right"
                size={20}
                iconColor={isDarkMode ? '#CCCCCC' : '#666666'}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: isDarkMode ? '#FF4444' : '#F44336' }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Bottom Navigation Space */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[containerStyle, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF' }]}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Text style={[styles.modalCancelText, textStyle]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, textStyle]}>Edit Profile</Text>
              <TouchableOpacity onPress={updateUserProfile} disabled={loading}>
                <Text style={[styles.modalSaveText, { opacity: loading ? 0.5 : 1 }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, textStyle]}>Name</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }]}
                  value={editedUser.name}
                  onChangeText={(text) => setEditedUser({ ...editedUser, name: text })}
                  placeholder="Enter your name"
                  placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, textStyle]}>Phone</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }]}
                  value={editedUser.phone || ''}
                  onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })}
                  placeholder="Enter phone number"
                  placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, textStyle]}>Branch</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }]}
                  value={editedUser.branch || ''}
                  onChangeText={(text) => setEditedUser({ ...editedUser, branch: text })}
                  placeholder="Enter your branch"
                  placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, textStyle]}>Year</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                  }]}
                  value={editedUser.year || ''}
                  onChangeText={(text) => setEditedUser({ ...editedUser, year: text })}
                  placeholder="Enter your year"
                  placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Booking History Modal */}
      <Modal
        visible={showBookingHistory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[containerStyle, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBookingHistory(false)}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, textStyle]}>Booking History</Text>
            <View style={{ width: 48 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {bookingHistory.map((booking) => (
              <View key={booking.id} style={[cardStyle, styles.bookingItem]}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingType}>
                    <Text style={styles.bookingTypeText}>
                      {booking.type === 'carpool' ? '🚗' : '🚌'}
                    </Text>
                    <Text style={[styles.bookingTitle, textStyle]}>{booking.title}</Text>
                  </View>
                  <View style={styles.bookingStatus}>
                    <Text style={styles.statusIcon}>{getStatusIcon(booking.status)}</Text>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <Text style={[styles.bookingDate, secondaryTextStyle]}>{booking.date}</Text>
                  <Text style={[styles.bookingAmount, textStyle]}>
                    ₹{booking.amount}
                  </Text>
                </View>
                <Text style={[styles.bookingDetailsText, secondaryTextStyle]}>
                  {booking.details}
                </Text>
              </View>
            ))}
            {bookingHistory.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>📋</Text>
                <Text style={[styles.emptyStateTitle, textStyle]}>No bookings yet</Text>
                <Text style={[styles.emptyStateSubtitle, secondaryTextStyle]}>
                  Your booking history will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Safety Settings Modal */}
      <Modal
        visible={showSafetySettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[containerStyle, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSafetySettings(false)}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, textStyle]}>Safety Settings</Text>
            <View style={{ width: 48 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[cardStyle, styles.settingItem]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, textStyle]}>Share Location</Text>
                  <Text style={[styles.settingSubtitle, secondaryTextStyle]}>
                    Share your live location during rides
                  </Text>
                </View>
                <Switch
                  value={safetySettings.shareLocation}
                  onValueChange={(value) => updateSafetySettings({ shareLocation: value })}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={safetySettings.shareLocation ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={[cardStyle, styles.settingItem]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, textStyle]}>Auto Alert</Text>
                  <Text style={[styles.settingSubtitle, secondaryTextStyle]}>
                    Automatically alert emergency contacts if needed
                  </Text>
                </View>
                <Switch
                  value={safetySettings.autoAlert}
                  onValueChange={(value) => updateSafetySettings({ autoAlert: value })}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={safetySettings.autoAlert ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={[cardStyle, styles.settingItem]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, textStyle]}>Ride Verification</Text>
                  <Text style={[styles.settingSubtitle, secondaryTextStyle]}>
                    Verify driver and vehicle details before ride
                  </Text>
                </View>
                <Switch
                  value={safetySettings.rideVerification}
                  onValueChange={(value) => updateSafetySettings({ rideVerification: value })}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={safetySettings.rideVerification ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>

            <TouchableOpacity style={[cardStyle, styles.emergencyButton]}>
              <LinearGradient
                colors={['#FF4444', '#FF6B6B']}
                style={styles.emergencyGradient}
              >
                <Text style={styles.emergencyText}>🚨 Emergency SOS</Text>
                <Text style={styles.emergencySubtext}>Tap to send emergency alert</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* General Settings Modal */}
      <Modal
        visible={showGeneralSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[containerStyle, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGeneralSettings(false)}>
              <IconButton
                icon="arrow-left"
                size={24}
                iconColor={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, textStyle]}>General Settings</Text>
            <View style={{ width: 48 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={[cardStyle, styles.settingItem]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, textStyle]}>Notifications</Text>
                  <Text style={[styles.settingSubtitle, secondaryTextStyle]}>
                    Receive ride updates and alerts
                  </Text>
                </View>
                <Switch
                  value={generalSettings.notifications}
                  onValueChange={(value) => updateGeneralSettings({ notifications: value })}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={generalSettings.notifications ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={[cardStyle, styles.settingItem]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, textStyle]}>Dark Mode</Text>
                  <Text style={[styles.settingSubtitle, secondaryTextStyle]}>
                    Switch to dark theme
                  </Text>
                </View>
                <Switch
                  value={generalSettings.darkMode}
                  onValueChange={(value) => updateGeneralSettings({ darkMode: value })}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={generalSettings.darkMode ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* <View style={[cardStyle, styles.settingItem]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, textStyle]}>Auto Book</Text>
                  <Text style={[styles.settingSubtitle, secondaryTextStyle]}>
                    Automatically book preferred rides
                  </Text>
                </View>
                <Switch
                  value={generalSettings.autoBook}
                  onValueChange={(value) => updateGeneralSettings({ autoBook: value })}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={generalSettings.autoBook ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View> */}

            <TouchableOpacity style={[cardStyle, styles.languageSelector]}>
              <View style={styles.settingContent}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, textStyle]}>Language</Text>
                  <Text style={[styles.settingSubtitle, secondaryTextStyle]}>
                    {generalSettings.language}
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  iconColor={isDarkMode ? '#CCCCCC' : '#666666'}
                />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 4,
  },
  profileCard: {
    marginTop: 16,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    marginRight: 4,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteCard: {
    overflow: 'hidden',
  },
  inviteGradient: {
    padding: 20,
  },
  inviteContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteText: {
    flex: 1,
  },
  inviteTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  inviteSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  inviteIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuSection: {
    marginTop: 8,
  },
  menuItem: {
    marginBottom: 4,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  bookingItem: {
    marginBottom: 12,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bookingType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingTypeText: {
    fontSize: 20,
    marginRight: 12,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  bookingDetailsText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  settingItem: {
    marginBottom: 12,
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  emergencyButton: {
    marginTop: 20,
    overflow: 'hidden',
  },
  emergencyGradient: {
    padding: 20,
    alignItems: 'center',
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emergencySubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  languageSelector: {
    marginBottom: 12,
  },
});

export default UserProfileSafety;