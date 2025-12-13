import { Card } from "@/components/ui/card";
import { Code2, Database, Shield, Cpu, CheckCircle2 } from "lucide-react";

export const TechStack = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Technology Stack
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Built with cutting-edge technologies for maximum performance and reliability
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI Detection</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• HuggingFace Inference</li>
              <li>• AI Image Detector Model</li>
              <li>• Real-time Analysis</li>
              <li>• Confidence Scoring</li>
            </ul>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Blockchain</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• BlockDAG Network</li>
              <li>• Solidity Smart Contracts</li>
              <li>• Ethers.js Integration</li>
              <li>• On-chain Proofs</li>
            </ul>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Backend</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Node.js + Express</li>
              <li>• Pinata IPFS Storage</li>
              <li>• SHA-256 Hashing</li>
              <li>• RESTful API</li>
            </ul>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Frontend</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• React + TypeScript</li>
              <li>• Vite</li>
              <li>• Tailwind CSS</li>
              <li>• shadcn/ui</li>
            </ul>
          </Card>
        </div>

        <Card className="mt-12 p-8 bg-card/30 backdrop-blur border-border">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <h3 className="text-2xl font-semibold">Fully Functional System</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-primary">AI Detection Layer</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Real HuggingFace API integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Deepfake detection model
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  TrustScore calculation
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-primary">Decentralized Storage</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  IPFS via Pinata
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Permanent metadata storage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Content-addressable CIDs
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-primary">Blockchain Anchoring</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Live on BlockDAG mainnet
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Immutable verification proofs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Viewable on block explorer
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
