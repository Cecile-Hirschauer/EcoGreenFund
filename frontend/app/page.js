"use client";
import { useAccount } from "wagmi";

import Layout from "@/components/Layout/Layout";
import Main from "@/components/pages/Main/Main";
import NotConnected from "@/components/pages/NotConnected/NotConnected";

export default function Home() {
    const { address, isConnected } = useAccount();

    return (
        <>
            <Layout>
                {isConnected ? <Main /> : <NotConnected />}
            </Layout>
        </>
    );
}