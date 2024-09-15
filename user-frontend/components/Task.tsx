export const Task=({imageUrl, votes}:{imageUrl:string, votes:number})=>{
    return <div className="flex flex-col w-96">
        <img src={imageUrl} className="p-2 w-96 rounded-md"/>
        <div className="flex justify-center">
            {votes}
        </div>
    </div>
}