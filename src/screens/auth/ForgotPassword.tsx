import React, { useState, useContext } from 'react';
import { Auth } from '@aws-amplify/auth';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableWithoutFeedback,
  SafeAreaView,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import WhiteButton, {
  WhiteButtonAsync,
} from '../../components/buttons/WhiteButton';
import { Theme, Style } from '../../Theme.style';
import UserContext from '../../contexts/UserContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { MainStackParamList } from '../../navigation/AppNavigator';
import NoMedia from '../../components/NoMedia';
import PasswordRequirements from '../../components/auth/PasswordRequirements';

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
    fontFamily: Theme.fonts.fontFamilyRegular,
    borderWidth: 1,
    height: 56,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 20,
  },
  inputSelected: {
    backgroundColor: Theme.colors.gray1,
    borderColor: 'white',
    fontFamily: Theme.fonts.fontFamilyRegular,
    borderWidth: 3,
    height: 56,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 20,
  },
  headerTextActive: {
    color: 'white',
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
    StackNavigationProp<AuthStackParamList, 'ForgotPasswordScreen'>,
    StackNavigationProp<MainStackParamList, 'Auth'>
  >;
}

export default function ForgotPassword({ navigation }: Params): JSX.Element {
  const userContext = useContext(UserContext);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);

  function updateCodeState(state: boolean): void {
    setPass('');
    setCode('');
    setError('');
    setCodeSent(state);
  }

  function toLogin(): void {
    setPass('');
    setCode('');
    setError('');
    setCodeSent(false);
    navigation.push('LoginScreen', { email: user });
  }

  function toHome(): void {
    setUser('');
    setPass('');
    setCode('');
    setError('');
    setCodeSent(false);
    navigation.push('Main', {
      screen: 'Home',
    });
  }

  const sendCode = async () => {
    setSending(true);
    try {
      await Auth.forgotPassword(user).then(() => updateCodeState(true));
    } catch (e: any) {
      if (e?.code === 'UserNotFoundException') setError('Username not found.');
      else if (e?.code === 'InvalidPasswordException')
        setError(e?.message?.split(': ')?.[1]);
      else if (e?.code === 'InvalidParameterException')
        setError('Password not long enough');
      else setError(e?.message ?? 'An error occurred');
    }
    setSending(false);
  };

  const reset = async () => {
    setSending(true);
    try {
      await Auth.forgotPasswordSubmit(user, code, pass);
      updateCodeState(true);
      toLogin();
    } catch (e: any) {
      setError(e?.message ?? 'An error occurred');
    }
    setSending(false);
  };

  return (
    <NoMedia>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={{ width: '100%', flex: 1 }}>
          <SafeAreaView style={{ backgroundColor: 'black' }} />
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 20,
              backgroundColor: 'black',
            }}
          >
            <Text style={style.headerTextActive}>Reset your password</Text>
          </View>
          {!codeSent ? (
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
                onSubmitEditing={sendCode}
                keyboardAppearance="dark"
                autoCompleteType="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                style={style.input}
                value={user}
                autoCapitalize="none"
                onChange={(e) => setUser(e.nativeEvent.text.toLowerCase())}
              />
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    color: Theme.colors.red,
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
                label="Submit"
                onPress={sendCode}
                style={{ marginTop: 12, height: 56 }}
              />
              <TouchableOpacity
                onPress={() => updateCodeState(true)}
                style={{ alignSelf: 'flex-end' }}
              >
                <Text style={style.forgotPassText}>Submit a Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
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
              <Text style={style.title}>One-Time Security Code</Text>
              <TextInput
                accessibilityLabel="One-time security code"
                keyboardAppearance="dark"
                textContentType="oneTimeCode"
                keyboardType="number-pad"
                style={style.input}
                value={code}
                onChange={(e) => setCode(e.nativeEvent.text)}
              />
              <Text style={style.title}>New Password</Text>
              <TextInput
                accessibilityLabel="New Password"
                textContentType="newPassword"
                passwordRules="required: lower; required: upper; required: digit; required: special; minlength: 8;"
                keyboardAppearance="dark"
                onSubmitEditing={reset}
                value={pass}
                onChange={(e) => setPass(e.nativeEvent.text)}
                secureTextEntry
                style={style.input}
              />
              <PasswordRequirements password={pass} />
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    color: Theme.colors.red,
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
                label="Submit"
                onPress={reset}
                style={{ marginTop: 12, height: 56 }}
              />
            </View>
          )}
          <View
            style={{
              flexGrow: 0,
              paddingBottom: 52,
              backgroundColor: Theme.colors.background,
              paddingHorizontal: '5%',
            }}
          >
            <WhiteButton
              outlined
              label={
                // eslint-disable-next-line camelcase
                userContext?.userData?.email_verified
                  ? 'Back to home'
                  : 'Back to login'
              }
              onPress={
                // eslint-disable-next-line camelcase
                userContext?.userData?.email_verified
                  ? () => toHome()
                  : () => toLogin()
              }
              style={{ marginTop: 24, height: 56 }}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </NoMedia>
  );
}
