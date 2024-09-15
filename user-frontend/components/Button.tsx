"use client";

export const Button=({label, onClick}:{
    label:string,
    onClick?: ()=>void;
})=>{
    return <button className="bg-slate-900 text-slate-100 text-sm border rounded-full p-2 pl-3 pr-3 m-2 cursor-pointer" onClick={onClick} >
        {label}
    </button>
}