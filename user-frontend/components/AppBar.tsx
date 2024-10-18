'use client';
import { BACKEND_URL } from "@/utils";
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletConnectButton, WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { useEffect } from "react";

export const AppBar=()=>{
    const {publicKey, signMessage} = useWallet();

    async function signAndSend(){
        if(!publicKey){
            return;
        }

        const message = new TextEncoder().encode("Sign into mechanical Turks");
        const signature = await signMessage?.(message);
        const response = await axios.post(`${BACKEND_URL}/v1/user/signin`,{
            signature,
            publicKey: publicKey.toString()
        });

        localStorage.setItem('token', response.data.token);
    }

    useEffect(()=>{
        signAndSend();
    },[publicKey])

    return <div className="border bottom-1 p-2 flex justify-between text-lg items-center">
        <div>
            Turkify
        </div>
        <div>
            {publicKey? <WalletDisconnectButton/>:<WalletMultiButton/>}
        </div>
    </div>
}