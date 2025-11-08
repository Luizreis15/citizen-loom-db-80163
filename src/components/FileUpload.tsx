import { useState, useCallback } from "react";
import { Upload, X, File, FileVideo, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  clientId: string;
  requestId?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export function FileUpload({ 
  onFilesUploaded, 
  maxSize = 100, 
  acceptedTypes = ['video/*', 'image/*', '.pdf', '.doc', '.docx'],
  clientId,
  requestId
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return FileVideo;
    if (type.startsWith('image/')) return FileImage;
    return FileText;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles);
    }
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSize) {
        toast.error(`${file.name} excede o tamanho máximo de ${maxSize}MB`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = requestId 
          ? `${clientId}/${requestId}/${fileName}`
          : `${clientId}/temp/${fileName}`;

        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 200);

        const { data, error } = await supabase.storage
          .from('client-uploads')
          .upload(filePath, file);

        clearInterval(progressInterval);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('client-uploads')
          .getPublicUrl(filePath);

        setProgress(prev => ({ ...prev, [file.name]: 100 }));

        uploadedFiles.push({
          id: data.path,
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        });
      }

      onFilesUploaded(uploadedFiles);
      setFiles([]);
      setProgress({});
      toast.success('Arquivos enviados com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivos: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            Tamanho máximo: {maxSize}MB por arquivo
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            const fileProgress = progress[file.name] || 0;

            return (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{sizeMB} MB</p>
                  {uploading && (
                    <Progress value={fileProgress} className="h-1 mt-2" />
                  )}
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}

          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Enviando...' : `Enviar ${files.length} arquivo(s)`}
          </Button>
        </div>
      )}
    </div>
  );
}
