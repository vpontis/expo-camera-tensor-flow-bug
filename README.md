# Expo React-Native Tensor Flow - Recording Bug

There is a bug with Tensor Flow while `expo-camera` is recording so that Tensor Flow does not get new image data to process or render to the screen.

I am using the Tensor Flow PoseModel to track the user's pose. When I turn on recording with `expo-camera`, Tensor Flow no longer receives an updated image tensor so the screen looks stuck.

I think there is a problem with getting the correct WebGL texture from `expo-camera` while the camera is recording. But I am new to both Tensor Flow and WebGL so I haven't figured out the issue.

[YouTube Video That Shows Bug](https://youtu.be/xg0Ln2GWYJI)

## To Run

```shell script
yarn 
yarn start

# You need to run this on a phone - the simulator does not work with expo-camera
```
