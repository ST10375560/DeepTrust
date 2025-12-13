import { Shield, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
      
      <div className="container relative z-10 mx-auto px-4 py-20 text-center">
        <div className="mb-8 inline-block">
          <div className="relative">
            <Shield className="w-20 h-20 text-primary animate-float" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent animate-slide-up">
          DeepTrust
        </h1>
        
        <p className="text-2xl md:text-3xl text-primary mb-4 font-semibold animate-slide-up" style={{ animationDelay: "0.1s" }}>
          The Blockchain Oracle That Protects Reality
        </p>
        
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
          In a world where AI can lie, trust must be verifiable. DeepTrust combines state-of-the-art AI detection with on-chain verification to ensure content authenticity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <Button 
            size="lg" 
            className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8"
            onClick={() => document.getElementById('verify')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Upload className="mr-2 h-5 w-5" />
            Start Verification
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-primary/50 hover:bg-primary/10 text-lg px-8"
            onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View Architecture
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Detection</h3>
            <p className="text-sm text-muted-foreground">
              Real-time deepfake analysis powered by HuggingFace AI models
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">TrustScore</h3>
            <p className="text-sm text-muted-foreground">
              0-100% authenticity score with AI probability breakdown
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card/50 backdrop-blur border border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">On-Chain Proof</h3>
            <p className="text-sm text-muted-foreground">
              Immutable verification on BlockDAG with IPFS metadata
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
