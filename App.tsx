/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {type PropsWithChildren} from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  Image,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import EPNSActivity from './components/EPNSActivity';
import ImageDownloadWithIndicator from './components/ImageDownloadWithIndicator';
// import ImageDownloadWithIndicator from './components/ImageView';

import Data from './data';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      {/* <EPNSActivity size="small" /> */}

      <Text>Hello World React Native</Text>

      <View style={styles.list}>
        {Data.map(({icon, appbot}, idx) => {
          let iconURL = icon;
          if (appbot === '1') {
            iconURL = require('./components/assets/epnsbot.png');
          }

          return (
            <ImageDownloadWithIndicator
              key={idx}
              style={styles.appicon}
              fileURL={appbot ? '' : iconURL}
              imgsrc={appbot ? iconURL : ''}
              miniProgressLoader={true}
              margin={2}
              resizeMode="cover"
            />
          );
        })}
      </View>

      <Text>Image Poc ends</Text>

      <Image
        style={styles.appicon}
        source={require('./components/assets/epnsbot.png')}
        resizeMode={'cover'} // cover or contain its upto you view look
      />

      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  image: {
    borderColor: 'blue',
    margin: 1,
    width: 200,
    height: 100,
  },
  appicon: {
    width: 60,
    height: 60,
  },
  list: {
    display: 'flex',
    flexDirection: 'row',
  },
});

export default App;
