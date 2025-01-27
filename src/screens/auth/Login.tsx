import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { Auth } from '@aws-amplify/auth';
import { Analytics } from '@aws-amplify/analytics';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  CompositeNavigationProp,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Theme, Style } from '../../Theme.style';
import WhiteButton, {
  WhiteButtonAsync,
} from '../../components/buttons/WhiteButton';
import UserContext, { TMHCognitoUser } from '../../contexts/UserContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { MainStackParamList } from '../../navigation/AppNavigator';
import LocationContext from '../../contexts/LocationContext';
import LocationsService from '../../services/LocationsService';
import NoMedia from '../../components/NoMedia';

const style = StyleSheet.create({
  title: {
    ...Style.cardTitle,
    ...{
      paddingLeft: 0,
      paddingTop: 26,
      lineHeight: 24,
    },
  },
  input: {
    backgroundColor: Theme.colors.gray1,
    borderColor: Theme.colors.grey3,
    borderWidth: 1,
    height: 56,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 20,
  },
  inputSelected: {
    backgroundColor: Theme.colors.gray1,
    borderColor: 'white',
    borderWidth: 3,
    height: 56,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 20,
  },
  picker: {
    backgroundColor: Theme.colors.gray1,
    borderColor: Theme.colors.grey3,
    borderWidth: 1,
    height: 56,
    borderRadius: 0,
  },
  headerTextActive: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Theme.fonts.fontFamilyBold,
    paddingHorizontal: 16,
  },
  headerTextInactive: {
    color: Theme.colors.grey4,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Theme.fonts.fontFamilyBold,
    paddingHorizontal: 16,
  },
  forgotPassText: {
    color: Theme.colors.grey5,
    fontFamily: Theme.fonts.fontFamilyRegular,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
  },
});

interface Params {
  navigation: CompositeNavigationProp<
    StackNavigationProp<AuthStackParamList, 'LoginScreen'>,
    StackNavigationProp<MainStackParamList, 'Auth'>
  >;
}

const accountVerifiedMessage = 'Your account is verified. Please log in.';

