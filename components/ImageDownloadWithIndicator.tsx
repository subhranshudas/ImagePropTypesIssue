// @ts-nocheck
import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableWithoutFeedback,
  ViewStyle,
  Text,
} from 'react-native';
import * as FileSystem from 'expo-file-system';

import ProgressCircle from 'react-native-progress-circle';
import EPNSActivity from './EPNSActivity';
import DownloadHelper from './DownloadHelper';
import GLOBALS from './globals';

const MAX_ATTEMPTS = 3;

type ImageDownloadWithIndicatorProps = {
  style: ViewStyle;
  fileURL?: string;
  imgsrc?: string | boolean;
  miniProgressLoader?: boolean;
  margin?: number;
  resizeMode?: string;
};

type ImageDownloadWithIndicatorPropsState = {
  indicator: boolean;
  downloading: boolean;
  downloadProgress: number;
  fileURI: string;
  attemptNumber: number;
  defaulted: boolean;
};

export default class ImageDownloadWithIndicator extends Component<
  ImageDownloadWithIndicatorProps,
  ImageDownloadWithIndicatorPropsState
> {
  // CONSTRUCTOR
  constructor(props: ImageDownloadWithIndicatorProps) {
    super(props);

    this.state = {
      indicator: false,
      downloading: true,
      downloadProgress: 0,
      fileURI: '',

      attemptNumber: 0,
      defaulted: false,
    };

    // Set Mounted
    this._isMounted = false;
  }

  // COMPONENT MOUNTED
  componentDidMount() {
    // Start Operation
    this._isMounted = true;
    this.checkAndInitiateOperation(this.props.fileURL);
  }

  // COMPONENT UPDATED
  componentDidUpdate(prevProps) {
    // Check for prop change
    if (this.props.fileURL !== prevProps.fileURL) {
      this.setState({
        indicator: true,
        downloading: true,
        downloadProgress: 0,
        fileURI: '',
      });

      this.checkAndInitiateOperation(this.props.fileURL);
    }
  }

  // COMPONENT UNMOUNTED
  componentWillUnmount() {
    this._isMounted = false;
  }

  // FUNCTIONS
  // Check
  checkAndInitiateOperation = async fileURL => {
    if (this.props.imgsrc) {
      // Do Nothing, this is already loaded image
      this.setState({
        indicator: false,
        downloading: false,
        downloadProgress: '100%',
        fileURI: this.props.imgsrc,
      });

      return;
    }

    const localFileURI = DownloadHelper.getActualSaveLocation(fileURL);
    const localFileInfo = await FileSystem.getInfoAsync(localFileURI);

    if (localFileInfo.exists) {
      if (this._isMounted) {
        this.setState({
          indicator: false,
          downloading: false,
          downloadProgress: 100,
          fileURI: localFileURI,
        });
      }

      // console.log("File Exists on: |" + localFileURI + "|");
    } else {
      if (this.state.attemptNumber <= MAX_ATTEMPTS) {
        if (this._isMounted) {
          this.setState({
            indicator: false,
            downloading: true,
            downloadProgress: 0,
            attemptNumber: this.state.attemptNumber + 1,
          });
        }

        await this.startDownload(fileURL);
      } else {
        // Image can't be retrieved, Display bad image
        // this.setState({
        //   indicator: false,
        //   downloading: false,
        //   downloadProgress: '100%',
        //   fileURI: noImageLoadedURI,
        //   defaulted: true,
        // });
      }
    }
  };

  // To Start Download
  startDownload = async fileURL => {
    const localFileTempURI = DownloadHelper.getTempSaveLocation(fileURL);

    // Create File Download
    const downloadResumable = FileSystem.createDownloadResumable(
      fileURL,
      localFileTempURI,
      {},
      dwProg => {
        const progress =
          dwProg.totalBytesWritten / dwProg.totalBytesExpectedToWrite;
        const progressPerc = Number((progress * 100).toFixed(2));
        //console.log("Progress for " + fileURL + ": " + progressPerc);

        if (this._isMounted) {
          this.setState({
            downloadProgress: progressPerc,
          });
        }
      },
    );

    // Initiate
    try {
      const {uri} = await downloadResumable.downloadAsync();
      // console.log("MOVING");
      // console.log(uri);
      // console.log(DownloadHelper.getActualSaveLocation(fileURL));

      // Download completed, move file to actual location
      try {
        await FileSystem.moveAsync({
          from: uri,
          to: DownloadHelper.getActualSaveLocation(fileURL),
        });
      } catch (e) {
        console.warn(e);
      }

      // Go Back to check and initiate operation
      await this.checkAndInitiateOperation(fileURL);
    } catch (e) {
      console.warn(e);
    }
  };

  // RENDER THUMBNAIL

  // RENDER
  render() {
    const {style, imgsrc, miniProgressLoader, margin, resizeMode, onPress} =
      this.props;

    let contentContainerStyle = {};
    if (margin) {
      contentContainerStyle.margin = margin;
    }

    let modifiedResizeMode = resizeMode;
    if (this.state.defaulted) {
      modifiedResizeMode = 'center';
    }

    return (
      <TouchableWithoutFeedback
        style={[styles.container]}
        onPress={() => {
          if (onPress) {
            onPress(this.state.fileURI);
          }
        }}
        disabled={!onPress ? true : false}>
        <View style={[styles.innerContainer, style]}>
          <View style={[styles.contentContainer, contentContainerStyle]}>
            {this.state.indicator ? (
              <EPNSActivity style={styles.activity} size="small" />
            ) : this.state.downloading ? (
              <View style={styles.downloading}>
                {miniProgressLoader === true ? (
                  <EPNSActivity style={styles.activity} size="small" />
                ) : (
                  // <ProgressCircle
                  //   percent={this.state.downloadProgress}
                  //   radius={20}
                  //   borderWidth={20}
                  //   color={GLOBALS.COLORS.GRADIENT_SECONDARY}
                  //   shadowColor={GLOBALS.COLORS.LIGHT_GRAY}
                  //   bgColor={GLOBALS.COLORS.WHITE}
                  // />
                  <Text>poc test</Text>
                )}
              </View>
            ) : imgsrc !== false || this.state.defaulted === true ? (
              <Image
                style={styles.image}
                source={
                  this.state.defaulted
                    ? require('./assets/frownface.png')
                    : {uri: imgsrc}
                }
                resizeMode={modifiedResizeMode}
              />
            ) : (
              <Image
                style={styles.image}
                source={{uri: `${this.state.fileURI}`}}
                resizeMode={resizeMode}
              />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
    width: '100%',
    overflow: 'hidden',
  },
  downloading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 40,
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});
