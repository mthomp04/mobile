import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { Theme, Style } from '../../Theme.style';
import IconButton from '../buttons/IconButton';
import { GetNotesQuery } from '../../services/API';
import { MainStackParamList } from '../../navigation/AppNavigator';
import ActivityIndicator from '../ActivityIndicator';
import { VideoData } from '../../utils/types';
import FallbackImage from '../FallbackImage';

const screenWidth = Dimensions.get('window').width;

const style = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Theme.colors.black,
  },
  teachingImage: {
    width: screenWidth,
    height: (9 / 16) * screenWidth,
    position: 'absolute',
  },
  seriesImage: {
    alignSelf: 'center',
    width: screenWidth * 0.2133,
    height: screenWidth * 0.256,
    marginBottom: 24,
  },
  seriesImageWithTeachingImage: {
    marginTop: 32 + 0.75 * (9 / 16) * screenWidth,
  },
  episodeNumber: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.smallMedium,
    fontFamily: Theme.fonts.fontFamilyBold,
    marginBottom: 4,
  },
  title: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.extraLarge,
    fontFamily: Theme.fonts.fontFamilyBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: Theme.colors.gray5,
    fontSize: Theme.fonts.small,
    marginBottom: 14,
  },
  description: {
    ...Style.cardDescription,
    ...{
      color: Theme.colors.gray5,
      fontSize: Theme.fonts.medium,
      marginBottom: 32,
      textAlign: 'center',
    },
  },
});

interface Props {
  note: GetNotesQuery['getNotes'];
  teaching: VideoData;
}

export default function RecentTeaching({ note, teaching }: Props): JSX.Element {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const [fullDescription, setFullDescription] = useState(false);

  if (
    teaching &&
    moment(teaching.publishedDate).isSameOrAfter(moment(note?.id))
  ) {
    const seriesImageUri = `https://themeetinghouse.com/static/photos/series/adult-sunday-${teaching?.series?.title?.replace(
      '?',
      ''
    )}.jpg`;
    const teachingImage =
      teaching?.Youtube?.snippet?.thumbnails?.standard ??
      teaching?.Youtube?.snippet?.thumbnails?.high ??
      teaching?.Youtube?.snippet?.thumbnails?.medium ??
      null;

    const openNotes = () => {
      navigation.push('NotesScreen', {
        date: moment(teaching.publishedDate as string).format('YYYY-MM-DD'),
      });
    };

    return (
      <View style={style.container} testID="teaching-video">
        {teachingImage?.url ? (
          <View style={{ width: '100%' }}>
            <TouchableWithoutFeedback
              testID="go-to-teaching"
              onPress={() => {
                navigation.navigate('Main', { screen: 'Teaching' });
                navigation.navigate('SermonLandingScreen', { item: teaching });
              }}
            >
              <Image
                style={style.teachingImage}
                source={{ uri: teachingImage.url }}
              />
            </TouchableWithoutFeedback>
            <FallbackImage
              style={{
                ...style.seriesImage,
                ...style.seriesImageWithTeachingImage,
              }}
              uri={seriesImageUri}
              catchUri="https://www.themeetinghouse.com/static/photos/series/series-fallback-app.jpg"
            />
          </View>
        ) : (
          <FallbackImage
            style={style.seriesImage}
            uri={seriesImageUri}
            catchUri="https://www.themeetinghouse.com/static/photos/series/series-fallback-app.jpg"
          />
        )}
        <View style={{ marginHorizontal: 16, alignItems: 'center' }}>
          <Text style={style.title}>{teaching.episodeTitle}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={style.subtitle}>
              {moment(teaching.publishedDate as string).format('MMMM D, YYYY')}{' '}
              {teaching?.speakers?.items?.[0] ? 'by ' : ''}
            </Text>
            <TouchableHighlight
              testID="go-to-teacher"
              style={style.subtitle}
              onPress={() =>
                navigation.navigate('TeacherProfile', {
                  staff: {
                    idFromTeaching: teaching?.speakers?.items?.[0]?.speaker?.id,
                  },
                })
              }
            >
              <Text
                style={[style.subtitle, { textDecorationLine: 'underline' }]}
              >
                {teaching?.speakers?.items?.[0]
                  ? `${teaching?.speakers?.items?.[0]?.speaker?.id}`
                  : ''}
              </Text>
            </TouchableHighlight>
          </View>
          <Text
            testID="description"
            style={style.description}
            numberOfLines={fullDescription ? undefined : 2}
            ellipsizeMode="tail"
            onPress={() => setFullDescription(!fullDescription)}
          >
            {teaching.description}
          </Text>
        </View>
        {moment(teaching.publishedDate).isSame(moment(note?.id)) && (
          <View testID="notes-button">
            <IconButton
              icon={Theme.icons.white.notes}
              label="Notes"
              onPress={openNotes}
            />
          </View>
        )}
      </View>
    );
  }
  if (note) {
    const seriesImageUri = `https://themeetinghouse.com/static/photos/series/adult-sunday-${note?.seriesId.replace(
      '?',
      ''
    )}.jpg`;
    const openNotes = () => {
      navigation.navigate('NotesScreen', { date: note.id });
    };
    return (
      <View style={style.container} testID="teaching-notes">
        <FallbackImage
          style={style.seriesImage}
          uri={seriesImageUri}
          catchUri="https://www.themeetinghouse.com/static/photos/series/series-fallback-app.jpg"
        />
        <View style={{ marginHorizontal: 16, alignItems: 'center' }}>
          <Text style={style.title}>{note.title}</Text>
          <Text style={style.subtitle}>
            {moment(note.id).format('MMMM D, YYYY')}
          </Text>
          <Text
            testID="description"
            style={style.description}
            numberOfLines={fullDescription ? undefined : 2}
            ellipsizeMode="tail"
            onPress={() => setFullDescription(!fullDescription)}
          >
            {note.episodeDescription}
          </Text>
        </View>
        <View testID="notes-button">
          <IconButton
            icon={Theme.icons.white.notes}
            label="Notes"
            onPress={openNotes}
          />
        </View>
      </View>
    );
  }

  return <ActivityIndicator />;
}
