import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  error,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const focusAnimation = useSharedValue(0);
  const labelAnimation = useSharedValue(value ? 1 : 0);

  const handleFocus = () => {
    setIsFocused(true);
    focusAnimation.value = withTiming(1, { duration: 200 });
    labelAnimation.value = withTiming(1, { duration: 200 });
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusAnimation.value = withTiming(0, { duration: 200 });
    if (!value) {
      labelAnimation.value = withTiming(0, { duration: 200 });
    }
    onBlur?.();
  };

  const borderAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolate(
      focusAnimation.value,
      [0, 1],
      [0, 1]
    );
    
    return {
      borderColor: error
        ? theme.colors.error
        : borderColor === 1
        ? theme.colors.primary
        : theme.colors.outline,
      borderWidth: borderColor === 1 ? 2 : 1,
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(labelAnimation.value, [0, 1], [0, -28]);
    const scale = interpolate(labelAnimation.value, [0, 1], [1, 0.8]);
    const color = interpolate(labelAnimation.value, [0, 1], [0.6, 1]);
    
    return {
      transform: [{ translateY }, { scale }],
      opacity: labelAnimation.value === 0 ? 0.6 : 1,
    };
  });

  const getLabelColor = () => {
    if (error) return theme.colors.error;
    if (isFocused) return theme.colors.primary;
    return theme.colors.onSurfaceVariant;
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.inputContainer, borderAnimatedStyle]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <View style={styles.inputWrapper}>
          {label && (
            <Animated.Text
              style={[
                styles.label,
                labelAnimatedStyle,
                { color: getLabelColor() },
              ]}
            >
              {label}
            </Animated.Text>
          )}
          
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              inputStyle,
              {
                color: theme.colors.onSurface,
                paddingTop: label ? 16 : 12,
              },
              multiline && { textAlignVertical: 'top' },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={!label || labelAnimation.value === 1 ? placeholder : ''}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            editable={!disabled}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            numberOfLines={numberOfLines}
            selectionColor={theme.colors.primary}
          />
        </View>

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  leftIconContainer: {
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    fontSize: 16,
    fontWeight: '500',
    zIndex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  input: {
    fontSize: 16,
    paddingBottom: 12,
    paddingTop: 16,
    margin: 0,
    minHeight: 24,
  },
  rightIconContainer: {
    marginLeft: 12,
    padding: 4,
  },
  errorContainer: {
    marginTop: 4,
    marginLeft: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Input; 