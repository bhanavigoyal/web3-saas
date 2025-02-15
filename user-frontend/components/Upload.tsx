"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { UploadImage } from "./UploadImage";
import { Button, LoadingButton } from "./Button";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";

export const Upload=()=>{
    const [title, setTitle] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [txSignature, setTxSignature] = useState("");
    const [loading, setLoading] = useState(false)

    const router = useRouter();
    const {publicKey, sendTransaction} = useWallet();
    const { connection } = useConnection();

    const parentAddress = process.env.NEXT_PUBLIC_PARENT_WALLET_ADDRESS

    async function onSubmit(){
        setLoading(true)
        if (!txSignature) {
            console.error("Missing transaction signature");
            alert("Transaction signature missing.");
            return;
        }
        const response = await axios.post(`${BACKEND_URL}/v1/user/task`,{
            options: images.map((image, index)=>({
                key:index,
                imageUrl : image
            })),
            title,
            signature: txSignature
        },{
            headers:{
                Authorization: localStorage.getItem("token")
            }
        })

        router.push(`task/${response.data.id}`)
        setLoading(false)
        toast.success("Task Submitted")
    }

    async function makePayment() {
        setLoading(true)
        if (!publicKey) {
            console.error("No public key available in wallet");
            return;
        }
    
        if (!parentAddress) {
            console.error("missing PARENT_WALLET_ADDRESS");
            return;
        }

        if (!PublicKey.isOnCurve(parentAddress)){
            console.error("Invalid parentkey");
            return;
        }

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(parentAddress),
                lamports: 100000000
            })
        );

        const {
            context: {slot: minContextSlot},
            value: {blockhash, lastValidBlockHeight}
        } = await connection.getLatestBlockhashAndContext();

        try{

            const signature = await sendTransaction(transaction, connection, {minContextSlot});
    
            await connection.confirmTransaction({blockhash, lastValidBlockHeight,signature});
            setTxSignature(signature);
            toast.success("Transaction success")
        }catch(error){
            console.error("Transaction error:", error);
            toast.error("Transaction failed");
        }

        setLoading(false)

    }


    return <div className="flex justify-center ">
        <div className="flex flex-col p-5 max-w-screen-lg w-full">
            <div className="text-2xl font-bold">
                Create a Task
            </div>
            <div className="flex items-center pt-2">
                <label className="pr-1 font-medium" >Task details</label>
                <label className="text-xs text-red-500"> * </label>
            </div>
            <input onChange={(e)=>{
                setTitle(e.target.value)
            }} type="text" className="border w-full mt-1 text-sm p-2 rounded-lg bg-gray-50 text-slate-900 focus:ring-slate-400 focus:ring-2 focus:outline-none" placeholder="What is your task?" required/>
            <label className="pt-6 font-medium">Add Images</label>
            <div className="flex justify-center pt-4 max-w-screen-lg">
                {images.map((image, index)=><UploadImage key={index} image={image} onImageAdded={(imageURL)=>{
                    setImages(i=>[...i, imageURL])
                }}/> )
            }
            </div>
            <div className="flex flex-col items-center">
                <div className="flex justify-center ml-4 pt-2">
                    <UploadImage onImageAdded={(imageURL)=>{
                        setImages(i=>[...i,imageURL])
                    }}/>
                </div>
                {
                    loading? <div>
                        <LoadingButton/>
                    </div>
                :
                    <div>
                        <Button label={txSignature? "Submit Task":"Pay 0.1 SOL"} onClick={txSignature? onSubmit:makePayment}/>
                    </div>

                }
            </div>
        </div>
    </div>

}