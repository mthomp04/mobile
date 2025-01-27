import React, {
  useState,
  useEffect,
  useRef,
  Fragment,
  useLayoutEffect,
} from 'react';
import moment from 'moment';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
  View,
  Text,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import API, { graphqlOperation, GraphQLResult } from '@aws-amplify/api';
import useDebounce from '../../../src/hooks/useDebounce';
import TeachingListItem from '../../components/teaching/TeachingListItem';
import SeriesService, { SeriesHighlights } from '../../services/SeriesService';
import ActivityIndicator from '../../components/ActivityIndicator';
import { TeachingStackParamList } from '../../navigation/MainTabNavigator';
import ShareModal from '../../components/modals/Share';
import { MainStackParamList } from '../../navigation/AppNavigator';
import { Theme, Style, HeaderStyle } from '../../Theme.style';
import { GetCustomPlaylistQuery, GetSeriesQuery } from '../../services/API';
import { FallbackImageBackground } from '../../components/FallbackImage';
import { getSeries, getCustomPlaylist } from '../../graphql/queries';

const isTablet = Dimensions.get('screen').width >= 768;

const style = StyleSheet.create({
  content: {
    ...Style.cardContainer,
    ...{
      backgroundColor: Theme.colors.black,
    },
  },
  header: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 100,
    top: 0,
    left: 0,
    right: 0,
  },
  headerLeft: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 50,
  },
  headerBody: {
    flexGrow: 3,
    justifyContent: 'center',
  },
  headerRight: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 50,
  },
  headerTitle: {
    ...HeaderStyle.title,
    ...{
      width: '100%',
    },
  },
  title: {
    ...Style.title,
    ...{
      fontSize: Theme.fonts.large,
    },
  },
  body: Style.body,
  seriesImage: {
    width: Dimensions.get('screen').width,
    height:
      (isTablet ? 1024 / 1280 : 1061 / 848) * Dimensions.get('screen').width,
  },
  highlightsText: {
    fontFamily: Theme.fonts.fontFamilyRegular,
    fontSize: Theme.fonts.medium,
    color: Theme.colors.gray5,
    marginLeft: 16,
    marginTop: -10,
  },
  categoryTitle: {
    ...Style.categoryTitle,
    ...{
      marginTop: 16,
    },
  },
  categorySection: {
    backgroundColor: Theme.colors.black,
    paddingTop: 16,
    marginBottom: 16,
  },
  lastHorizontalListItem: {
    marginRight: 16,
  },
  highlightsThumbnail: {
    width: 80 * (16 / 9),
    height: 80,
    marginLeft: 16,
  },
  horizontalListContentContainer: {
    marginTop: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  detailsTitle: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.fontFamilyBold,
    fontSize: Theme.fonts.extraLarge,
    marginBottom: 8,
  },
  detailsText: {
    color: Theme.colors.gray5,
    fontSize: Theme.fonts.medium,
  },
  descriptionText: {
    ...Style.body,
    ...{
      marginTop: 24,
    },
  },

  listContentContainer: {
    paddingLeft: 16,
    paddingRight: 16,
    marginTop: 16,
    marginBottom: 16,
  },

  detailsContainer: {
    position: 'absolute',
    top:
      (isTablet ? 1024 / 1280 : 1061 / 848) * Dimensions.get('screen').width -
      75,
    padding: 16,
  },
  seriesContainer: {
    marginTop: 75,
  },
  headerButtonText: HeaderStyle.linkText,
});

type VideoData =
  | NonNullable<NonNullable<GetSeriesQuery['getSeries']>['videos']>['items']
  | Array<
      NonNullable<
        NonNullable<
          NonNullable<
            NonNullable<GetCustomPlaylistQuery['getCustomPlaylist']>['videos']
          >['items']
        >[0]
      >['video']
    >;

interface Params {
  navigation: StackNavigationProp<MainStackParamList>;
  route: RouteProp<TeachingStackParamList, 'SeriesLandingScreen'>;
}

