import { Download, FileVideo, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

export function FilePreview({ fileName, fileUrl, fileType, fileSize }: FilePreviewProps) {
  const getFileIcon = () => {
    if (fileType.startsWith('video/')) return FileVideo;
    if (fileType.startsWith('image/')) return FileImage;
    return FileText;
  };

  const Icon = getFileIcon();
  const sizeMB = fileSize ? (fileSize / (1024 * 1024)).toFixed(2) : null;

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {sizeMB && (
          <p className="text-xs text-muted-foreground">{sizeMB} MB</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
