/* eslint-disable global-require */
import { Auth } from '@aws-amplify/auth';
import { Amplify } from '@aws-amplify/core';
import {
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { Subscription } from 'expo-modules-core';
import { Analytics } from 'aws-amplify';
import Application from 'expo-application';
import * as Constants from 'expo-constants';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DevicePushToken } from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import React, {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LogBox, Platform, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { init as initSentry } from 'sentry-expo';
import AnimatedSplashScreen from './AnimatedSplashScreen';
import ActivityIndicator from './components/ActivityIndicator';
import MiniPlayer from './components/teaching/MiniPlayer';
import CommentContext, { CommentContextType } from './contexts/CommentContext';
import { ContentScreenProvider } from './contexts/ContentScreenContext/ContentScreenContext';
import LocationContext, { LocationData } from './contexts/LocationContext';
import MediaContext, { MediaData } from './contexts/MediaContext';
import MiniPlayerStyleContext from './contexts/MiniPlayerStyleContext';
import UserContext, { TMHCognitoUser, UserData } from './contexts/UserContext';
import AppNavigator from './navigation/AppNavigator';
import LocationsService from './services/LocationsService';

LogBox.ignoreAllLogs(true);

initSentry({
  dsn: 'https://1063e7581bd847c686c2482a582c9e45@o390245.ingest.sentry.io/5397756',
  enableInExpoDevelopment: true,
  debug: false,
  environment: 'prod',
  release:
    Application?.nativeApplicationVersion ??
    `-${Application?.nativeBuildVersion}` ??
    '',
});
Amplify.configure({
  aws_project_region: 'us-east-1',
  aws_cognito_identity_pool_id:
    'us-east-1:d3da58ee-46b8-4b00-aa3a-a14c37b64aa7',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_KiJzP2dH5',
  aws_user_pools_web_client_id: '3pf37ngd57hsk9ld12aha9bm2f',
  oauth: {},
  federationTarget: 'COGNITO_IDENTITY_POOLS',
  aws_appsync_graphqlEndpoint:
    'https://qt6manqtzbhkvd6tcxvchusmyq.appsync-api.us-east-1.amazonaws.com/graphql',
  aws_appsync_region: 'us-east-1',
  aws_appsync_authenticationType: 'API_KEY',
  aws_appsync_apiKey: 'da2-z4ilyrquhnagtbiosodc6qq4kq',
  aws_cloud_logic_custom: [
    {
      name: 'image',
      endpoint:
        'https://95i5crqja0.execute-api.us-east-1.amazonaws.com/tmhprod',
      region: 'us-east-1',
    },
  ],
  aws_content_delivery_bucket:
    'heeetingouse-20190312104205-hostingbucket-tmhprod',
  aws_content_delivery_bucket_region: 'us-east-1',
  aws_content_delivery_url: 'https://d3ovx9jsa9o5gy.cloudfront.net',
  aws_mobile_analytics_app_id: '20b026ebefc445dd82e5a853dff62770',
  aws_mobile_analytics_app_region: 'us-east-1',
  aws_user_files_s3_bucket:
    'themeetinghouse-usercontentstoragetmhusercontent-tmhprod',
  aws_user_files_s3_bucket_region: 'us-east-1',
});

export interface Props {
  skipLoadingScreen?: boolean;
}

const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'black',
  },
};

