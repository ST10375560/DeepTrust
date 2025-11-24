import { useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, Loader2, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type VerificationStatus = "idle" | "analyzing" | "complete";

interface VerificationResult {
  trustScore: number;
  status: "verified" | "suspicious" | "fake";
  analysis: {
    visual: number;
    temporal: number;
    audio: number;
    metadata: number;
  };
  blockchainHash: string;
  timestamp: string;
}

export const VerificationDemo = () => {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const simulateVerification = () => {
    setStatus("analyzing");
    setProgress(0);
    setResult(null);

    // Simulate AI analysis progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // Simulate verification completion
    setTimeout(() => {
      const trustScore = Math.floor(Math.random() * 100);
      const mockResult: VerificationResult = {
        trustScore,
        status: trustScore > 80 ? "verified" : trustScore > 50 ? "suspicious" : "fake",
        analysis: {
          visual: Math.floor(Math.random() * 100),
          temporal: Math.floor(Math.random() * 100),
          audio: Math.floor(Math.random() * 100),
          metadata: Math.floor(Math.random() * 100),
        },
        blockchainHash: `0x${Math.random().toString(16).substring(2, 18)}...`,
        timestamp: new Date().toISOString(),
      };
      
      setResult(mockResult);
      setStatus("complete");
      
      toast({
        title: "Verification Complete",
        description: `TrustScore: ${trustScore}% - ${mockResult.status.toUpperCase()}`,
      });
    }, 3500);
  };

  return (
    <section id="verify" className="py-20 px-4 bg-gradient-hero">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Live Verification Demo
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Experience DeepTrust's AI-powered verification system in action
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <Card className="p-8 bg-card/50 backdrop-blur border-border">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Upload Content</h3>
                <p className="text-muted-foreground mb-6">
                  Upload images, videos, or audio files for verification
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-12 mb-6 hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, MP4, MP3, WAV
                </p>
              </div>

              <Button 
                onClick={simulateVerification} 
                disabled={status === "analyzing"}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {status === "analyzing" ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Start Verification
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Results Area */}
          <Card className="p-8 bg-card/50 backdrop-blur border-border">
            <h3 className="text-2xl font-semibold mb-6">Verification Results</h3>
            
            {status === "idle" && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Upload content to begin verification</p>
                </div>
              </div>
            )}

            {status === "analyzing" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span>AI Analysis Progress</span>
                    <span className="text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                    Analyzing visual artifacts...
                  </div>
                  <div className="flex items-center text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                    Checking temporal consistency...
                  </div>
                  <div className="flex items-center text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                    Generating blockchain proof...
                  </div>
                </div>
              </div>
            )}

            {status === "complete" && result && (
              <div className="space-y-6">
                {/* TrustScore */}
                <div className="text-center p-6 rounded-lg bg-background/50">
                  <div className="text-6xl font-bold mb-2" style={{
                    color: result.status === "verified" ? "hsl(var(--verified))" : 
                           result.status === "suspicious" ? "hsl(var(--warning))" : 
                           "hsl(var(--destructive))"
                  }}>
                    {result.trustScore}%
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">TrustScore</p>
                  <Badge 
                    variant={result.status === "verified" ? "default" : "destructive"}
                    className={result.status === "verified" ? "bg-verified" : result.status === "suspicious" ? "bg-warning" : ""}
                  >
                    {result.status === "verified" && <CheckCircle2 className="w-4 h-4 mr-1" />}
                    {result.status === "suspicious" && <AlertTriangle className="w-4 h-4 mr-1" />}
                    {result.status === "fake" && <AlertTriangle className="w-4 h-4 mr-1" />}
                    {result.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Analysis Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Analysis Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(result.analysis).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{key} Analysis</span>
                          <span>{value}%</span>
                        </div>
                        <Progress value={value} className="h-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blockchain Info */}
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-accent mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Blockchain Proof</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Verification anchored on-chain
                      </p>
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {result.blockchainHash}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};
