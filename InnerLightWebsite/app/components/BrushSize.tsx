// BrushSize.tsx
import React from "react";

interface BrushSizeProps {
    onChange: (size: number) => void;
    defaultValue: number;
}

const BrushSize: React.FC<BrushSizeProps> = ({ onChange, defaultValue }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const size = parseInt(e.target.value);
        onChange(size); // Pass the size value to the parent component
    };

    return (
        <div className="flex items-center">
            <input
                type="range"
                min="1"
                max="50"
                defaultValue={defaultValue.toString()}
                onChange={handleChange}
                className="w-full"
            />
        </div>
    );
};

export default BrushSize;