export default function SeriesLandingScreen({
  navigation,
  route,
}: Params): JSX.Element {
  const { debounce } = useDebounce();
  const seriesParam = route.params?.item;
  const { seriesId, customPlaylist } = route.params;
  const safeArea = useSafeAreaInsets();

  const [series, setSeries] = useState(seriesParam);
  const [contentFills, setContentFills] = useState(false);
  const [videos, setVideos] = useState<VideoData>();

  const [share, setShare] = useState(false);
  const [seriesHighlights, setSeriesHighlights] = useState<SeriesHighlights>({
    loading: true,
    items: [],
    nextToken: '',
  });
  const { colors } = useTheme();
  const loadHighlights = async () => {
    if (series?.title) {
      const highlightsResult = await SeriesService.loadSeriesHighlights(
        200,
        series?.title,
        seriesHighlights.nextToken
      );
      setSeriesHighlights(highlightsResult);
    }
  };
  const yOffset = useRef(new Animated.Value(0)).current;
  const headerOpacity = yOffset.interpolate({
    inputRange: [0, 75],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerBackground: function render() {
        return (
          <Animated.View
            style={{
              backgroundColor: Theme.colors.background,
              ...StyleSheet.absoluteFillObject,
              opacity: contentFills ? headerOpacity : 0,
              borderBottomColor: Theme.colors.gray2,
              borderBottomWidth: StyleSheet.hairlineWidth,
            }}
          />
        );
      },
      title: '',
      safeAreaInsets: { top: safeArea.top },
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
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                transform: [{ translateX: -4 }],
              }}
            >
              Teaching
            </Text>
          </TouchableOpacity>
        );
      },
      headerRight: function render() {
        return (
          <TouchableOpacity onPress={() => setShare(!share)}>
            <Image
              accessibilityLabel="Share"
              source={Theme.icons.white.share}
              style={{ width: 24, height: 24 }}
            />
          </TouchableOpacity>
        );
      },
      headerStyle: {
        backgroundColor: Theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.gray2,
        shadowOpacity: 0,
        elevation: 0,
      },
      headerLeftContainerStyle: { left: 16 },
      headerRightContainerStyle: { right: 16 },
    });
  }, [
    colors.border,
    contentFills,
    headerOpacity,
    navigation,
    safeArea.top,
    share,
  ]);
  useEffect(() => {
    const loadSermonsInSeriesAsync = async () => {
      let loadedSeries = series;
      if (!loadedSeries && seriesId) {
        loadedSeries = await SeriesService.loadSeriesById(seriesId);
        setSeries(loadedSeries);
      }
      if (!customPlaylist) {
        const json = (await API.graphql(
          graphqlOperation(getSeries, { id: seriesId ?? series.id })
        )) as GraphQLResult<GetSeriesQuery>;
        setSeries({ ...json?.data?.getSeries });
        setVideos(json.data?.getSeries?.videos?.items);
      } else {
        const json = (await API.graphql(
          graphqlOperation(getCustomPlaylist, { id: series.id })
        )) as GraphQLResult<GetCustomPlaylistQuery>;
        setVideos(
          json.data?.getCustomPlaylist?.videos?.items?.map((item) => {
            return item?.video ?? null;
          })
        );
      }
    };
    loadSermonsInSeriesAsync();
    loadHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customPlaylist, seriesId]);

  function handleOnLayout(height: number) {
    if (height > Dimensions.get('screen').height) {
      setContentFills(true);
    }
  }
  const getTeachingImage = (teaching: any) => {
    const { thumbnails } = teaching?.Youtube?.snippet;
    return (
      thumbnails?.standard?.url ??
      thumbnails?.maxres?.url ??
      thumbnails?.high?.url
    );
  };
  return (
    <>
      <Animated.ScrollView
        style={[style.content, { marginTop: -safeArea.top }]}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: yOffset,
                },
              },
            },
          ],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {series ? (
          <View onLayout={(e) => handleOnLayout(e.nativeEvent.layout.height)}>
            <FallbackImageBackground
              style={style.seriesImage}
              uri={isTablet ? series.heroImage : series.image640px}
              catchUri="https://www.themeetinghouse.com/static/photos/series/series-fallback.jpg"
            >
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.85)',
                  'rgba(0,0,0,0.15)',
                  'rgba(0,0,0,0)',
                  'rgba(0,0,0,0.5)',
                  'rgba(0,0,0,0.8)',
                  'rgba(0,0,0,1)',
                ]}
                locations={[0, 0.12, 0.26, 0.6, 0.8, 1]}
                style={{
                  position: 'absolute',
                  height: '100%',
                  width: '100%',
                }}
              />
            </FallbackImageBackground>
            <View style={style.detailsContainer}>
              <Text style={style.detailsTitle}>{series?.title}</Text>
              <View>
                {!route?.params?.customPlaylist && series ? (
                  <Text style={style.detailsText}>
                    {moment(series.startDate).year()} &bull;{' '}
                    {series.videos?.items?.length}{' '}
                    {series.videos?.items?.length === 1
                      ? 'episode'
                      : 'episodes'}
                  </Text>
                ) : (
                  <Text style={style.detailsText}>
                    {series.videos?.items?.length}{' '}
                    {series.videos?.items?.length === 1
                      ? 'episode'
                      : 'episodes'}
                  </Text>
                )}
              </View>
            </View>
            <View style={style.seriesContainer}>
              <View style={style.listContentContainer}>
                {!videos ? (
                  <ActivityIndicator />
                ) : (
                  videos
                    .sort((a, b) => {
                      if (route?.params?.customPlaylist)
                        return (b?.publishedDate ?? '')?.localeCompare(
                          a?.publishedDate ?? ''
                        );

                      const aNum = a?.episodeNumber ?? 0;
                      const bNum = b?.episodeNumber ?? 0;
                      return bNum - aNum;
                    })
                    .map((seriesSermon) => {
                      return (
                        <TeachingListItem
                          key={seriesSermon?.id}
                          teaching={seriesSermon as any}
                          handlePress={() =>
                            debounce(() =>
                              navigation.push(
                                'SermonLandingScreen',
                                route?.params?.customPlaylist
                                  ? {
                                      item: seriesSermon,
                                      customPlaylist:
                                        route?.params?.customPlaylist,
                                      seriesId,
                                    }
                                  : { item: seriesSermon }
                              )
                            )
                          }
                        />
                      );
                    })
                )}
              </View>
            </View>
          </View>
        ) : null}
        {seriesHighlights.items.length > 0 ? (
          <View style={[style.categorySection, { marginBottom: 32 }]}>
            <Text style={style.categoryTitle}>Highlights</Text>
            <Text style={style.highlightsText}>Short snippets of teaching</Text>
            <FlatList
              contentContainerStyle={style.horizontalListContentContainer}
              getItemLayout={(data, index) => {
                return {
                  length: 80 * (16 / 9),
                  offset: 80 * (16 / 9) + 16,
                  index,
                };
              }}
              horizontal
              data={seriesHighlights.items}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('HighlightScreen', {
                      highlights: seriesHighlights.items.slice(index),
                      nextToken: seriesHighlights.nextToken,
                      fromSeries: true,
                    });
                  }}
                >
                  <Image
                    style={style.highlightsThumbnail}
                    source={{ uri: getTeachingImage(item) }}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        ) : null}
      </Animated.ScrollView>
      {share ? (
        <ShareModal
          closeCallback={() => setShare(false)}
          noBottomPadding
          link={`https://www.themeetinghouse.com/videos/${encodeURIComponent(
            series?.title.trim()
          )}/${videos?.slice(-1)[0]?.id}`}
          message={series?.title}
        />
      ) : null}
    </>
  );
}
