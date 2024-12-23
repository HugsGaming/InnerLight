import React, { useState, useRef } from "react";
import { FileText, Image, Video, X, Upload } from "lucide-react";
import { formatFileSize } from "../utils/files";

export default function ChatFileUploadPreview({
    onSend,
    onCancel,
    isUploading = false,
}: {
    onSend: (file: File) => void;
    onCancel: () => void;
    isUploading?: boolean;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
    const [fileType, setFileType] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        //Determine file type
        if (selectedFile.type.startsWith("image/")) {
            setFileType("image");
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        } else if (selectedFile.type.startsWith("video/")) {
            setFileType("video");
            const url = URL.createObjectURL(selectedFile);
            setPreview(url);
        } else {
            setFileType("document");
            setPreview(null);
        }
    };

    const resetState = () => {
        setFile(null);
        setPreview(null);
        setFileType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = () => {
        if (file) {
            onSend(file);
            resetState();
        }
    };

    const handleCancel = () => {
        resetState();
        onCancel();
    };

    const renderPreview = () => {
        if (!file) return null;

        return (
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mt-2">
                <button
                    onClick={handleCancel}
                    disabled={isUploading}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center space-x-3">
                    {fileType === "image" && (
                        <div className="relative w-20 h-20">
                            <img
                                src={preview as string}
                                alt="Preview"
                                className="w-full h-full object-cover rounded"
                            />
                        </div>
                    )}
                    {fileType === "video" && (
                        <div className="relative w-20 h-20">
                            <video
                                src={preview as string}
                                className="w-full h-full object-cover rounded"
                                controls
                            />
                        </div>
                    )}
                    {fileType === "document" && (
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                            <FileText
                                size={32}
                                className="text-gray-600 dark:text-gray-300"
                            />
                        </div>
                    )}

                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                        </p>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isUploading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        {isUploading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Uploading...</span>
                            </div>
                        ) : (
                            "Send"
                        )}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept="image/*,video/*,application/*"
                disabled={isUploading}
            />
            {!file ? (
                <label
                    htmlFor="file-upload"
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-800 dark:hover:text-gray-100"
                >
                    <Upload size={20} />
                    <span>Upload a file</span>
                </label>
            ) : (
                renderPreview()
            )}
        </div>
    );
}
