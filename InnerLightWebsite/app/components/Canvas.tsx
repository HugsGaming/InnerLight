// Nice
import React, { useRef, useEffect, useState } from "react";
import getStroke from "perfect-freehand";
import {
    FaBrush,
    FaDownload,
    FaEraser,
    FaImage,
    FaPallet,
    FaRainbow,
    FaRedo,
    FaSprayCan,
    FaUndo,
    FaShareSquare,
} from "react-icons/fa";
import BrushSize from "./BrushSize";
import BrushOpacity from "./BrushOpacity";
import { LuPaintBucket } from "react-icons/lu";
import { MdOutlineClear } from "react-icons/md";
import CanvasPostModal from "./draw/CanvasPostModal";
import { Tables } from "../../database.types";
import { NewPost } from "./post/post.types";
import { toast } from "react-toastify";

interface CanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentColor: string;
    user: Tables<"profiles">;
}

const Canvas: React.FC<CanvasProps> = ({ canvasRef, currentColor, user }) => {
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [tool, setTool] = useState<string>("brush");
    const [currentColorState, setCurrentColor] = useState<string>(currentColor);
    const [brushOpacity, setBrushOpacity] = useState<number>(1);
    const [brushSize, setBrushSize] = useState<number>(10);
    const [points, setPoints] = useState<Array<[number, number]>>([]);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [history, setHistory] = useState<Array<ImageData>>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);

    const handleCreatePost = async (post: NewPost) => {
        console.log("Handle Create Post called with post:", post);
        try {
            // Create FormData object
            const formData = new FormData();
            formData.append("title", post.title);
            formData.append("description", post.description);

            if (post.image) {
                formData.append("image", post.image);
            }

            // Log the complete FormData for debugging
            for (let pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const response = await fetch("/api/posts", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create post");
            }

            const result = await response.json();
            toast.success("Post created successfully!");
            return result;
        } catch (error) {
            console.error("Error creating post:", error);
            throw error;
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const resizeCanvas = () => {
                const ctx = ctxRef.current;
                if (!ctx) return;

                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );

                const displayWidth = canvas.clientWidth;
                const displayHeight = canvas.clientHeight;

                canvas.width = displayWidth * window.devicePixelRatio;
                canvas.height = displayHeight * window.devicePixelRatio;

                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

                ctx.putImageData(imageData, 0, 0);
            };

            resizeCanvas();

            window.addEventListener("resize", resizeCanvas);

            return () => {
                window.removeEventListener("resize", resizeCanvas);
            };
        }
    }, [canvasRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctxRef.current = ctx;
            }
        }
    }, [canvasRef]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;

        const draw = (x: number, y: number) => {
            if (tool === "brush" || tool === "rainbow") {
                const stroke = getStroke(points, {
                    size: brushSize,
                    thinning: 0.5,
                    smoothing: 0.5,
                    streamline: 0.5,
                    easing: (t) => t,
                    simulatePressure: true,
                });

                ctx.beginPath();
                stroke.forEach(([x, y], index) => {
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });

                if (tool === "rainbow") {
                    const rainbowColors = [
                        "red",
                        "orange",
                        "yellow",
                        "green",
                        "blue",
                        "indigo",
                        "violet",
                    ];
                    ctx.strokeStyle =
                        rainbowColors[
                            Math.floor(Math.random() * rainbowColors.length)
                        ];
                } else {
                    ctx.strokeStyle = currentColorState;
                }

                ctx.globalAlpha = brushOpacity;
                ctx.lineWidth = brushSize;
                ctx.stroke();
                ctx.closePath();
            } else if (tool === "eraser") {
                ctx.globalCompositeOperation = "destination-out";
                ctx.strokeStyle = "rgba(0,0,0,1)";
                ctx.lineWidth = brushSize;
                ctx.beginPath();
                ctx.moveTo(points[0][0], points[0][1]);
                points.forEach(([x, y]) => {
                    ctx.lineTo(x, y);
                });
                ctx.stroke();
                ctx.closePath();
                ctx.globalCompositeOperation = "source-over";
            } else if (tool === "spray") {
                ctx.fillStyle = currentColorState;
                points.forEach(([x, y]) => {
                    for (let i = 0; i < 20; i++) {
                        const offsetX =
                            Math.random() * brushSize - brushSize / 2;
                        const offsetY =
                            Math.random() * brushSize - brushSize / 2;
                        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
                    }
                });
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (tool === "fill-bucket") {
                fillBucket(e.offsetX, e.offsetY);
            } else {
                setIsDrawing(true);
                setPoints([[e.offsetX, e.offsetY]]);
                draw(e.offsetX, e.offsetY);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDrawing) return;
            setPoints((prev) => [...prev, [e.offsetX, e.offsetY]]);
            draw(e.offsetX, e.offsetY);
        };

        const handleMouseUp = () => {
            setIsDrawing(false);
            saveCanvasState();
            setPoints([]);
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (tool === "fill-bucket") {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                fillBucket(touch.clientX - rect.left, touch.clientY - rect.top);
            } else {
                setIsDrawing(true);
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                setPoints([
                    [touch.clientX - rect.left, touch.clientY - rect.top],
                ]);
                draw(touch.clientX - rect.left, touch.clientY - rect.top);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDrawing) return;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            setPoints((prev) => [
                ...prev,
                [touch.clientX - rect.left, touch.clientY - rect.top],
            ]);
            draw(touch.clientX - rect.left, touch.clientY - rect.top);
        };

        const handleTouchEnd = () => {
            setIsDrawing(false);
            saveCanvasState();
            setPoints([]);
        };

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mouseleave", handleMouseUp);
        canvas.addEventListener("touchstart", handleTouchStart);
        canvas.addEventListener("touchmove", handleTouchMove);
        canvas.addEventListener("touchend", handleTouchEnd);
        canvas.addEventListener("touchcancel", handleTouchEnd);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mouseleave", handleMouseUp);
            canvas.removeEventListener("touchstart", handleTouchStart);
            canvas.removeEventListener("touchmove", handleTouchMove);
            canvas.removeEventListener("touchend", handleTouchEnd);
            canvas.removeEventListener("touchcancel", handleTouchEnd);
        };
    }, [isDrawing, points, brushSize, brushOpacity, currentColorState, tool]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const resizeCanvas = () => {
                const ctx = ctxRef.current;
                if (!ctx) return;

                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );

                const displayWidth = canvas.clientWidth;
                const displayHeight = canvas.clientHeight;

                canvas.width = displayWidth * window.devicePixelRatio;
                canvas.height = displayHeight * window.devicePixelRatio;

                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

                ctx.putImageData(imageData, 0, 0);
            };

            resizeCanvas();

            window.addEventListener("resize", resizeCanvas);

            return () => {
                window.removeEventListener("resize", resizeCanvas);
            };
        }
    }, [canvasRef]);

    const handleCanvasClick = (selectedTool: string) => {
        setTool(selectedTool);
    };

    const handleBgClick = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            ctx.fillStyle = currentColorState;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveCanvasState();
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
            saveCanvasState();
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

    const saveCanvasState = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
            );
            setHistory((prevHistory) => [
                ...prevHistory.slice(0, historyIndex + 1),
                imageData,
            ]);
            setHistoryIndex((prevIndex) => prevIndex + 1);
        }
    };

    const handleUndoClick = () => {
        if (historyIndex > 0) {
            setHistoryIndex((prevIndex) => prevIndex - 1);
            const prevImageData = history[historyIndex - 1];
            ctxRef.current?.putImageData(prevImageData, 0, 0);
        }
    };

    const handleRedoClick = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex((prevIndex) => prevIndex + 1);
            const nextImageData = history[historyIndex + 1];
            ctxRef.current?.putImageData(nextImageData, 0, 0);
        }
    };

    const fillBucket = (startX: number, startY: number) => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const targetColor = getColorAtPixel(data, startX, startY, canvas.width);

        if (!targetColor) return;

        const fillColor = hexToRgb(currentColorState);
        if (!fillColor) return;

        const pixelStack = [[startX, startY]];

        while (pixelStack.length) {
            const [x, y] = pixelStack.pop()!;
            const index = (y * canvas.width + x) * 4;

            if (isSameColor(data, index, targetColor)) {
                setColorAtPixel(data, index, fillColor);

                if (x > 0) pixelStack.push([x - 1, y]);
                if (x < canvas.width - 1) pixelStack.push([x + 1, y]);
                if (y > 0) pixelStack.push([x, y - 1]);
                if (y < canvas.height - 1) pixelStack.push([x, y + 1]);
            }
        }

        ctx.putImageData(imageData, 0, 0);
        saveCanvasState();
    };

    const getColorAtPixel = (
        data: Uint8ClampedArray,
        x: number,
        y: number,
        width: number,
    ) => {
        const index = (y * width + x) * 4;
        return [data[index], data[index + 1], data[index + 2], data[index + 3]];
    };

    const isSameColor = (
        data: Uint8ClampedArray,
        index: number,
        color: number[],
    ) => {
        return (
            data[index] === color[0] &&
            data[index + 1] === color[1] &&
            data[index + 2] === color[2] &&
            data[index + 3] === color[3]
        );
    };

    const setColorAtPixel = (
        data: Uint8ClampedArray,
        index: number,
        color: number[],
    ) => {
        data[index] = color[0];
        data[index + 1] = color[1];
        data[index + 2] = color[2];
        data[index + 3] = color[3];
    };

    const hexToRgb = (hex: string) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(
            shorthandRegex,
            (m, r, g, b) => r + r + g + g + b + b,
        );

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? [
                  parseInt(result[1], 16),
                  parseInt(result[2], 16),
                  parseInt(result[3], 16),
                  255,
              ]
            : null;
    };

    return (
        <div className="flex flex-col items-center space-y-4 p-4 ">
            <div className="relative overflow-hidden bg-white border border-gray-300 shadow-md rounded-lg">
                <canvas
                    ref={canvasRef}
                    className="block mx-auto max-w-full h-auto"
                    style={{ maxWidth: "100%", height: "auto" }}
                    width={1000}
                    height={800}
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center w-full mt-4 space-y-4 md:space-y-0 md:space-x-4">
                <div className="w-full md:w-auto flex flex-col md:flex-row items-center justify-center">
                    <div className="w-full md:w-auto">
                        <span className="hidden md:inline-block w-full text-center">
                            Brush Size
                        </span>
                        <BrushSize
                            onChange={handleBrushSizeChange}
                            defaultValue={brushSize}
                        />
                    </div>

                    <div className="w-full md:w-auto mt-4 md:mt-0">
                        <span className="hidden md:inline-block w-full text-center">
                            Brush Opacity
                        </span>
                        <BrushOpacity
                            onChange={handleBrushOpacityChange}
                            defaultValue={brushOpacity}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                <div
                    className="tool undo cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={handleUndoClick}
                >
                    <FaUndo className="mb-1" />
                </div>
                <div
                    className="tool redo cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={handleRedoClick}
                >
                    <FaRedo className="mb-1" />
                </div>
                <div
                    className="tool bg cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                    onClick={handleBgClick}
                >
                    <FaImage className="mb-1" />
                </div>
                <div
                    className={`tool brush cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded ${tool === "brush" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-700"} hover:bg-blue-600`}
                    onClick={() => handleCanvasClick("brush")}
                >
                    <FaBrush className="mb-1" />
                </div>
                <div
                    className={`tool rainbow cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded ${tool === "rainbow" ? "bg-red-500 text-white" : "bg-gray-300 text-gray-700"} hover:bg-red-600`}
                    onClick={() => handleCanvasClick("rainbow")}
                >
                    <FaRainbow className="mb-1" />
                </div>
                <div
                    className={`tool spray cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded ${tool === "spray" ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"} hover:bg-green-600`}
                    onClick={() => handleCanvasClick("spray")}
                >
                    <FaSprayCan className="mb-1" />
                </div>
                <div
                    className={`tool eraser cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded ${tool === "eraser" ? "bg-purple-500 text-white" : "bg-gray-300 text-gray-700"} hover:bg-purple-600`}
                    onClick={() => handleCanvasClick("eraser")}
                >
                    <FaEraser className="mb-1" />
                </div>
                <div
                    className={`tool fill-bucket cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded ${tool === "fill-bucket" ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-700"} hover:bg-orange-600`}
                    onClick={() => handleCanvasClick("fill-bucket")}
                >
                    <LuPaintBucket className="mb-1" />
                </div>
                <div
                    className={`tool cursor-pointer flex items-center justify-center w-10 h-10 md:w-14 md:h-14 p-2 md:p-3 rounded bg-pink-500 text-white hover:bg-pink-600`}
                >
                    <input
                        type="color"
                        className=" cursor-pointer hover:bg-gray-300"
                        value={currentColorState}
                        onChange={handleColorChange}
                    />
                </div>
                <div
                    className="tool clear cursor-pointer flex items-center justify-center p-4 rounded w-10 h-10 md:w-14 md:h-14 bg-pink-500 text-white hover:bg-pink-600"
                    onClick={handleClearClick}
                >
                    <MdOutlineClear className="mb-1" />
                </div>
                <div
                    className="tool dl cursor-pointer flex items-center justify-center p-4 rounded w-10 h-10 md:w-14 md:h-14 bg-teal-500 text-white hover:bg-teal-600"
                    onClick={handleDownloadClick}
                >
                    <FaDownload className="mb-1" />
                </div>
                <div
                    className="tool share cursor-pointer flex items-center justify-center p-4 rounded w-10 h-10 md:w-14 md:h-14 bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => {
                        console.log("Share button clicked");
                        setIsPostModalOpen(true);
                    }}
                >
                    <FaShareSquare className="mb-1" />
                </div>
            </div>
            <CanvasPostModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                canvasRef={canvasRef}
                onSubmit={handleCreatePost}
                user={user}
            />
        </div>
    );
};

export default Canvas;
