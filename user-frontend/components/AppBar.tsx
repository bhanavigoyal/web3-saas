'use client';
import { BACKEND_URL } from "@/utils";
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const AppBar=()=>{
    const {publicKey, signMessage} = useWallet();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    async function signAndSend(){
        if(!publicKey){
            return;
        }

        const storedToken = localStorage.getItem('token')
        if (storedToken){
            setIsAuthenticated(true);
            return;
        }
        try{

            const message = new TextEncoder().encode("Sign into mechanical Turks");
            const signature = await signMessage?.(message);
            const response = await axios.post(`${BACKEND_URL}/v1/user/signin`,{
                signature:signature,
                publicKey: publicKey.toString()
            });
    
            localStorage.setItem('token', response.data.token);
            setIsAuthenticated(true);
        }catch(error){
            console.error("error signing:", error)
        }
    }

    useEffect(()=>{
        signAndSend();
    },[publicKey])

    return <div className="border bottom-1 p-2 flex justify-between text-lg items-center">
        <div className="cursor-pointer" onClick={()=>{
            router.push("/")
        }}>
            CrowdRank | Creator Hub
        </div>
        <div>
            {publicKey && isAuthenticated? <WalletDisconnectButton/>:<WalletMultiButton/>}
        </div>
    </div>
}