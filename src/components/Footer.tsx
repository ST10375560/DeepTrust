import { Shield, Github } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 px-4 bg-card/30 backdrop-blur border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-bold text-xl">DeepTrust</h3>
              <p className="text-sm text-muted-foreground">Blockchain Oracle for Content Verification</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <a 
              href="https://github.com/ST10375560/DeepTrust" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>BlockDAG Buildathon - Wave 2 Submission</p>
          <p className="mt-1">Team: A Girl's World + Siya</p>
        </div>
      </div>
    </footer>
  );
};
