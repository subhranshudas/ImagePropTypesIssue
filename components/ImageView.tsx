import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Image,
  TouchableWithoutFeedback,
  ViewStyle,
  ImageResizeMode,
  Text,
} from 'react-native';

import * as FileSystem from 'expo-file-system';

import ProgressCircle from 'react-native-progress-circle';
import EPNSActivity from './EPNSActivity';
import DownloadHelper from './DownloadHelper';
import GLOBALS from './globals';

const MAX_ATTEMPTS = 3;

const usePrevious = <T extends unknown>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};

type ImageDownloadWithIndicatorProps = {
  style: ViewStyle;
  fileURL?: string;
  imgsrc?: string;
  miniProgressLoader?: boolean;
  margin?: number;
  resizeMode?: ImageResizeMode;
  onPress?: (arg0: string) => void;
};

const ImageDownloadWithIndicator = (props: ImageDownloadWithIndicatorProps) => {
  const [indicator, setIndicator] = useState(false);
  const [downloading, setDownloading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [fileURI, setFileURI] = useState('');
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [defaulted, setDefaulted] = useState(false);

  const _isMounted = useRef(false);

  const previousFileUrl = usePrevious(props.fileURL);

  // derived values
  let contentContainerStyle: any = {};

  if (props.margin) {
    contentContainerStyle.margin = props.margin;
  }

  let modifiedResizeMode = props.resizeMode;
  if (defaulted) {
    modifiedResizeMode = 'center';
  }

  // To Start Download
  const startDownload = async (_fileURL?: string) => {
    const localFileTempURI = DownloadHelper.getTempSaveLocation(_fileURL || '');

    // Create File Download
    const downloadResumable = FileSystem.createDownloadResumable(
      _fileURL || '',
      localFileTempURI,
      {},
      dwProg => {
        const progress =
          dwProg.totalBytesWritten / dwProg.totalBytesExpectedToWrite;
        const progressPerc = Number((progress * 100).toFixed(2));
        // console.log('Progress for ' + _fileURL + ': ' + progressPerc);

        if (_isMounted.current) {
          setDownloadProgress(progressPerc);
        }
      },
    );

    // Initiate
    try {
      const downloadResult = await downloadResumable.downloadAsync();
      // console.log("MOVING");
      // console.log(uri);
      // console.log(DownloadHelper.getActualSaveLocation(fileURL));

      // Download completed, move file to actual location
      try {
        await FileSystem.moveAsync({
          from: downloadResult?.uri || '',
          to: DownloadHelper.getActualSaveLocation(_fileURL || ''),
        });
      } catch (e) {
        console.warn(e);
      }

      // Go Back to check and initiate operation
      await checkAndInitiateOperation(_fileURL || '');
    } catch (e) {
      console.warn(e);
    }
  };

  // Check
  const checkAndInitiateOperation = async (_fileURL?: string) => {
    // Do Nothing, this is already loaded image
    if (props.imgsrc) {
      setIndicator(false);
      setDownloading(false);
      setDownloadProgress(100);
      setFileURI(props.imgsrc);
      return;
    }

    const localFileURI = DownloadHelper.getActualSaveLocation(_fileURL || '');
    const localFileInfo = await FileSystem.getInfoAsync(localFileURI);

    if (localFileInfo.exists) {
      if (_isMounted.current) {
        setIndicator(false);
        setDownloading(false);
        setDownloadProgress(100);
        setFileURI(localFileURI);
      } else {
        if (attemptNumber <= MAX_ATTEMPTS) {
          if (_isMounted.current) {
            setIndicator(false);
            setDownloading(true);
            setDownloadProgress(0);
            setAttemptNumber(attemptNumber + 1);
          }

          await startDownload(_fileURL);
        } else {
          // Image can't be retrieved, Display bad image
          setIndicator(false);
          setDownloading(false);
          setDownloadProgress(100);
          setFileURI(require('./assets/frownface.png'));
          setDefaulted(true);
        }
      }
    }
  };

  // mount
  useEffect(() => {
    _isMounted.current = true;
    checkAndInitiateOperation(props.fileURL);

    return () => {
      _isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fileURL change
  useEffect(() => {
    // Check for prop change
    if (previousFileUrl !== props.fileURL) {
      setIndicator(true);
      setDownloading(true);
      setDownloadProgress(0);
      setFileURI('');

      checkAndInitiateOperation(props.fileURL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.fileURL]);

  return (
    <TouchableWithoutFeedback
      style={[styles.container]}
      onPress={() => {
        if (props.onPress) {
          props.onPress(fileURI);
        }
      }}
      disabled={!props.onPress ? true : false}>
      <View style={[styles.innerContainer, props.style]}>
        <View style={[styles.contentContainer, contentContainerStyle]}>
          {indicator ? (
            <EPNSActivity style={styles.activity} size="small" />
          ) : downloading ? (
            <View style={styles.downloading}>
              {props.miniProgressLoader === true ? (
                <EPNSActivity style={styles.activity} size="small" />
              ) : (
                <ProgressCircle
                  percent={downloadProgress}
                  radius={20}
                  borderWidth={20}
                  color={GLOBALS.COLORS.GRADIENT_SECONDARY}
                  shadowColor={GLOBALS.COLORS.LIGHT_GRAY}
                  bgColor={GLOBALS.COLORS.WHITE}
                />
              )}
            </View>
          ) : props.imgsrc || defaulted === true ? (
            <Image
              style={styles.image}
              source={
                defaulted
                  ? require('./assets/frownface.png')
                  : {uri: `${props.imgsrc}`}
              }
              resizeMode={modifiedResizeMode}
            />
          ) : (
            <Image
              style={styles.image}
              source={{uri: `${fileURI}`}}
              resizeMode={props.resizeMode}
            />
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

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
  //  this is not present actually in the legacy code
  activity: {},
});

export default ImageDownloadWithIndicator;
