"use client";

import { type Message, useAssistant } from "ai/react";
import React, { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import * as faceapi from "face-api.js";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { status, messages, input, submitMessage, handleInputChange, append } =
    useAssistant({
      api: "/api/chatbot",
  });

  useEffect(() => {
    startVideo();
    videoRef && loadModels();
  }, [])

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
    .then((currentStream) => {
      if(videoRef.current) {
        videoRef.current.srcObject = currentStream;
      }
    }).catch((error) => {
      console.log(error);
    })
  }

  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models")
    ]).then(() => {
      faceMyDetect();
    })
    
  }

  const faceMyDetect = async () => {
    setInterval(async () => {
      if(!videoRef.current) return; 
      const tnInput = await faceapi.toNetInput(videoRef.current);
      const detections = await faceapi.detectAllFaces(tnInput, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

      console.log(detections);

      if(canvasRef.current) {
        const canvas = faceapi.createCanvasFromMedia(videoRef.current);
        canvasRef.current.append(canvas);
        faceapi.matchDimensions(canvasRef.current!, { width: 640, height: 480 });

        const resized = faceapi.resizeResults(detections, { width: 640, height: 480 });

        faceapi.draw.drawDetections(canvasRef.current, resized);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resized);
      }
      
    }, 1000)
  }

  // const faceMyDetect = async () => {
  //   setInterval(async () => {
  //     const detections = await faceapi.detectSingleFace(videoRef.current,
  //       new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

  //       canvasRef.current?.innerHTML = faceapi.createCanvasFromMedia(videoRef.current!);
  //       faceapi.matchDimensions(canvasRef.current!, { width: 640, height: 480 });

  //       const resized = faceapi.resizeResults(detections, { width: 640, height: 480 });

  //       faceapi.draw.drawDetections(canvasRef.current, resized);
  //     )
  //   }, 1000);
  
  return (
    <>
    <div className="flex w-[100vw] h-[100vh] flex-col items-center justify-between">
      <h1>Face Detection</h1>
      <div className="flex items-center">
        <video crossOrigin="anonymous" ref={videoRef} autoPlay></video>
      </div>
      <canvas className="" ref={canvasRef} width={640} height={480}></canvas>
    </div>
    <div className="">
      {messages.map((m: Message) => (
        <div key={m.id} className="flex flex-col gap-1 border-b p-2">
          <strong>{`${m.role}: `}</strong>
          {m.role !== "data" && <Markdown>{m.content}</Markdown>}
          {m.role === "data" && (
            <>
              {(m.data as any).description}
              <br />
              <pre className="bg-amber-300">
                {JSON.stringify(m.data, null, 2)}
              </pre>
            </>
          )}
        </div>
      ))}

      {status === "in_progress" && <div />}

      <form
        onSubmit={submitMessage}
        className="flex flex-row gap-2 p-2 bg-zinc-100 w-full"
      >
        <input
          className="bg-zinc-100 w-full p-2 outline-none"
          disabled={status != "awaiting_message"}
          value={input}
          placeholder="Type a message"
          onChange={handleInputChange}
        />
      </form>
    </div>
    </>
  );
}
