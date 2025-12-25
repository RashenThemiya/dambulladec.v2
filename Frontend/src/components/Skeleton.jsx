import React from "react";

export const Skeleton = () => {
    return (
        <div className="animate-pulse bg-gray-100 p-4 rounded-lg">
            <div className="h-32 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mt-4"></div>
        </div>
    );
};
