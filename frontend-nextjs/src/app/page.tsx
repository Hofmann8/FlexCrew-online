import Hero from '@/components/Hero';
import About from '@/components/About';

export default function Home() {
  return (
    <main className="overflow-auto">
      <Hero />
      <div className="bg-white relative z-10">
        <About />
      </div>
    </main>
  );
}