export function App({ skipLoadingScreen }: Props): JSX.Element {
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [userData, setUserData] = useState<UserData>(null);
  const [locationData, setLocationData] = useState<LocationData>(null);
  const [media, setMedia] = useState<MediaData>({
    playerType: 'none',
    playing: false,
    audio: null,
    video: null,
    videoTime: 0,
    episode: '',
    series: '',
  });
  const [currentScreen, setCurrentScreen] = useState('HomeScreen');
  const [display, setDisplay] = useState<ViewStyle['display']>('flex');
  const [comments, setComments] = useState<CommentContextType['comments']>([]);
  const [, setExpoPushToken] = useState<DevicePushToken>();
  const [, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef() as React.MutableRefObject<Subscription>;

  const navRef = createRef<NavigationContainerRef>();

  async function loadResourcesAsync() {
    await SplashScreen.preventAutoHideAsync();
    await Promise.all([
      Font.loadAsync({
        'Graphik-Regular-App': require('../assets/fonts/Graphik-Regular-App.ttf'),
        'Graphik-Medium-App': require('../assets/fonts/Graphik-Medium-App.ttf'),
        'Graphik-Bold-App': require('../assets/fonts/Graphik-Bold-App.ttf'),
        'Graphik-Semibold-App': require('../assets/fonts/Graphik-Semibold-App.ttf'),
        'Graphik-RegularItalic': require('../assets/fonts/Graphik-RegularItalic.otf'),
      }),
    ]);
    setLoadingComplete(true);
    await SplashScreen.hideAsync();
  }

  async function registerForPushNotificationsAsync(): Promise<DevicePushToken | null> {
    let token;
    if (Constants.default.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      token = (await Notifications.getDevicePushTokenAsync()).data;
      console.log(token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }
  const setVideoTime = (data: number) => {
    setMedia((prevState) => {
      return { ...prevState, videoTime: data };
    });
  };

  const closeAudio = () => {
    setMedia((prevState) => {
      return { ...prevState, audio: null, playing: false, playerType: 'none' };
    });
  };

  const closeVideo = () => {
    setMedia((prevState) => {
      return { ...prevState, video: null, playing: false, playerType: 'none' };
    });
  };

  const setAudioNull = () => {
    setMedia((prevState) => {
      return { ...prevState, audio: null };
    });
  };

  const setPlayerTypeNone = () => {
    setMedia((prevState) => {
      return { ...prevState, playerType: 'none' };
    });
  };

  const handleRouteChange = () => {
    const screen = navRef.current?.getCurrentRoute()?.name;
    setCurrentScreen(screen ?? 'unknown');
  };

  useEffect(() => {
    const mapObj = (f: any) => (obj: any) =>
      Object.keys(obj).reduce(
        (acc, key) => ({ ...acc, [key]: f(obj[key]) }),
        {}
      );
    const toArrayOfStrings = (value: any) => [`${value}`];
    const mapToArrayOfStrings = mapObj(toArrayOfStrings);

    const trackUserId = async (user: TMHCognitoUser) => {
      try {
        const { attributes } = user;
        const userAttributes = mapToArrayOfStrings(attributes);
        const groups = user.getSignInUserSession()?.getAccessToken()?.payload?.[
          'cognito:groups'
        ];
        const token = (await Notifications.getDevicePushTokenAsync()).data;
        await Analytics.updateEndpoint({
          address: token,
          channelType: Platform.OS === 'ios' ? 'APNS' : 'GCM',
          optOut: 'NONE',
          userId: attributes?.sub,
          userAttributes,
          attributes: { groups },
        });
      } catch (error) {
        console.log(error);
      }
    };
    async function checkForUser() {
      try {
        const user: TMHCognitoUser = await Auth.currentAuthenticatedUser();
        if (user.attributes) {
          // eslint-disable-next-line camelcase
          if (user.attributes?.email_verified) {
            setUserData(user.attributes);
          }

          if (user.attributes['custom:home_location']) {
            const selectedLocation = LocationsService.mapLocationIdToName(
              user.attributes['custom:home_location']
            );
            setLocationData({
              locationId: user.attributes['custom:home_location'],
              locationName: selectedLocation,
            });
          }
        }

        await trackUserId(user);
      } catch (e) {
        console.debug(e);
        setLocationData({ locationId: 'unknown', locationName: 'unknown' });
        try {
          const location = await SecureStore.getItemAsync('location');
          if (location) {
            const selectedLocation =
              LocationsService.mapLocationIdToName(location);
            setLocationData({
              locationId: location,
              locationName: selectedLocation,
            });
          }
        } catch (err) {
          console.debug(err);
        }
      }
    }
    loadResourcesAsync();
    checkForUser();
    registerForPushNotificationsAsync().then((token) => {
      if (token) setExpoPushToken(token);
    });

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener(
        (notification: Notifications.Notification) => {
          setNotification(notification);
        }
      );

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
    };
  }, []);
  const commentContext = useMemo(() => {
    return { comments, setComments };
  }, [comments]);
  const displayContext = useMemo(() => {
    return { display, setDisplay };
  }, [display]);
  const locationContext = useMemo(() => {
    return { locationData, setLocationData };
  }, [locationData]);
  const userContext = useMemo(() => {
    return { userData, setUserData };
  }, [userData]);
  const mediaContext = useMemo(() => {
    return {
      media,
      setMedia,
      setVideoTime,
      closeAudio,
      setAudioNull,
      closeVideo,
      setPlayerTypeNone,
    };
  }, [media]);
  const onLayoutRootView = useCallback(async () => {
    if (isLoadingComplete || skipLoadingScreen) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreen.hideAsync();
    }
  }, [skipLoadingScreen, isLoadingComplete]);

  if (!isLoadingComplete && !skipLoadingScreen) {
    return <ActivityIndicator />;
  }

  return (
    <AnimatedSplashScreen>
      <CommentContext.Provider value={commentContext}>
        <MiniPlayerStyleContext.Provider value={displayContext}>
          <MediaContext.Provider value={mediaContext}>
            <LocationContext.Provider value={locationContext}>
              <UserContext.Provider value={userContext}>
                <SafeAreaProvider style={{ backgroundColor: 'black' }}>
                  {Platform.OS === 'ios' && (
                    <StatusBar animated barStyle="light-content" />
                  )}
                  <NavigationContainer
                    theme={CustomTheme}
                    ref={navRef}
                    onStateChange={handleRouteChange}
                  >
                    <ContentScreenProvider>
                      <AppNavigator />
                      <MiniPlayer currentScreen={currentScreen} />
                    </ContentScreenProvider>
                  </NavigationContainer>
                </SafeAreaProvider>
              </UserContext.Provider>
            </LocationContext.Provider>
          </MediaContext.Provider>
        </MiniPlayerStyleContext.Provider>
      </CommentContext.Provider>
    </AnimatedSplashScreen>
  );
}
