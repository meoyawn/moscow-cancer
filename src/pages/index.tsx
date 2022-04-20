import React from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

// noinspection JSUnusedGlobalSymbols
export default function Index() {
  return <Globe />;
}
