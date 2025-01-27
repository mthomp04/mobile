import React, { memo, useLayoutEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Theme, Style, HeaderStyle } from '../../Theme.style';

import { MainStackParamList } from '../../navigation/AppNavigator';
import EventCard from '../../components/home/EventCard';

const style = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: Style.header,
  headerTitle: HeaderStyle.title,
  listContentContainer: {
    flex: 1,
  },
});

interface Props {
  navigation: StackNavigationProp<MainStackParamList>;
  route: RouteProp<MainStackParamList, 'AllEvents'>;
}

function AllEvents({ navigation, route }: Props): JSX.Element {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'All Events',
      headerTitleStyle: style.headerTitle,
      headerStyle: { backgroundColor: Theme.colors.black },
      headerLeft: function render() {
        return (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Image
              source={Theme.icons.white.back}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
        );
      },
      headerLeftContainerStyle: { left: 16 },
      headerRight: function render() {
        return <View style={{ flex: 1 }} />;
      },
    });
  }, [navigation]);
  return (
    <ScrollView>
      {route?.params?.events
        ? route.params.events.map((event) => {
            return (
              <EventCard
                key={event?.id}
                event={event}
                handlePress={() =>
                  navigation.push('Main', {
                    screen: 'Home',
                    params: {
                      screen: 'EventDetailsScreen',
                      params: {
                        item: event,
                      },
                    },
                  })
                }
              />
            );
          })
        : null}
      <View style={{ height: 82, backgroundColor: Theme.colors.black }} />
    </ScrollView>
  );
}

export default memo(AllEvents);
