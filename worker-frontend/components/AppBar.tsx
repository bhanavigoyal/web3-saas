'use client';
import { BACKEND_URL } from "@/utils";
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletDisconnectButton, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "./Button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useBalance } from "@/context/BalanceContext";

export const AppBar=()=>{

    const {publicKey, signMessage, disconnect, connected, select} = useWallet();
    const {balance, fetchBalance} = useBalance();
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const router = useRouter();

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

            const message = new TextEncoder().encode("Sign into mechanical Turks as a worker");
            const signature = await signMessage?.(message);
            const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`,{
                signature,
                publicKey: publicKey.toString()
            });
    
            localStorage.setItem('token', response.data.token);
            setIsAuthenticated(true)
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
            CrowdRank | Vote & Earn 
        </div>
        <div className="flex">
            <div>
                <Button label={`Pay me Out (${balance}) SOL`} onClick={async()=>{
                    if (!publicKey) {
                        toast.error("Connect your Wallet"); // Show error if no wallet is connected
                        return;
                    }
                    const result = await axios.post(`${BACKEND_URL}/v1/worker/payout`,{
                        },{
                            headers:{
                                Authorization:localStorage.getItem('token')
                            }
                        })
                    if (result.status===401){
                        toast.error("Transaction failed. Try again.")
                    }
                    if (result.status === 200){
                        toast.success("Transaction successfull");
                        fetchBalance();
                    }
                    
                }}/>
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
    </div>
}