import React, { useRef } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=75';
const AMBER = '#FFBF00';

export function HomeScreen({ navigation, route }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      friction: 5,
      tension: 200,
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      friction: 5,
      tension: 200,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: BACKGROUND_IMAGE }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={styles.shade} />
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>AI AGENT GAMEPLAY</Text>
          <Text style={styles.title}>ECHOES</Text>
          <Text style={styles.titleSub}>OF THE MANOR</Text>
          <View style={styles.divider} />
          <Text style={styles.description}>
            A procedural noir murder mystery. Gather evidence, interrogate suspects with adaptive AI, and accuse the killer by explaining your full assumption.
          </Text>
        </View>

        <Animated.View style={[styles.buttonContainer, { transform: [{ scale }] }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Game', { sessionId: route.params?.sessionId })}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.playButton}
          >
            <LinearGradient
              colors={['#FFD700', AMBER]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Play color="#020617" size={22} fill="#020617" />
              <Text style={styles.playButtonText}>ENTER THE MANOR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footer}>The manor remembers everything. Keep your alibi tight.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020617',
    flex: 1,
  },
  shade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  header: {
    alignItems: 'center',
    marginTop: 64,
    width: '100%',
  },
  kicker: {
    color: AMBER,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 8,
    lineHeight: 64,
    textAlign: 'center',
  },
  titleSub: {
    color: '#cbd5e1',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 6,
    lineHeight: 28,
    marginTop: 8,
    textAlign: 'center',
  },
  divider: {
    backgroundColor: AMBER,
    height: 2,
    marginVertical: 28,
    width: 80,
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    width: '85%',
  },
  buttonContainer: {
    width: '80%',
  },
  playButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  playButtonText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    color: '#475569',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
