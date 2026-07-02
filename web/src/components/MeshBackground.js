"use client";

import { useState, useEffect } from "react";
import { MeshGradient } from "@paper-design/shaders-react";

export default function MeshBackground() {
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div className="mesh-bg">
      {dimensions.width > 0 && (
        <MeshGradient
          width={dimensions.width}
          height={dimensions.height}
          colors={["#39a3ef8c", "#f2c097"]}
          distortion={1}
          swirl={1}
          grainMixer={0}
          grainOverlay={0}
          speed={0.6}
        />
      )}
    </div>
  );
}
