import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export const CustomToastLayout = ({ text1, text2, type, icon }) => {
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const backgroundColor = 
    type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
    type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
    'rgba(30, 58, 138, 0.95)';

  return (
    <Animated.View style={[styles.customToast, { backgroundColor, transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.toastIconBox}>
         <Feather name={icon} size={28} color="white" />
      </View>
      <View style={styles.toastContent}>
        <Text style={styles.toastText1}>{text1}</Text>
        {text2 && <Text style={styles.toastText2}>{text2}</Text>}
      </View>
    </Animated.View>
  );
};

export const toastConfig = {
  success: (props) => (
    <CustomToastLayout {...props} type="success" icon="check-circle" />
  ),
  error: (props) => (
    <CustomToastLayout {...props} type="error" icon="alert-circle" />
  ),
  info: (props) => (
    <CustomToastLayout {...props} type="info" icon="info" />
  )
};

const styles = StyleSheet.create({
  customToast: {
    flexDirection: 'row',
    width: screenWidth * 0.9,
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 20,
  },
  toastIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toastContent: {
    flex: 1,
  },
  toastText1: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  toastText2: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
