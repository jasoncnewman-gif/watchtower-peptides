import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CalculatorSuite from "@/components/CalculatorSuite";

export default function CalculatorPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <Nav />
      <div className="pt-20">
        <CalculatorSuite />
      </div>
      <Footer verseIndex={0} />
    </div>
  );
}
