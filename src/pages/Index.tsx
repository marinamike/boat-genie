import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, Ship, ClipboardList, Sparkles, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Anchor className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">Boat Genie</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-gold-light px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-foreground">Your Wish is Our Command</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 tracking-tight leading-tight">
            Luxury Yacht Concierge,{" "}
            <span className="text-primary">Simplified</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            The complete platform for boat owners and service providers. 
            Track maintenance, request services, and keep your vessel pristine.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-gold hover:opacity-90 shadow-gold text-foreground font-semibold text-base h-14 px-8 touch-target"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto font-semibold text-base h-14 px-8 touch-target border-2"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-secondary/50">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 tracking-tight">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            Powerful tools designed for the maritime community
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Ship,
                title: "Boat Profiles",
                description: "Complete vessel management with secure storage for slip numbers and gate codes.",
              },
              {
                icon: ClipboardList,
                title: "The Boat Log",
                description: "Permanent timeline of service records and photos for complete maintenance history.",
              },
              {
                icon: Sparkles,
                title: "Wish Form",
                description: "Request services with our intuitive form. Your wish is our command.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-gold-light rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
            Choose Your Membership
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Genie Members unlock wholesale pricing on all services
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Standard Tier */}
            <div className="p-6 rounded-xl bg-card border border-border text-left">
              <h3 className="text-xl font-bold mb-1">Standard</h3>
              <p className="text-muted-foreground text-sm mb-4">Retail pricing on services</p>
              <div className="text-3xl font-bold mb-5">Free</div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <span className="text-sm">Full boat management</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <span className="text-sm">Service request forms</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <span className="text-sm">Complete boat log history</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full h-12 font-semibold touch-target">
                Get Started
              </Button>
            </div>

            {/* Genie Tier */}
            <div className="p-6 rounded-xl bg-primary text-primary-foreground text-left relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gold text-foreground px-3 py-1 rounded-full text-xs font-bold">
                BEST VALUE
              </div>
              <h3 className="text-xl font-bold mb-1">Genie Member</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">Wholesale pricing on everything</p>
              <div className="text-3xl font-bold mb-5">$49<span className="text-base font-normal">/mo</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-gold" strokeWidth={1.5} />
                  <span className="text-sm">Everything in Standard</span>
                </li>
                <li className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-gold" strokeWidth={1.5} />
                  <span className="text-sm">Wholesale service pricing</span>
                </li>
                <li className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-gold" strokeWidth={1.5} />
                  <span className="text-sm">Priority scheduling</span>
                </li>
              </ul>
              <Button className="w-full h-12 bg-gold hover:bg-gold/90 text-foreground font-semibold touch-target">
                Become a Member
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-primary" strokeWidth={2} />
            <span className="font-semibold">Boat Genie</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2026 Boat Genie. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
