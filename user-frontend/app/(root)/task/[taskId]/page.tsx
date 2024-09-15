"use client";

import { AppBar } from "@/components/AppBar";
import { Task } from "@/components/Task";
import { BACKEND_URL } from "@/utils";

import axios from "axios";
import { useEffect, useState } from "react";

async function getTaskDetails(taskId:string){
    const response = await axios.get(`${BACKEND_URL}/v1/user/task/${taskId}`,{
        headers:{
            Authorization:localStorage.getItem('token')
        }
    });

    return response.data;
}

export default function Page({params:{
        taskId
    }
}:{params:{taskId: string}}){
    
    const [result, setResult] = useState<Record<string,{
        count:number;
        option:{
            imageUrl:string
        }
    }>>({});
    const [taskDetails, setTaskDetails] = useState<{title?:string}>({});

    useEffect(()=>{
        getTaskDetails(taskId)
            .then((data)=>{
                console.log(data)
                setResult(data.result),
                setTaskDetails(data.taskDetails)
            })
    },[]);


    return <div>
        <AppBar/>
        <div className="pt-20 text-2xl font-medium flex justify-center">
            {taskDetails.title}
        </div>
        <div className="flex justify-center pt-8">
            {Object.keys(result||{}).map(taskId=><Task imageUrl={result[taskId].option.imageUrl} votes={result[taskId].count} />)}
        </div>
    </div>
}