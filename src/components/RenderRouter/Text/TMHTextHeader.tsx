import { Text, StyleSheet } from 'react-native';
import React from 'react';
import Theme from '../../../Theme.style';
import { HeaderType } from '../ContentTypes';
import { useContentContext } from '../../../contexts/ContentScreenContext/ContentScreenContext';

const TextHeaderStyles = StyleSheet.create({
  header1: {
    marginHorizontal: 16,

    fontFamily: Theme.fonts.fontFamilyBold,
    fontSize: 32,
    lineHeight: 40,
  },
  header2: {
    marginHorizontal: 16,

    fontFamily: Theme.fonts.fontFamilyBold,
    fontSize: 24,
    lineHeight: 32,
  },
  header3: {
    marginHorizontal: 16,

    fontFamily: Theme.fonts.fontFamilyRegular, // TODO: import font weight 300, this should be
    fontSize: 24,
    lineHeight: 32,
  },
  header4: {
    marginHorizontal: 16,

    fontFamily: Theme.fonts.fontFamilyBold,
    fontSize: 16,
    lineHeight: 24,
  },
  header5: {
    marginHorizontal: 16,
    fontFamily: Theme.fonts.fontFamilyBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
});

export default function TMHTextHeader({ item }: { item: HeaderType }) {
  const { state } = useContentContext();
  const { fontColor } = state;
  const style = { ...TextHeaderStyles[item.style], color: fontColor };
  return <Text style={style}>{item.text}</Text>;
}
