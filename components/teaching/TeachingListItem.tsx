import React from 'react';
import { View, Text } from 'native-base';
import Theme from '../../Theme.style';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';
import moment from 'moment';
import { LoadSermonResult } from '../../services/SermonsService';

const style = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "row",
        marginBottom: 16,
    },
    thumbnail: {
        width: 158,
        height: 88,
        flexShrink: 0,
    },
    title: {
        fontFamily: Theme.fonts.fontFamilyBold,
        fontSize: Theme.fonts.smallMedium,
        color: Theme.colors.white,
        flexWrap: 'wrap',
        lineHeight: 18,
    },
    detailsContainer: {
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 16,
        flexWrap: 'nowrap',
        flexShrink: 1,
    },
    detailText1: {
        fontFamily: Theme.fonts.fontFamilyRegular,
        fontSize: Theme.fonts.small,
        color: Theme.colors.white,
        lineHeight: 18
    },
    detailText2: {
        fontFamily: Theme.fonts.fontFamilyRegular,
        fontSize: Theme.fonts.small,
        color: Theme.colors.gray5,
        lineHeight: 18
    },
})

interface Params {
    handlePress: () => any;
    teaching: NonNullable<LoadSermonResult['items']>[0];
}

export default function TeachingListItem({ teaching, handlePress }: Params): JSX.Element {
    //console.log("TeachingListItem(): teaching = ", teaching);
    let imageUrl = "";
    if (teaching?.Youtube?.snippet?.thumbnails?.standard) {
        imageUrl = teaching.Youtube.snippet.thumbnails.standard.url ?? "";
    } else if (teaching?.Youtube?.snippet?.thumbnails?.high) {
        imageUrl = teaching.Youtube.snippet.thumbnails.high.url ?? "";
    }
    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={style.container}>
                <Image style={style.thumbnail} source={{ uri: imageUrl }}></Image>
                {/* <Thumbnail style={style.thumbnail} source={teaching.thumbnail} square ></Thumbnail> */}
                <View style={style.detailsContainer}>
                    <Text style={style.title}>{teaching?.episodeTitle}</Text>
                    <Text style={style.detailText1}>{teaching?.episodeNumber ? `E${teaching?.episodeNumber},` : ''} {teaching?.seriesTitle}</Text>
                    {teaching?.publishedDate ?
                        <Text style={style.detailText2}>
                            {moment(teaching?.publishedDate).format("MMMM, D, YYYY")}
                        </Text> : null
                    }
                </View>
            </View>
        </TouchableOpacity>
    )
}