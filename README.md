# 🚗 LNMIIT Carpool & Bus Booking App

A modern, professional carpool and bus booking application built for LNMIIT students with Uber-style UI/UX.

## 📱 Features

### ✅ **Authentication System**

- **Demo Credentials Available** - No backend setup required
- Role-based access (Driver/Passenger)
- LNMIIT email validation
- Secure login with demo accounts

### ✅ **Ride Booking & Tracking**

- Uber-style home interface
- Real-time ride tracking simulation
- Driver-passenger matching
- Live location updates
- Interactive map with animations

### ✅ **Bus Booking System**

- View available bus schedules
- Interactive seat selection (Airbnb-style layout)
- Real-time seat availability
- Booking confirmation system

### ✅ **User Profile & Safety**

- Profile management
- Emergency SOS functionality
- Safety settings and preferences
- Emergency contacts management

### ✅ **Modern UI/UX**

- Professional dark/light theme support
- Smooth animations and transitions
- Harmony design with rounded edges
- Responsive layout for all screen sizes

## 📸 Demo Screenshots

![LNMIIT Carpool App Demo](./assets/images/demo-screenshot.md)

The app features a modern, professional interface with:

- **Login Screen** - Clean authentication with demo credentials
- **Home Screen** - Uber-style interface with location cards
- **Bus Booking** - Airbnb-style seat selection
- **Profile Screen** - Complete user management
- **Live Tracking** - Real-time ride simulation

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+) - [Download](https://nodejs.org/)
- **Expo CLI** - `npm install -g @expo/cli`
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation

1. **Download/Clone the project**

   ```bash
   # Extract the ZIP file or clone the repository
   cd carpool-lnmiit-main
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment (optional)**

   ```bash
   cp env.example .env
   # Edit .env if needed (works with defaults)
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go app
   - Or use iOS Camera app (iOS) to scan QR code

## 🔐 Demo Credentials

The app includes pre-configured demo accounts:

| Account Type  | Email                   | Password     | Role      |
| ------------- | ----------------------- | ------------ | --------- |
| **Demo User** | `demo@lnmiit.ac.in`     | `demo123`    | Passenger |
| **Student**   | `21UCS045@lnmiit.ac.in` | `student123` | Passenger |
| **Driver**    | `21UME023@lnmiit.ac.in` | `driver123`  | Driver    |

> **Note:** Click the "Fill Demo Credentials" buttons on the login screen for quick access!

## 📱 How to Use

1. **Login** with any demo credentials
2. **Explore** the Uber-style home interface
3. **Book a ride** using the "Ride" option
4. **Try bus booking** with interactive seat selection
5. **Check your profile** and safety settings
6. **Toggle themes** using the header button

## 🛠 Available Scripts

```bash
# Start development server
npm start

# Start with cleared cache
npm run start:clear

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Type checking
npm run type-check

# Build for production
npm run build
```

## 🏗 Tech Stack

- **React Native** with **Expo** (v53)
- **TypeScript** for type safety
- **React Native Paper** for UI components
- **React Native Reanimated** for animations
- **Expo Router** for navigation
- **NativeWind** for styling

## 📁 Project Structure

```
carpool-lnmiit-main/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI components (Button, Input)
│   │   ├── UberStyleHome.tsx
│   │   ├── RideBookingFlow.tsx
│   │   ├── BusBookingSystem.tsx
│   │   └── ...
│   ├── api/                # API simulation
│   ├── models/             # Data models
│   └── index.tsx           # Main app entry
├── assets/                 # Images, fonts, icons
├── env.example            # Environment variables template
├── SETUP.md               # Detailed setup instructions
└── README.md              # This file
```

## 🎨 UI/UX Features

- **Professional Header** - Always dark for consistency
- **Harmony Design** - Rounded corners and modern shadows
- **Responsive Layout** - Works on all screen sizes
- **Smooth Animations** - Loading screens and transitions
- **Airbnb-style Seat Selection** - Modern bus booking interface
- **Status Bar Optimization** - Proper dynamic island visibility

## 🔧 Troubleshooting

### Common Issues

**Metro bundler cache issues:**

```bash
npm run start:clear
```

**Dependencies not installing:**

```bash
rm -rf node_modules
npm install
```

**Expo Go not connecting:**

- Ensure phone and computer are on same WiFi
- Restart development server
- Check firewall settings

**Status bar not visible:**

- Already fixed in latest version
- Restart the app if needed

## 🚀 What's Working

✅ **Complete offline functionality** - No backend required  
✅ **All demo credentials** - Ready to use  
✅ **Ride booking flow** - End-to-end working  
✅ **Bus seat selection** - Interactive and modern  
✅ **Profile management** - Fully functional  
✅ **Theme switching** - Smooth transitions  
✅ **Mobile responsive** - Works on all devices

## 📞 Support

If you encounter any issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Ensure all prerequisites are installed
3. Try clearing cache: `npm run start:clear`
4. Verify demo credentials are correct

## 🎯 Next Steps

After successful setup:

1. Login with demo credentials
2. Explore the ride booking flow
3. Try the bus booking system
4. Test profile and safety features
5. Toggle between themes

---

**Ready to go!** 🚀 The app is fully functional with simulated data - perfect for demonstration and development.

_Built with ❤️ for LNMIIT students_
