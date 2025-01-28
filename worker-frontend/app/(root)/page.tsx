import { AppBar } from "@/components/AppBar";
import { NextTask } from "@/components/NextTask";

export default function Home() {
  return (
    <div>
      <AppBar/>
      <div className="text-xs font-light">
        (use devnet for transactions)
      </div>
      <NextTask/>
    </div>
  );
}
