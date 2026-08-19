import Hero from "@/components/Hero";
import About from "@/components/About";
import GalleryPreview from "@/components/GalleryPreview";
import GalleryNotification from "@/components/GalleryNotification";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <GalleryPreview />
      <GalleryNotification />
      <Footer />
    </main>
  );
}
