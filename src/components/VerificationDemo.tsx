import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
  X,
  FileImage,
  ExternalLink,
  Copy,
  CheckCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api, VerificationResult } from "@/lib/api";

type VerificationStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

interface AnalysisStep {
  label: string;
  status: "pending" | "active" | "complete";
}

export const VerificationDemo = () => {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { label: "Uploading file...", status: "pending" },
    { label: "Validating content...", status: "pending" },
    { label: "Running AI analysis...", status: "pending" },
    { label: "Storing metadata on IPFS...", status: "pending" },
    { label: "Anchoring to blockchain...", status: "pending" },
  ]);

  // Check server status on mount
  useEffect(() => {
    api.isServerOnline().then(setServerOnline);
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const updateStep = (index: number, status: "pending" | "active" | "complete") => {
    setAnalysisSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const resetSteps = () => {
    setAnalysisSteps((prev) => prev.map((step) => ({ ...step, status: "pending" })));
  };

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setError(null);
    setStatus("idle");

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, [toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startVerification = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to verify",
        variant: "destructive",
      });
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setResult(null);
    setError(null);
    resetSteps();

    try {
      // Step 1: Upload
      updateStep(0, "active");
      setProgress(10);

      // Step 2: Validate
      await new Promise((r) => setTimeout(r, 300));
      updateStep(0, "complete");
      updateStep(1, "active");
      setProgress(20);

      // Step 3: AI Analysis
      await new Promise((r) => setTimeout(r, 300));
      updateStep(1, "complete");
      updateStep(2, "active");
      setStatus("analyzing");
      setProgress(40);

      // Make the actual API call
      const verificationResult = await api.verifyFile(selectedFile, (stage, prog) => {
        setProgress(prog);
      });

      // Step 4: IPFS
      updateStep(2, "complete");
      updateStep(3, "active");
      setProgress(70);
      await new Promise((r) => setTimeout(r, 300));

      // Step 5: Blockchain
      updateStep(3, "complete");
      updateStep(4, "active");
      setProgress(90);
      await new Promise((r) => setTimeout(r, 300));

      // Complete
      updateStep(4, "complete");
      setProgress(100);
      setResult(verificationResult);
      setStatus("complete");

      toast({
        title: "Verification Complete",
        description: `TrustScore: ${verificationResult.trustScore}% - ${verificationResult.status.toUpperCase()}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed";
      setError(errorMessage);
      setStatus("error");
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <section id="verify" className="py-20 px-4 bg-gradient-hero">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          Live Verification Demo
        </h2>
        <p className="text-center text-muted-foreground mb-4 max-w-2xl mx-auto">
          Experience DeepTrust's AI-powered verification system in action
        </p>

        {/* Server Status */}
        <div className="flex justify-center mb-8">
          <Badge variant={serverOnline ? "default" : "destructive"} className="text-xs">
            {serverOnline === null ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Checking server...
              </>
            ) : serverOnline ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Server Online
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Server Offline - Start backend with: node server/server.js
              </>
            )}
          </Badge>
        </div>

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
                  Upload images for AI-powered deepfake detection
                </p>
              </div>

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleInputChange}
                className="hidden"
              />

              {/* Drop Zone */}
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-lg p-12 mb-6 transition-colors cursor-pointer ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF, WebP (max 50MB)
                  </p>
                </div>
              ) : (
                /* File Preview */
                <div className="border rounded-lg p-4 mb-6 relative">
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded mb-3 object-contain"
                    />
                  ) : (
                    <FileImage className="w-16 h-16 mx-auto mb-3 text-muted-foreground" />
                  )}

                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}

              <Button
                onClick={startVerification}
                disabled={!selectedFile || status === "uploading" || status === "analyzing"}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {status === "uploading" || status === "analyzing" ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {status === "uploading" ? "Uploading..." : "Analyzing..."}
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

            {(status === "uploading" || status === "analyzing") && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Verification Progress</span>
                    <span className="text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-3">
                  {analysisSteps.map((step, index) => (
                    <div key={index} className="flex items-center text-sm">
                      {step.status === "pending" && (
                        <div className="w-4 h-4 mr-2 rounded-full border border-muted-foreground/30" />
                      )}
                      {step.status === "active" && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                      )}
                      {step.status === "complete" && (
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      )}
                      <span
                        className={
                          step.status === "active"
                            ? "text-primary"
                            : step.status === "complete"
                            ? "text-muted-foreground"
                            : ""
                        }
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center h-64 text-destructive">
                <AlertTriangle className="w-16 h-16 mb-4" />
                <p className="font-semibold mb-2">Verification Failed</p>
                <p className="text-sm text-muted-foreground text-center">{error}</p>
                <Button variant="outline" onClick={clearFile} className="mt-4">
                  Try Again
                </Button>
              </div>
            )}

            {status === "complete" && result && (
              <div className="space-y-6">
                {/* TrustScore */}
                <div className="text-center p-6 rounded-lg bg-background/50">
                  <div
                    className="text-6xl font-bold mb-2"
                    style={{
                      color:
                        result.status === "verified"
                          ? "hsl(var(--verified, 142 76% 36%))"
                          : result.status === "suspicious"
                          ? "hsl(var(--warning, 38 92% 50%))"
                          : "hsl(var(--destructive))",
                    }}
                  >
                    {result.trustScore}%
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">TrustScore</p>
                  <Badge
                    variant={result.status === "verified" ? "default" : "destructive"}
                    className={
                      result.status === "verified"
                        ? "bg-green-600"
                        : result.status === "suspicious"
                        ? "bg-yellow-600"
                        : ""
                    }
                  >
                    {result.status === "verified" && <CheckCircle2 className="w-4 h-4 mr-1" />}
                    {(result.status === "suspicious" || result.status === "fake") && (
                      <AlertTriangle className="w-4 h-4 mr-1" />
                    )}
                    {result.status.toUpperCase()}
                  </Badge>

                  {result.isAIGenerated && (
                    <p className="text-sm text-yellow-500 mt-3">
                      This content appears to be AI-generated
                    </p>
                  )}
                </div>

                {/* Analysis Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Analysis Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded bg-background/50">
                      <p className="text-muted-foreground text-xs">AI Probability</p>
                      <p className="font-mono">
                        {(result.analysis.aiProbability * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 rounded bg-background/50">
                      <p className="text-muted-foreground text-xs">Real Probability</p>
                      <p className="font-mono">
                        {(result.analysis.realProbability * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 rounded bg-background/50">
                      <p className="text-muted-foreground text-xs">Confidence</p>
                      <p className="font-mono">{result.confidence}%</p>
                    </div>
                    <div className="p-3 rounded bg-background/50">
                      <p className="text-muted-foreground text-xs">Model</p>
                      <p className="font-mono text-xs truncate">{result.analysis.modelUsed}</p>
                    </div>
                  </div>
                </div>

                {/* Blockchain Proof */}
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">Blockchain Proof</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {result.blockchainProof.isMock
                          ? "Simulated proof (blockchain not configured)"
                          : "Verification anchored on BlockDAG"}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded truncate flex-1">
                          {result.blockchainProof.txHash}
                        </code>
                        <button
                          onClick={() => copyToClipboard(result.blockchainProof.txHash)}
                          className="p-1 hover:bg-background rounded"
                          title="Copy transaction hash"
                        >
                          {copied ? (
                            <CheckCheck className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {result.blockchainProof.blockNumber && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Block #{result.blockchainProof.blockNumber}
                        </p>
                      )}
                      {!result.blockchainProof.isMock && result.blockchainProof.txHash && (
                        <a
                          href={result.blockchainProof.explorerUrl || `https://awakening.bdagscan.com/tx/${result.blockchainProof.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on BlockDAG Explorer
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* IPFS Link */}
                {result.metadataCid && (
                  <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">Metadata (IPFS)</h4>
                        <code className="text-xs text-muted-foreground">
                          {result.metadataCid.substring(0, 20)}...
                        </code>
                      </div>
                      {result.metadataUrl && !result.metadataCid.startsWith("mock") && (
                        <a
                          href={result.metadataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-background rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Verify Another Button */}
                <Button variant="outline" onClick={clearFile} className="w-full">
                  Verify Another File
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};
