/* eslint-disable @next/next/no-sync-scripts */
import GradientBackground from "@/components/new/GradientBackground";
import VirtualCompanionFlow from "@/components/new/windows/VirtualCompanionFlow";
import { useEffect, useState } from "react";

declare const window: any;

export default function Page() {
    return <>
        <GradientBackground />
        <VirtualCompanionFlow on_next={() => { }} />
    </>
}