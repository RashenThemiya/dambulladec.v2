import React from 'react';

const InputField = ({ type, placeholder, value, onChange }) => (
    <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mb-4 p-2 w-full border rounded-md"
    />
);

export default InputField;
