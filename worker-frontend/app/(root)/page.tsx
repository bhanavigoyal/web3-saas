import { AppBar } from "@/components/AppBar";
import { NextTask } from "@/components/NextTask";

export default function Home() {
  return (
    <div className="flex flex-col items-center h-screen">
      <div className="w-full">
      <AppBar/>
      </div>
      <div className="text-xs font-light flex items-center pt-2 ">
        (use devnet for transactions)
      </div>
      <div className="w-full">
      <NextTask/>
      </div>
    </div>
  );
}
