"use client";

import { BACKEND_URL } from "@/utils"
import axios from "axios"
import { useEffect, useState } from "react"

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
    
    const [currentTask, setCurrentTask]= useState<Task | null>(null)
    const [loading , setLoading] = useState(true)
    const [submitting, setSumbmitting] = useState(false)

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
        return <div>
            loading ...
        </div>
    }

    if(!currentTask){
        return <div className="h-screen flex justify-center flex-col">
            <div className="w-full flex justify-center text-2xl">
                Please check back in some time, there are no pending tasks at the moment
            </div>
        </div>
    }

    return <div>
        <div>
        {currentTask.title}
        <div>
            {submitting && "Submitting ..."}
        </div>
        </div>
        <div className="flex justify-center pt-8">
            {currentTask.options.map(option=><Option key={option.id} image_url={option.image_url} onSelect={async()=>{
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