// src/components/Button.js
import React from 'react';

function Button(props) {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded-md">
      {props.label}
    </button>
  );
}


export default Button;
