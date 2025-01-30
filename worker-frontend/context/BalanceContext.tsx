import { BACKEND_URL } from "@/utils";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react"

interface BalanceContextType{
    balance: number
    fetchBalance: ()=>void
}

const BalanceContext = createContext<BalanceContextType|undefined>(undefined);

export const BalanceProvider=({children}:{
    children: React.ReactNode
})=>{
    const [balance, setBalance] = useState(0);

    async function fetchBalance(){
        try{
            const response = await axios.get(`${BACKEND_URL}/v1/worker/balance`,{
                headers:{
                    Authorization: localStorage.getItem("token")
                }
            });

            setBalance(response.data.pendingAmount/1e9);
        }catch(error){
            console.error("Error fetching balance:", error);
        }
    }

    useEffect(()=>{
        fetchBalance();
    },[]);

    return(
        <BalanceContext.Provider value={{balance,fetchBalance}}>
            {children}
        </BalanceContext.Provider>
    )
}

export const useBalance =()=>{
    const context = useContext(BalanceContext);

    if(!context){
        throw new Error("useBalance must be used within Balance Provider");
    }

    return context;
}