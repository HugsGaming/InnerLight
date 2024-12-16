import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

export default function FaceDetection() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        startVideo();
        videoRef && loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((currentStream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = currentStream;
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const loadModels = () => {
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
            faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
            faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        ])
            .then(() => {
                faceMyDetect();
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const faceMyDetect = async () => {
        setInterval(async () => {
            if (!videoRef.current || !canvasRef.current) return;
            const tnInput = await faceapi.toNetInput(videoRef.current);
            const detections = await faceapi
                .detectSingleFace(
                    tnInput,
                    new faceapi.TinyFaceDetectorOptions(),
                )
                .withFaceLandmarks()
                .withFaceExpressions();
            console.log(detections);

            const canvas = faceapi.createCanvasFromMedia(videoRef.current);
            canvasRef.current.append(canvas);
            faceapi.matchDimensions(canvasRef.current, {
                width: 340,
                height: 260,
            });

            const resized = faceapi.resizeResults(detections, {
                width: 340,
                height: 260,
            });

            if (!resized) return;

            faceapi.draw.drawDetections(canvasRef.current, resized);
            faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
            faceapi.draw.drawFaceExpressions(canvasRef.current, resized);
        }, 1000);
    };

    return (
        <div className="">
            <div className="flex items-center">
                <video crossOrigin="anonymous" ref={videoRef} autoPlay />
                <canvas
                    className="absolute"
                    ref={canvasRef}
                    width={540}
                    height={380}
                />
            </div>
        </div>
    );
}
