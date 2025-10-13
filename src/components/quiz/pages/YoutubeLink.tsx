"use client";
import React from "react";

const YoutubeLink = () => {
  return (
    <div>
      <input
        type="text"
        name="youtubeUrl"
        className="w-full p-3 border rounded"
        placeholder="Inserisci URL di YouTube"
        required
      />
    </div>
  );
};

export default YoutubeLink;
