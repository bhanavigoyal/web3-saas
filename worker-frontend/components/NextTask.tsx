"use client";

import { useBalance } from "@/context/BalanceContext";
import { BACKEND_URL } from "@/utils"
import { useWallet } from "@solana/wallet-adapter-react";
import axios from "axios"
import { useEffect, useState } from "react"
import toast from "react-hot-toast";

interface Task{
    "id": number,
    "amount":number,
    "title":string,
    "options":{
        id:number,
        image_url: string,
        task_id:number
    }[]
}

export const NextTask=()=>{

    const {publicKey} = useWallet();
    const [currentTask, setCurrentTask]= useState<Task | null>(null)
    const [loading , setLoading] = useState(true)
    const [submitting, setSumbmitting] = useState(false)
    const {fetchBalance} = useBalance();

    useEffect(()=>{
        setLoading(true);
        axios.get(`${BACKEND_URL}/v1/worker/nextpost`,{
            headers:{
                Authorization: localStorage.getItem('token')
            }
        })
        .then(res=>{
            setCurrentTask(res.data.task);
            setLoading(false)
        })
        .catch(e=>{
            setLoading(false)
            setCurrentTask(null)
        })
    },[])

    if(loading){
        return <div className="flex justify-center items-center w-full h-96">
            <div role="status" className="flex items-center justify-center h-56 w-80 bg-gray-300 rounded-lg animate-pulse ">
            <svg className="w-10 h-10 text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
        </svg>
            <span className="sr-only">Loading...</span>
        </div>
        </div>
        
    }

    if(!currentTask){
        return <div className="flex justify-center flex-col h-96">
            <div className="w-full flex justify-center text-2xl">
                Please check back in some time, there are no pending tasks at the moment
            </div>
        </div>
    }

    return <div>
        <div>
        {currentTask.title}
        <div>
            {submitting && <div role="status">
    <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
    <span className="sr-only">Loading...</span>
</div>}
        </div>
        </div>
        <div className="flex justify-center pt-8">
            {currentTask.options.map(option=><Option key={option.id} image_url={option.image_url} onSelect={async()=>{
                if(!publicKey){
                    toast.error("Connect Your Wallet");
                    console.log("no key")
                    return;
                }
                setSumbmitting(true)
                try{
                    const response = await axios.post(`${BACKEND_URL}/v1/worker/submission`,{
                        taskId:currentTask.id.toString(),
                        selection: option.id.toString()
                    },{
                        headers:{
                            Authorization : localStorage.getItem('token')
                        }
                    });

                    const nextTask = response.data.nextTask;
                    if(nextTask){
                        setCurrentTask(nextTask)
                    }else{
                        setCurrentTask(null)
                    }
                    await fetchBalance();
                }catch(e){
                    console.error(e)
                }
                //refresh the user balance in app bar
                setSumbmitting(false)
            }}/>)}
        </div>
    </div>
}

function Option({image_url, onSelect}:{
    image_url:string,
    onSelect:()=>void
}){
    return <div>
        <img src={image_url} onClick={onSelect} className="p-3 w-96 rounded-md" />
    </div>
}