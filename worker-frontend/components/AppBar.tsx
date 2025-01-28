'use client';
import { BACKEND_URL } from "@/utils";
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "./Button";
import { useRouter } from "next/navigation";

export const AppBar=()=>{

    const {publicKey, signMessage} = useWallet();
    const [balance, setBalance] = useState(0);
    const router = useRouter();

    async function signAndSend(){
        if(!publicKey){
            return;
        }

        const message = new TextEncoder().encode("Sign into mechanical Turks as a worker");
        const signature = await signMessage?.(message);
        const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`,{
            signature,
            publicKey: publicKey.toString()
        });

        localStorage.setItem('token', response.data.token);
    }

    useEffect(()=>{
        signAndSend();
    },[publicKey])
    
    return <div className="border bottom-1 p-2 flex justify-between text-lg items-center">
        <div className="cursor-pointer" onClick={()=>{
            router.push("/")
        }}>
            CrowdRank | Vote & Earn 
        </div>
        <div className="flex">
            <div>
                <Button label={`Pay me Out (${balance}) SOL`} onClick={()=>{
                    axios.post(`${BACKEND_URL}/v1/worker/payout`,{

                    },{
                        headers:{
                            Authorization:localStorage.getItem('token')
                        }
                    })
                }}/>
            </div>
            <div>
                {publicKey? <WalletDisconnectButton/>:<WalletMultiButton/>}
            </div>
        </div>
    </div>
}