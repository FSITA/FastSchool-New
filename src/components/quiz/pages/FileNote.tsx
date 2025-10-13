"use client";
import { PhotoIcon } from "@/components/quiz/icons";
import { useState } from "react";

export default function FileNote() {
  const [file, setFile] = useState<File>();
  return (
    <>
      <label
        htmlFor="files"
        className="block mb-4 text-sm font-medium text-zinc-600 cursor-pointer"
      >
        Carica Appunto
        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-zinc-300 px-6 py-10 h-56">
          <div className="text-center">
            <PhotoIcon
              className="font-geistmono mx-auto h-10 w-10 text-zinc-300"
              aria-hidden={true}
            />
            <div className="mt-4 flex text-sm leading-6 text-zinc-600">
              <label
                htmlFor="files"
                className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-secondary"
              >
                <span>{file?.name || `Carica un file PDF`}</span>
                <input
                  id="files"
                  name="files"
                  type="file"
                  required
                  className="sr-only"
                  onChange={(e) => {
                    setFile(e.target.files![0]);
                  }}
                />
              </label>
              {/* {!file && <p className="pl-1">preferred formats include:</p>} */}
            </div>
            {!file && (
              <p className="text-xs leading-5 text-zinc-600">Fino a 7MB</p>
            )}
          </div>
        </div>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label htmlFor="startPage" className="block text-sm font-medium text-zinc-600">
          Pagina Iniziale (Opzionale)
          <input
            type="number"
            name="startPage"
            id="startPage"
            placeholder="e.g., 12"
            className="font-geistmono mt-1 appearance-none w-full p-3 border border-zinc-200 placeholder-zinc-400 text-zinc-700 rounded-md focus:outline-none focus:ring-zinc-300 text-sm"
          />
        </label>
        <label htmlFor="endPage" className="block text-sm font-medium text-zinc-600">
          Pagina Finale (Opzionale)
          <input
            type="number"
            name="endPage"
            id="endPage"
            placeholder="e.g., 25"
            className="font-geistmono mt-1 appearance-none w-full p-3 border border-zinc-200 placeholder-zinc-400 text-zinc-700 rounded-md focus:outline-none focus:ring-zinc-300 text-sm"
          />
        </label>
      </div>
    </>
  );
}
