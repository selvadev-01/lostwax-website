import { Loader } from "@/components/Loader";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ProcessReel } from "@/components/ProcessReel";
import { Polish } from "@/components/Polish";
import { Collection } from "@/components/Collection";
import { Makers } from "@/components/Makers";
import { Commission } from "@/components/Commission";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Loader />
      <Nav />
      <main id="main">
        <Hero />
        <ProcessReel />
        <Polish />
        <Collection />
        <Makers />
        <Commission />
      </main>
      <Footer />
    </>
  );
}
