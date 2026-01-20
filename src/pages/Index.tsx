import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Anchor, Ship, ClipboardList, Sparkles, Shield, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-ocean rounded-lg flex items-center justify-center">
              <Anchor className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">Boat Genie</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-gradient-ocean hover:opacity-90 transition-opacity">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-sky">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-teal-light px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-teal" />
            <span className="text-sm font-medium text-teal">Your Wish is Our Command</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Maritime Management,{" "}
            <span className="text-gradient-ocean">Simplified</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            The complete platform for boat owners, service providers, and marina administrators. 
            Track maintenance, request services, and keep your vessel in pristine condition.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-sunset hover:opacity-90 shadow-coral transition-all text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Powerful tools designed for the maritime community
          </p>
          <div className="grid md:grid-cols-3 gap-8">
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
                description: "Request services with our intuitive multi-step form. Your wish is our command.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-card border border-border hover:shadow-lg hover:border-teal/30 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-14 h-14 bg-teal-light rounded-xl flex items-center justify-center mb-6 group-hover:bg-gradient-teal transition-colors">
                  <feature.icon className="w-7 h-7 text-teal group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-20 px-6 bg-ocean-light">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Choose Your Membership
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Genie Members unlock wholesale pricing on all services
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-2xl bg-card border border-border">
              <h3 className="text-2xl font-display font-semibold mb-2">Standard</h3>
              <p className="text-muted-foreground mb-6">Retail pricing on services</p>
              <div className="text-4xl font-bold mb-6">Free</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal" />
                  <span>Full boat management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal" />
                  <span>Service request forms</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal" />
                  <span>Complete boat log history</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full">Get Started</Button>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-ocean text-primary-foreground relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-coral px-3 py-1 rounded-full text-xs font-semibold">
                BEST VALUE
              </div>
              <h3 className="text-2xl font-display font-semibold mb-2">Genie Member</h3>
              <p className="text-primary-foreground/80 mb-6">Wholesale pricing on everything</p>
              <div className="text-4xl font-bold mb-6">$49<span className="text-lg font-normal">/mo</span></div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-coral" />
                  <span>Everything in Standard</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-coral" />
                  <span>Wholesale service pricing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-coral" />
                  <span>Priority scheduling</span>
                </li>
              </ul>
              <Button className="w-full bg-coral hover:bg-coral/90">Become a Member</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Anchor className="w-6 h-6 text-teal" />
            <span className="font-display font-semibold">Boat Genie</span>
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
