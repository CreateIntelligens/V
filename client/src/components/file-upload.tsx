import { useState, useRef } from "react";
import { CloudUpload, FileAudio, X, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  accept: string;
  multiple?: boolean;
  onFilesChange: (files: string[]) => void;
  description: string;
}

interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "completed" | "error";
}

export function FileUpload({ accept, multiple = false, onFilesChange, description }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const simulateUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const fileName = file.name;
      const uploadedFile: UploadedFile = {
        name: fileName,
        size: file.size,
        progress: 0,
        status: "uploading",
      };

      setFiles(prev => [...prev, uploadedFile]);

      // Simulate upload progress
      const interval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.name === fileName && f.status === "uploading") {
            const newProgress = Math.min(f.progress + 10, 100);
            return {
              ...f,
              progress: newProgress,
              status: newProgress === 100 ? "completed" : "uploading",
            };
          }
          return f;
        }));
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        resolve(fileName);
      }, 2000);
    });
  };

  const handleFiles = async (fileList: FileList) => {
    const fileArray = Array.from(fileList);
    const uploadPromises = fileArray.map(file => simulateUpload(file));
    
    try {
      const uploadedFileNames = await Promise.all(uploadPromises);
      onFilesChange([...files.filter(f => f.status === "completed").map(f => f.name), ...uploadedFileNames]);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    const remainingFiles = files.filter(f => f.name !== fileName && f.status === "completed").map(f => f.name);
    onFilesChange(remainingFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/60"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="text-gray-400 h-6 w-6" />
          </div>
          <p className="text-gray-600 mb-2">拖拽文件到此處，或點擊選擇</p>
          <p className="text-sm text-gray-500">{description}</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileAudio className="text-blue-500 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {file.status === "uploading" && (
                  <div className="w-16">
                    <Progress value={file.progress} className="h-1" />
                  </div>
                )}
                {file.status === "completed" && (
                  <CheckCircle className="text-green-500 h-5 w-5" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
