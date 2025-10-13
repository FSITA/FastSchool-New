"use client";
import React from "react";

const WikipediaLink = () => {
  return (
    <div>
      <input
        type="text"
        name="wikipediaLink"
        className="w-full p-3 border rounded"
        placeholder="Inserisci URL di Wikipedia"
        required
      />
    </div>
  );
};

export default WikipediaLink;
