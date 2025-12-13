import { ArrowRight, Database, Brain, Shield, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Architecture = () => {
  return (
    <section id="architecture" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          System Architecture
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          DeepTrust's multi-layer verification system ensures content authenticity through AI detection and blockchain verification
        </p>

        <div className="grid gap-8 mb-12">
          {/* Flow Diagram */}
          <div className="relative">
            <div className="grid md:grid-cols-5 gap-4 items-center">
              {/* Step 1: Upload */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <Database className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    User uploads content for verification
                  </p>
                </div>
              </Card>

              <div className="hidden md:flex justify-center">
                <ArrowRight className="w-8 h-8 text-primary animate-pulse-glow" />
              </div>

              {/* Step 2: AI Analysis */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">AI Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    HuggingFace AI analyzes content
                  </p>
                </div>
              </Card>

              <div className="hidden md:flex justify-center">
                <ArrowRight className="w-8 h-8 text-primary animate-pulse-glow" />
              </div>

              {/* Step 3: TrustScore */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">TrustScore</h3>
                  <p className="text-sm text-muted-foreground">
                    0-100% authenticity calculation
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-5 gap-4 items-center mt-4">
              <div className="md:col-start-2">
                <div className="hidden md:flex justify-center rotate-90 md:rotate-0">
                  <ArrowRight className="w-8 h-8 text-primary animate-pulse-glow" />
                </div>
              </div>

              {/* Step 4: Blockchain */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Blockchain</h3>
                  <p className="text-sm text-muted-foreground">
                    On-chain proof anchoring
                  </p>
                </div>
              </Card>

              <div className="hidden md:flex justify-center">
                <ArrowRight className="w-8 h-8 text-accent animate-pulse-glow" />
              </div>

              {/* Step 5: Badge */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-verified/50 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-verified/20 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-verified" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Verified Badge</h3>
                  <p className="text-sm text-muted-foreground">
                    Display verification result
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/30 backdrop-blur border-border">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-primary" />
              AI Detection Layer
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• HuggingFace Inference API</li>
              <li>• AI Image Detector model</li>
              <li>• Real vs Artificial classification</li>
              <li>• Confidence probability scores</li>
            </ul>
          </Card>

          <Card className="p-6 bg-card/30 backdrop-blur border-border">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <Award className="w-5 h-5 mr-2 text-accent" />
              TrustScore Engine
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 0-100% authenticity score</li>
              <li>• AI vs Human probability</li>
              <li>• Confidence level calculation</li>
              <li>• Status: Verified/Suspicious/Fake</li>
            </ul>
          </Card>

          <Card className="p-6 bg-card/30 backdrop-blur border-border">
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-verified" />
              Blockchain + IPFS
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• SHA-256 content hashing</li>
              <li>• Pinata IPFS metadata storage</li>
              <li>• BlockDAG smart contract</li>
              <li>• Immutable on-chain proofs</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
};
