import { Upload } from "@/components/Upload";
import { AppBar } from "@/components/AppBar";
import { Hero } from "@/components/Hero";


export default function Home() {
  return (
    <main>
      <AppBar/>
      <Hero/>
      <Upload/>
    </main>
  );
}
