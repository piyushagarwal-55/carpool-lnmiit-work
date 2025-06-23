# LNMIIT Carpool App - Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **Expo Go app** on your mobile device:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation Steps

### 1. Clone/Download the Project

```bash
# If using git
git clone <repository-url>
cd carpool-lnmiit-main

# Or extract the downloaded ZIP file
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Environment Setup

```bash
# Copy the example environment file
cp env.example .env

# Edit .env file if needed (optional for demo)
# The demo works with default values
```

### 4. Start the Development Server

```bash
# Start Expo development server
npx expo start

# Or using yarn
yarn start
```

### 5. Run on Your Device

After running `npx expo start`, you'll see a QR code in your terminal.

**On iOS:**

1. Open the **Camera** app
2. Point it at the QR code
3. Tap the notification to open in Expo Go

**On Android:**

1. Open the **Expo Go** app
2. Tap "Scan QR Code"
3. Point camera at the QR code

## Demo Credentials

The app comes with pre-configured demo accounts:

### General Demo User

- **Email:** `demo@lnmiit.ac.in`
- **Password:** `demo123`
- **Role:** Passenger

### Student Account

- **Email:** `21UCS045@lnmiit.ac.in`
- **Password:** `student123`
- **Role:** Passenger

### Driver Account

- **Email:** `21UME023@lnmiit.ac.in`
- **Password:** `driver123`
- **Role:** Driver

## Features Available

✅ **Authentication System**

- Login with demo credentials
- Role-based access (Driver/Passenger)
- LNMIIT email validation

✅ **Ride Booking**

- Search for rides
- Book rides with live tracking simulation
- Driver/passenger matching

✅ **Bus Booking**

- View bus schedules
- Interactive seat selection
- Booking confirmation

✅ **User Profile**

- Profile management
- Safety features
- Emergency contacts

✅ **Theme Support**

- Light/Dark mode toggle
- Professional UI design

## Troubleshooting

### Common Issues

**1. Metro bundler issues:**

```bash
# Clear cache and restart
npx expo start --clear
```

**2. Dependencies not installing:**

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

**3. Expo Go not connecting:**

- Ensure your phone and computer are on the same WiFi network
- Try restarting the Expo development server
- Check firewall settings

**4. TypeScript errors:**

```bash
# Check TypeScript compilation
npx tsc --noEmit
```

### Performance Tips

- Use a physical device for better performance
- Ensure stable WiFi connection
- Close other apps to free up memory
- Use development build for better performance (optional)

## Project Structure

```
carpool-lnmiit-main/
├── app/                    # Main app directory
│   ├── components/         # Reusable components
│   ├── api/               # API simulation
│   ├── models/            # Data models
│   └── index.tsx          # Main app file
├── assets/                # Images, fonts, etc.
├── env.example           # Environment variables template
├── package.json          # Dependencies
└── README.md            # Project documentation
```

## Available Scripts

```bash
# Start development server
npm start

# Start with cache cleared
npm run start:clear

# Run on iOS simulator (requires Xcode)
npm run ios

# Run on Android emulator (requires Android Studio)
npm run android

# Build for production
npm run build

# Type checking
npm run type-check
```

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Native Paper** for UI components
- **Expo Router** for navigation
- **React Native Reanimated** for animations
- **NativeWind** for styling

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Ensure all prerequisites are installed
3. Try clearing cache and restarting
4. Check that demo credentials are entered correctly

## Next Steps

After successful setup:

1. Login with any demo credentials
2. Explore the ride booking flow
3. Try the bus booking system
4. Test the profile and safety features
5. Toggle between light/dark themes

The app is fully functional offline with simulated data - no external backend required for demo purposes!
