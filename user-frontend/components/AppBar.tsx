'use client';
import { BACKEND_URL } from "@/utils";
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppBar=()=>{
    const {publicKey, signMessage, connected, disconnect, select} = useWallet();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    async function signAndSend(){
        if(!publicKey || !signMessage){
            return;
        }

        const storedToken = localStorage.getItem('token')
        console.log(storedToken)
        if (storedToken){
            setIsAuthenticated(true);
            return;
        }
        try{
            const freshPublicKey = publicKey.toString();
            const message = new TextEncoder().encode("Sign into mechanical Turks");
            const signature = await signMessage(message);
            const response = await axios.post(`${BACKEND_URL}/v1/user/signin`,{
                signature:signature,
                publicKey: freshPublicKey
            });
    
            localStorage.setItem('token', response.data.token);
            setIsAuthenticated(true);
        }catch(error){
            toast.error("could not connect the wallet");
            setIsAuthenticated(false)
            console.error("error signing:", error);
            await disconnect();
            select(null)
        }
    }

    useEffect(()=>{
        if(connected){
            signAndSend();
        }else{
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            select(null);
        }
    },[publicKey]);

    return <div className="border bottom-1 p-2 flex justify-between text-lg items-center">
        <div className="cursor-pointer" onClick={()=>{
            router.push("/")
        }}>
            CrowdRank | Creator Hub
        </div>
        <div>
            {isAuthenticated?(<WalletDisconnectButton onClick={async()=>{
                localStorage.removeItem("token");
                setIsAuthenticated(false);
                await disconnect();
                select(null);
            }}/>):(
                <WalletMultiButton/>
            )}
        </div>
    </div>
}