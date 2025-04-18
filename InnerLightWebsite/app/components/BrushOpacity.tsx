// BrushOpacity.tsx
import React from "react";

interface BrushOpacityProps {
    onChange: (opacity: number) => void;
    defaultValue: number;
}

const BrushOpacity: React.FC<BrushOpacityProps> = ({
    onChange,
    defaultValue,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const opacity = parseFloat(e.target.value);
        onChange(opacity); // Pass the opacity value to the parent component
    };

    return (
        <div className="flex items-center">
            <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                defaultValue={defaultValue.toString()}
                onChange={handleChange}
                className="w-full"
            />
        </div>
    );
};

export default BrushOpacity;
