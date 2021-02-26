import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { Button, Platform, StyleSheet, Text, View } from "react-native";
import * as Permissions from "expo-permissions";
import * as posenet from "@tensorflow-models/posenet";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { Camera } from "expo-camera";
import { inputTensorHeight, inputTensorWidth, Pose } from "./src/Pose";
import { PoseNet } from "@tensorflow-models/posenet";
import { ExpoWebGLRenderingContext } from "expo-gl";

const useInitTensorFlow = (): boolean => {
  const [isTfReady, setIsTfReady] = useState(false);

  const initializeTf = async () => {
    await tf.ready();
    setIsTfReady(true);
  };

  useEffect(() => {
    initializeTf();
  }, []);

  return isTfReady;
};

const usePosenetModel = (): PoseNet | null => {
  const [posenetModel, setPosenetModel] = useState<any>(null);

  const initModel = async () => {
    await Permissions.askAsync(Permissions.CAMERA);
    await Permissions.askAsync(Permissions.CAMERA_ROLL);

    const posenetModel = await posenet.load({
      // Config param information
      // https://github.com/tensorflow/tfjs-models/tree/master/posenet#config-params-in-posenetload
      architecture: "MobileNetV1",
      outputStride: 16,
      inputResolution: { width: inputTensorWidth, height: inputTensorHeight },
      multiplier: 0.75,
      quantBytes: 2,
    });

    setPosenetModel(posenetModel);
  };

  useEffect(() => {
    initModel();
  }, []);

  return posenetModel;
};

const AUTORENDER = false;

// tslint:disable-next-line: variable-name
const TensorCamera = cameraWithTensors(Camera);

const PoseCamera = () => {
  const posenetModel = usePosenetModel();
  const [pose, setPose] = useState<posenet.Pose | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const rafId = useRef<number | null>(null);
  const camRef = useRef<any>(null);

  const handleImageTensorReady = async (
    images: IterableIterator<tf.Tensor3D>,
    updatePreview: () => void,
    gl: ExpoWebGLRenderingContext
  ) => {
    const loop = async () => {
      if (!AUTORENDER) {
        updatePreview();
      }

      const imageTensor = images.next().value;

      const flipHorizontal = Platform.OS === "ios" ? false : true;

      const pose = await posenetModel.estimateSinglePose(imageTensor, {
        flipHorizontal,
      });

      setPose(pose);
      tf.dispose([imageTensor]);

      if (!AUTORENDER) {
        gl.endFrameEXP();
      }

      rafId.current = requestAnimationFrame(loop);
    };

    loop();
  };

  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    console.log("Starting recording");
    await camRef.current.camera.recordAsync();
    console.log("Done Recording");
    setIsRecording(false);
  };

  if (!posenetModel) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  // TODO File issue to be able get this from expo.
  // Caller will still need to account for orientation/phone rotation changes
  let textureDims: { width: number; height: number };
  if (Platform.OS === "ios") {
    textureDims = {
      height: 1920,
      width: 1080,
    };
  } else {
    textureDims = {
      height: 1200,
      width: 1600,
    };
  }

  return (
    <View style={[{ justifyContent: "center", alignItems: "center" }]}>
      <View style={styles.cameraContainer}>
        <TensorCamera
          ref={camRef}
          // Standard Camera props
          style={[styles.camera]}
          type={Camera.Constants.Type.front}
          zoom={0}
          // tensor related props
          cameraTextureHeight={textureDims.height}
          cameraTextureWidth={textureDims.width}
          resizeHeight={inputTensorHeight}
          resizeWidth={inputTensorWidth}
          resizeDepth={3}
          onReady={handleImageTensorReady}
          autorender={AUTORENDER}
        />

        <View style={[styles.modelResults]}>
          {pose && <Pose pose={pose} />}
        </View>
      </View>

      <View style={{ position: "abosolute", bottom: 200 }}>
        {isRecording ? (
          <Button
            title={"Stop Recording"}
            onPress={async () => {
              camRef.current.camera.stopRecording();
            }}
          />
        ) : (
            <Button
              title={"Start Recording"}
              onPress={() => {
                startRecording();
              }}
            />
          )}
      </View>
    </View>
  );
};

export default function App() {
  const isTfReady = useInitTensorFlow();
  if (!isTfReady) {
    return (
      <View style={styles.container}>
        <Text>Loading</Text>
      </View>
    );
  }

  return <PoseCamera />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  cameraContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
  },
  camera: {
    position: "absolute",
    left: 50,
    top: 100,
    width: 600 / 2,
    height: 800 / 2,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 0,
  },
  modelResults: {
    position: "absolute",
    left: 50,
    top: 100,
    width: 600 / 2,
    height: 800 / 2,
    zIndex: 20,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 0,
  },
  recordingButton: {
    position: "absolute",
    left: 50,
    bottom: 150,
  },
});
