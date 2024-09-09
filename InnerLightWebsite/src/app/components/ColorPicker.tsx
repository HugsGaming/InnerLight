"use client";
import React from "react";

interface ColorPickerProps {
    currentColor: string;
    onColorChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
    currentColor,
    onColorChange,
}) => {
    return <input type="color" value={currentColor} onChange={onColorChange} />;
};

export default ColorPicker;
