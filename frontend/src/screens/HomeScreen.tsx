import React, { useRef } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
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
  const { height, width } = useWindowDimensions();
  const isCompactLandscape = width > height && height < 430;

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

      <View style={[styles.content, isCompactLandscape && styles.contentCompact]}>
        <View style={[styles.header, isCompactLandscape && styles.headerCompact]}>
          <Text style={styles.kicker}>AI AGENT GAMEPLAY</Text>
          <Text style={[styles.title, isCompactLandscape && styles.titleCompact]}>THE</Text>
          <Text style={[styles.titleSub, isCompactLandscape && styles.titleSubCompact]}>INTERROGATION ROOM</Text>
          <View style={[styles.divider, isCompactLandscape && styles.dividerCompact]} />
          <Text style={[styles.description, isCompactLandscape && styles.descriptionCompact]}>
            A procedural noir murder mystery. Gather evidence, interrogate suspects with adaptive AI, and accuse the killer by explaining your full assumption.
          </Text>
        </View>

        <Animated.View
          style={[
            styles.buttonContainer,
            isCompactLandscape && styles.buttonContainerCompact,
            { transform: [{ scale }] },
          ]}
        >
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
              <Text style={styles.playButtonText}>ENTER THE ROOM</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.footer, isCompactLandscape && styles.footerCompact]}>
          Every answer has a shadow. Keep your case tight.
        </Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  contentCompact: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  header: {
    alignItems: 'center',
    width: '100%',
  },
  headerCompact: {
    transform: [{ translateY: -10 }],
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
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 8,
    lineHeight: 60,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 46,
    lineHeight: 48,
    letterSpacing: 7,
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
  titleSubCompact: {
    fontSize: 19,
    lineHeight: 22,
    marginTop: 3,
  },
  divider: {
    backgroundColor: AMBER,
    height: 2,
    marginVertical: 20,
    width: 80,
  },
  dividerCompact: {
    marginVertical: 12,
    width: 68,
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    width: '85%',
  },
  descriptionCompact: {
    fontSize: 12,
    lineHeight: 17,
    width: '78%',
  },
  buttonContainer: {
    marginTop: 24,
    width: '54%',
  },
  buttonContainerCompact: {
    marginTop: 12,
    width: '44%',
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
    paddingVertical: 15,
  },
  playButtonText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    bottom: 14,
    color: '#475569',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    position: 'absolute',
  },
  footerCompact: {
    bottom: 8,
    fontSize: 9,
  },
});