export default function Login({ navigation }: Params): JSX.Element {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const safeArea = useSafeAreaInsets();
  const userContext = useContext(UserContext);
  const location = useContext(LocationContext);
  const route = useRoute<RouteProp<AuthStackParamList, 'LoginScreen'>>();

  useEffect(() => {
    if (route.params?.newUser) {
      setError(accountVerifiedMessage);
    }

    if (route.params?.email) {
      setUser(route.params.email);
    }
  }, [route.params?.newUser, route.params?.email]);

  function navigateInAuthStack(screen: keyof AuthStackParamList): void {
    setUser('');
    setPass('');
    setError('');
    navigation.push(screen);
  }

  function navigateHome(): void {
    setUser('');
    setPass('');
    setError('');
    navigation.push('Main', {
      screen: 'Home',
    });
  }

  const mapObj = (f: any) => (obj: any) =>
    Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: f(obj[key]) }), {});
  const toArrayOfStrings = (value: any) => [`${value}`];
  const mapToArrayOfStrings = mapObj(toArrayOfStrings);

  async function trackUserId(cognitoUser: TMHCognitoUser) {
    try {
      const { attributes } = cognitoUser;
      const userAttributes = mapToArrayOfStrings(attributes);
      const groups = cognitoUser.getSignInUserSession()?.getAccessToken()
        ?.payload?.['cognito:groups'];
      const token = (await Notifications.getDevicePushTokenAsync()).data;
      await Analytics.updateEndpoint({
        address: token,
        channelType: Platform.OS === 'ios' ? 'APNS' : 'GCM',
        optOut: 'NONE',
        userId: attributes?.sub,
        userAttributes,
        attributes: {
          groups,
        },
      });
    } catch (e) {
      console.log(e);
    }
  }
  const signIn = async () => {
    setSending(true);
    try {
      await Auth.signIn(user, pass);
      const userSignedIn: TMHCognitoUser =
        await Auth.currentAuthenticatedUser();
      await trackUserId(userSignedIn);
      Analytics.record({
        name: 'login',
      }).catch((e) => {
        console.log({ error: e });
      });

      userContext?.setUserData(userSignedIn.attributes);
      if (userSignedIn.attributes)
        location?.setLocationData({
          locationId: userSignedIn.attributes['custom:home_location'] ?? '',
          locationName: LocationsService.mapLocationIdToName(
            userSignedIn.attributes['custom:home_location'] ?? ''
          ),
        });
      navigateHome();
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred');
    }
    setSending(false);
  };

  return (
    <NoMedia>
      <ScrollView
        style={{ width: '100%', paddingTop: safeArea.top }}
        contentContainerStyle={{
          minHeight:
            Platform.OS === 'android'
              ? Dimensions.get('window').height -
                (StatusBar.currentHeight ?? 24)
              : Dimensions.get('screen').height - safeArea.top,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
          }}
        >
          <TouchableOpacity
            style={{ position: 'absolute', left: 16, paddingTop: 4 }}
            onPress={() => navigateHome()}
          >
            <Image
              accessibilityLabel="Close Button"
              source={Theme.icons.white.closeCancel}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
          <Text style={style.headerTextActive}>Login</Text>
          <Text
            onPress={() => navigateInAuthStack('SignUpScreen')}
            style={style.headerTextInactive}
          >
            Sign Up
          </Text>
        </View>
        <View
          style={{
            flexGrow: 1,
            backgroundColor: 'black',
            width: '100%',
            paddingHorizontal: '5%',
            paddingBottom: 56,
          }}
        >
          <Text style={style.title}>Email</Text>
          <TextInput
            accessibilityLabel="Email Address"
            keyboardAppearance="dark"
            autoCompleteType="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            style={style.input}
            value={user}
            autoCapitalize="none"
            onChange={(e) => setUser(e.nativeEvent.text.toLowerCase())}
          />
          <Text style={style.title}>Password</Text>
          <TextInput
            accessibilityLabel="Password"
            keyboardAppearance="dark"
            autoCompleteType="password"
            textContentType="password"
            onSubmitEditing={signIn}
            value={pass}
            onChange={(e) => setPass(e.nativeEvent.text)}
            secureTextEntry
            style={style.input}
          />
          <TouchableOpacity
            onPress={() => navigateInAuthStack('ForgotPasswordScreen')}
            style={{ alignSelf: 'flex-end' }}
          >
            <Text style={style.forgotPassText}>Forgot Password?</Text>
          </TouchableOpacity>
          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                color:
                  error === accountVerifiedMessage
                    ? Theme.colors.green
                    : Theme.colors.red,
                alignSelf: 'center',
                fontFamily: Theme.fonts.fontFamilyRegular,
                fontSize: 12,
              }}
            >
              {error}
            </Text>
          </View>
          <WhiteButtonAsync
            isLoading={sending}
            label="Log In"
            onPress={signIn}
            style={{ marginTop: 12, height: 56 }}
          />
        </View>
        <View
          style={{
            flexGrow: 0,
            paddingVertical: 16,
            paddingBottom: 52,
            backgroundColor: Theme.colors.background,
            paddingHorizontal: '5%',
          }}
        >
          <Text
            style={{
              color: Theme.colors.grey5,
              alignSelf: 'center',
              fontSize: 16,
              fontFamily: Theme.fonts.fontFamilyRegular,
            }}
          >
            Don&apos;t have an account?
          </Text>
          <WhiteButton
            outlined
            label="Sign Up"
            onPress={() => navigateInAuthStack('SignUpScreen')}
            style={{ marginTop: 12, height: 56 }}
          />
        </View>
      </ScrollView>
    </NoMedia>
  );
}
