import React from "react";

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-md py-4">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-xl font-bold">INNERLIGHT</div>
                <div className="text-sm">nicolemagallanes026@gmail.com</div>
            </div>
        </header>
    );
};

export default Header;
