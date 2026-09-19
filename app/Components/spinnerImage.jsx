"use client";

import { useState } from "react";
import Image from "next/image";

export default function SpinnerImage({ className = "", ...props }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-amber-500" />
        </div>
      )}

      <Image
        {...props}
        alt
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`${className} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}