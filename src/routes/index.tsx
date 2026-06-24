import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Fleet } from "@/components/Fleet";
import { HowItWorks } from "@/components/HowItWorks";
import { BookingCalendar } from "@/components/BookingCalendar";
import { Routes as RoutesSection } from "@/components/Routes";
import { Reviews } from "@/components/Reviews";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Camper Retreat VLC — Alquiler de autocaravana en Valencia" },
      { name: "description", content: "McLouis Yearling 89G para hasta 5 personas. Reserva por WhatsApp en minutos." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Fleet />
        <HowItWorks />
        <BookingCalendar />
        <RoutesSection />
        <Reviews />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
