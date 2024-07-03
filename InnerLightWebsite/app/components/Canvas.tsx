import React, { useRef, useEffect, useState } from "react";
import BrushOpacity from "./BrushOpacity";
import BrushSize from "./BrushSize";

interface CanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentColor: string;
}

const Canvas: React.FC<CanvasProps> = ({ canvasRef, currentColor }) => {
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [tool, setTool] = useState<string>("brush");
    const [currentColorState, setCurrentColor] = useState<string>(currentColor);
    const [brushOpacity, setBrushOpacity] = useState<number>(1);
    const [brushSize, setBrushSize] = useState<number>(10);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctxRef.current = ctx;
            }
        }
    }, [canvasRef]);

    const handleCanvasClick = (selectedTool: string) => {
        setTool(selectedTool);
    };

    const handleBrushClick = () => {
        document.body.style.cursor = "url(brush-cursor.png) 0 20, auto";
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            let isDrawing = false;
            let lastX = 0;
            let lastY = 0;

            canvas.addEventListener("mousedown", (e) => {
                isDrawing = true;
                lastX = e.offsetX;
                lastY = e.offsetY;
                ctx.globalAlpha = 0.9;
                ctx.lineWidth = 15;
            });

            canvas.addEventListener("mousemove", (e) => {
                if (isDrawing) {
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(e.offsetX, e.offsetY);
                    ctx.strokeStyle = currentColorState;
                    ctx.globalAlpha = brushOpacity;
                    ctx.lineWidth = brushSize;
                    ctx.stroke();
                    lastX = e.offsetX;
                    lastY = e.offsetY;
                }
            });

            canvas.addEventListener("mouseup", () => {
                isDrawing = false;
            });
        }
    };

    const handleRainbowClick = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            let hue = 0;
            let isDrawing = false;

            const onMouseDown = (e: MouseEvent) => {
                isDrawing = true;
                ctx.beginPath();
                ctx.moveTo(e.offsetX, e.offsetY);
            };

            const onMouseMove = (e: MouseEvent) => {
                if (isDrawing) {
                    ctx.lineTo(e.offsetX, e.offsetY);
                    ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
                    ctx.globalAlpha = brushOpacity;
                    ctx.lineWidth = brushSize;
                    ctx.stroke();
                    hue = (hue + 1) % 360;
                }
            };

            const onMouseUp = () => {
                if (isDrawing) {
                    isDrawing = false;
                    ctx.closePath();
                }
            };

            canvas.addEventListener("mousedown", onMouseDown);
            canvas.addEventListener("mousemove", onMouseMove);
            canvas.addEventListener("mouseup", onMouseUp);

            return () => {
                canvas.removeEventListener("mousedown", onMouseDown);
                canvas.removeEventListener("mousemove", onMouseMove);
                canvas.removeEventListener("mouseup", onMouseUp);
            };
        }
    };

    const handleSprayClick = () => {
        document.body.style.cursor = "url(spray-cursor.png) 0 20, auto";
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            canvas.addEventListener("mousedown", (e) => {
                for (let i = 0; i < 10; i++) {
                    const x = e.offsetX + Math.random() * 10 - 5;
                    const y = e.offsetY + Math.random() * 10 - 5;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, 2 * Math.PI);
                    ctx.fillStyle = currentColorState;
                    ctx.globalAlpha = brushOpacity;
                    ctx.fill();
                }
            });
        }
    };

    const handleBgClick = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            ctx.fillStyle = currentColorState;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleEraserClick = () => {
        document.body.style.cursor = "url(eraser-cursor.png) 0 20, auto";
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            ctx.globalCompositeOperation = "destination-out";

            canvas.addEventListener("mousedown", (e) => {
                ctx.beginPath();
                ctx.moveTo(e.offsetX, e.offsetY);
            });

            canvas.addEventListener("mousemove", (e) => {
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.strokeStyle = "rgba(0, 0, 0, 0)";
                ctx.lineWidth = brushSize;
                ctx.stroke();
            });

            canvas.addEventListener("mouseup", () => {
                ctx.closePath();
            });
        }
    };

    const handleSaveClick = () => {
        const link = document.createElement("a");
        link.href = canvasRef.current?.toDataURL() || "";
        link.download = "canvas.png";
        link.click();
    };

    const handleClearClick = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleDownloadClick = () => {
        const link = document.createElement("a");
        link.href = canvasRef.current?.toDataURL() || "";
        link.download = "canvas.png";
        link.click();
    };

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = event.target.value;
        setCurrentColor(newColor);
        const ctx = ctxRef.current;
        if (ctx) {
            ctx.strokeStyle = newColor;
            ctx.fillStyle = newColor;
        }
    };

    const handleBrushOpacityChange = (opacity: number) => {
        setBrushOpacity(opacity);
    };

    const handleBrushSizeChange = (size: number) => {
        setBrushSize(size);
    };

    useEffect(() => {
        switch (tool) {
            case "brush":
                handleBrushClick();
                break;
            case "rainbow":
                handleRainbowClick();
                break;
            case "spray":
                handleSprayClick();
                break;
            case "eraser":
                handleEraserClick();
                break;
            default:
                break;
        }

        return () => {
            // Clean up event listeners on tool change
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.removeEventListener("mousedown", handleBrushClick);
                canvas.removeEventListener("mousemove", handleRainbowClick);
                canvas.removeEventListener("mousemove", handleSprayClick);
                canvas.removeEventListener("mousemove", handleEraserClick);
            }
        };
    }, [tool, brushOpacity, brushSize, currentColorState]);
    return (
        <div className="flex flex-col items-center space-y-4 p-4 bg-gray-100">
            <BrushSize
                onChange={handleBrushSizeChange}
                defaultValue={brushSize}
            />

            <BrushOpacity
                onChange={handleBrushOpacityChange}
                defaultValue={brushOpacity}
            />

            <div className="flex space-x-5">
                <div
                    className={`tool brush ${tool === "brush" ? "active" : ""} cursor-pointer p-2 rounded bg-blue-500 text-white border-4 border-blue-700`}
                    onClick={() => handleCanvasClick("brush")}
                >
                    Brush
                </div>
                <div
                    className={`tool rainbow ${tool === "rainbow" ? "active" : ""} cursor-pointer p-2 rounded bg-red-500 text-white border-4 border-red-700`}
                    onClick={() => handleCanvasClick("rainbow")}
                >
                    Rainbow
                </div>
                <div
                    className={`tool spray ${tool === "spray" ? "active" : ""} cursor-pointer p-2 rounded bg-green-500 text-white border-4 border-green-700`}
                    onClick={() => handleCanvasClick("spray")}
                >
                    Spray
                </div>
                <div
                    className="tool bg cursor-pointer p-2 rounded bg-yellow-500 text-white border-4 border-yellow-700"
                    onClick={handleBgClick}
                >
                    Background
                </div>
                <div
                    className={`tool eraser ${tool === "eraser" ? "active" : ""} cursor-pointer p-2 rounded bg-purple-500 text-white border-4 border-purple-700`}
                    onClick={() => handleCanvasClick("eraser")}
                >
                    Eraser
                </div>
                <div
                    className="tool save cursor-pointer p-2 rounded bg-indigo-500 text-white border-4 border-indigo-700"
                    onClick={handleSaveClick}
                >
                    Save
                </div>
                <div
                    className="tool clear cursor-pointer p-2 rounded bg-pink-500 text-white border-4 border-pink-700"
                    onClick={handleClearClick}
                >
                    Clear
                </div>
                <div
                    className="tool dl cursor-pointer p-2 rounded bg-teal-500 text-white border-4 border-teal-700"
                    onClick={handleDownloadClick}
                >
                    Download
                </div>
                <input
                    type="color"
                    className="tool colorSelector cursor-pointer p-2 rounded border-4"
                    value={currentColorState}
                    onChange={handleColorChange}
                />
            </div>

            <canvas
                ref={canvasRef}
                width={1000}
                height={800}
                className="border border-gray-300"
            />
        </div>
    );
};

export default Canvas;
