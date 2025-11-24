import { Card } from "@/components/ui/card";
import { Code2, Database, Shield, Cpu } from "lucide-react";

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
            <h3 className="font-semibold mb-2">AI/ML</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• PyTorch</li>
              <li>• TensorFlow</li>
              <li>• CNN Architecture</li>
              <li>• Transformer Models</li>
            </ul>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Blockchain</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• BlockDAG Network</li>
              <li>• Smart Contracts</li>
              <li>• Oracle Integration</li>
              <li>• IPFS Storage</li>
            </ul>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Backend</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Node.js</li>
              <li>• FastAPI</li>
              <li>• GraphQL</li>
              <li>• WebSocket</li>
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
          <h3 className="text-2xl font-semibold mb-4">Wave 2 Deliverables</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-primary">Functional Architecture</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Multi-layer verification pipeline</li>
                <li>✓ AI detection scaffolding (CNN + Transformer)</li>
                <li>✓ TrustScore calculation engine</li>
                <li>✓ Blockchain integration layer</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-primary">Mock APIs & Smart Contracts</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Verification API endpoints</li>
                <li>✓ Smart contract scaffolds</li>
                <li>✓ Oracle integration structure</li>
                <li>✓ Badge generation system</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
