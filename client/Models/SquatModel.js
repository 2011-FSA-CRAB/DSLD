import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as tf from '@tensorflow/tfjs-core';
import * as tmPose from '@teachablemachine/pose';
import positiveFeedback from '../../public/assets/audio/positiveFeedback_v1.mp3';
import negativeFeedback from '../../public/assets/audio/negativeFeedback_v1.mp3';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faForward } from '@fortawesome/free-solid-svg-icons';

// needs to be outside of Model function scope to toggle Start/Stop
// Initialize vars for repCount
let repCount = 0;
let startingPosition;
let squattingPosition;
let middlePosition;
let setupPosition;
let counterStatus = 'pending';
let lineColor = '#9BD7D1';
let totalReps = 5;
let successfulReps = totalReps;
let reps = totalReps;
let predictStatus = 'pending';

export function Model() {
  // Hooks
  const [isLoading, setIsLoading] = useState(true);
  const [toggleStart, setToggle] = useState(false);

  // More API functions here:
  // https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

  // the link to your model provided by Teachable Machine export panel

  // Squat v2
  // https://teachablemachine.withgoogle.com/models/J5d1HwacC/
  // Squat v3
  // https://teachablemachine.withgoogle.com/models/gzTttOI1O/

  const URL = 'https://teachablemachine.withgoogle.com/models/gzTttOI1O/';
  let model, webcam, ctx, labelContainer, maxPredictions;

  async function init() {
    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';

    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);

    maxPredictions = model.getTotalClasses();

    const size = 640;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup({ facingMode: 'user', aspectRatio: 1 }); // request access to the webcam

    let iosVid = document
      .getElementById('webcam-container')
      .appendChild(webcam.webcam);
    console.log('webcam', webcam.webcam);
    console.log('iosvid', iosVid);

    let videoElement = document.getElementsByTagName('video')[0];
    videoElement.setAttribute('playsinline', true);
    videoElement.muted = 'true';
    videoElement.id = 'webcamVideo';
    videoElement.setAttribute('display', 'none');

    await webcam.play();
    console.log(webcam.setup);

    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById('canvas');
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext('2d');
    labelContainer = document.getElementById('label-container');
    for (let i = 0; i < maxPredictions; i++) {
      // and class labels
      labelContainer.appendChild(document.createElement('div'));
    }
  }

  async function loop() {
    webcam.update();

    // app starts with prediction active and drawPose using poseNet
    if (predictStatus === 'active') {
      // document.getElementById('togglePredict').innerHTML('Pause');
      await predict(true);
    }
    // when pause button is pressed, drawPose switches to webcam feed
    if (predictStatus === 'pending') {
      drawPose();
      await predict(false);
    }
    window.requestAnimationFrame(loop);
  }

  async function predict(bool) {
    if (bool === true) {
      // Prediction #1: run input through posenet
      // estimatePose can take in an image, video or canvas html element
      const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
      // Prediction 2: run input through teachable machine classification model
      const prediction = await model.predict(posenetOutput);

      for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = `${prediction[i].className}: ${Math.ceil(
          prediction[i].probability.toFixed(2) * 100
        )}%`;
        labelContainer.childNodes[i].innerHTML = classPrediction;
      }

      drawPose(pose, lineColor);

      startingPosition = prediction[1].probability;
      squattingPosition = prediction[3].probability;
      middlePosition = prediction[2].probability;
      setupPosition = prediction[0].probability;

      let canvasBorder = document.getElementById('canvas');

      if (counterStatus === 'pending' && startingPosition > 0.9) {
        counterStatus = 'starting';
      }

      if (counterStatus === 'starting' && middlePosition > 0.5) {
        counterStatus = 'middle';
      }

      if (counterStatus === 'middle' && squattingPosition > 0.9) {
        counterStatus = 'squatting';
      }

      if (counterStatus === 'squatting' && startingPosition > 0.9) {
        lineColor = '#39E47E';
        drawPose(pose, lineColor);
        canvasBorder.style.border = `20px solid ${lineColor}`;
        repCount = repCount + 1;
        playAudio(positiveFeedback);
        counterStatus = 'pending';
        reps = reps - 1;
      }

      if (counterStatus === 'middle' && startingPosition > 0.9) {
        lineColor = '#EE4A40';
        canvasBorder.style.border = `20px solid ${lineColor}`;
        drawPose(pose, lineColor);
        successfulReps = successfulReps - 1;
        playAudio(negativeFeedback);
        counterStatus = 'pending';
        reps = reps - 1;
      }

      let accuracy = (successfulReps / totalReps) * 100;

      if (reps <= 0) {
        togglePredict();
        console.log('DONE');
      }

      let repContainer = document.getElementById('rep-container');
      repContainer.innerHTML = `Total Reps: ${repCount}`;

      let accContainer = document.getElementById('acc-container');
      accContainer.innerHTML = `Accuracy: ${accuracy}%`;

      let remContainer = document.getElementById('rem-container');
      remContainer.innerHTML = `Remaining Reps: ${reps}`;

      // console.log('counterStatus ---->', counterStatus);
      // console.log('In func repCount ---->', repCount);
    } else {
      return;
    }
  }

  function drawPose(pose, color) {
    if (webcam.canvas) {
      ctx.drawImage(webcam.canvas, 0, 0);
      if (pose) {
        const minPartConfidence = 0.5;

        tmPose.drawKeypoints(
          pose.keypoints,
          minPartConfidence,
          ctx,
          5,
          color,
          color
        );
        tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx, 5, color);
      }
    }
  }

  async function togglePredict() {
    console.log('predictStatus', predictStatus);
    if (predictStatus === 'pending') {
      predictStatus = 'active';
    } else if (predictStatus === 'active') {
      predictStatus = 'pending';
    }
  }

  let sound;

  async function playAudio(audio) {
    const context = new AudioContext();
    await window
      .fetch(audio)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        sound = audioBuffer;
      });

    const source = context.createBufferSource();
    source.buffer = sound;
    source.connect(context.destination);
    source.start();
  }

  useEffect(() => {
    init();

    return () => console.log('Model cleaned up.');
  }, []);

  function countdown(callback) {
    // let modal = document.getElementById('modal');
    // modal.style.display = 'flex';
    // modal.style.flexDirection = 'column';
    // modal.style.justifyContent = 'center';
    // modal.style.alignItems = 'center';
    let seconds = 5;
    let countdownSeconds = document.getElementById('timer');
    countdownSeconds.innerHTML = seconds;
    let counter = setInterval(() => {
      seconds--;
      countdownSeconds.innerHTML = seconds;
      if (seconds === 0) {
        countdownSeconds.innerHTML = '00:00';
        clearInterval(counter);
        callback();
      }
    }, 1000);
  }

  return (
    <ContentContainer>
      <TopToolbar>
        <WorkoutType>Squat</WorkoutType>
        <WorkoutType id="timer">00:00</WorkoutType>
        <FontAwesomeIcon
          icon={faForward}
          style={{ fontSize: '2.5rem', color: '#355C7D' }}
        />
      </TopToolbar>
      <ModelContainer>
        <Webcam>
          <div id="webcam-container" display="none" height="0"></div>
          <canvas width="640" height="640" id="canvas"></canvas>
          <WebcamToolbar>
            <Label id="rep-container"></Label>
            <Label id="acc-container"></Label>
            <Label id="rem-container"></Label>
            <Button
              id="togglePredict"
              onClick={() => {
                if (predictStatus === 'pending') {
                  countdown(togglePredict);
                } else {
                  togglePredict();
                }
                setToggle(!toggleStart);
              }}
            >
              {toggleStart ? 'Stop' : 'Start'}
            </Button>
          </WebcamToolbar>
        </Webcam>
        <LabelContainer>
          <Label id="label-container"></Label>
          {/* <Label id="countdown"></Label> */}
        </LabelContainer>
      </ModelContainer>
    </ContentContainer>
  );
}

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 70%;
  margin-top: 65px;
  z-index: 1;
  @media only screen and (max-width: 1200px) {
    width: 90%;
  }
`;

const TopToolbar = styled.div`
  display: flex;
  margin-top: 1rem;
  justify-content: space-between;
  width: 100%;
`;

const WorkoutType = styled.div`
  display: flex;
  justify-content: center;
  padding: 1rem;
  text-decoration: none;
  color: white;
  font-size: 1.4rem;
  border-radius: 10px;
  background-color: #355c7d;
  border: 0px;
  width: 10rem;
`;

const ModelContainer = styled.div`
  display: flex;
  width: 100%;
  margin: 2rem;

  @media only screen and (max-width: 1200px) {
    flex-direction: column;
  }
`;

const Webcam = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;
const LabelContainer = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
`;
const Label = styled.div`
  color: #325d79;
  font-size: 3.2rem;
  @media only screen and (max-width: 1200px) {
    font-size: 1.3rem;
  }
`;

const WebcamToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.7rem;
`;

const Button = styled.button`
  padding: 1rem;
  text-decoration: none;
  color: white;
  font-size: 1.4rem;
  border-radius: 10px;
  background-color: #f67280;
  border: 0px;
  width: 10rem;
`;
