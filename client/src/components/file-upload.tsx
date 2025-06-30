import { useState, useRef } from "react";
import { CloudUpload, FileAudio, X, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  accept: string;
  multiple?: boolean;
  onFilesChange: (files: string[]) => void;
  onActualFilesChange?: (files: File[]) => void; // 新增：傳遞實際檔案對象
  description: string;
}

interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "completed" | "error";
}

export function FileUpload({ accept, multiple = false, onFilesChange, onActualFilesChange, description }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [actualFiles, setActualFiles] = useState<File[]>([]); // 保存實際檔案對象
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 對於模特檔案，強制限制為單檔案上傳
  const isModelUpload = accept.includes('.mp4') || accept.includes('.avi') || accept.includes('.mov');
  const actualMultiple = isModelUpload ? false : multiple;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const stageFile = (file: File): string => {
    const fileName = file.name;
    const uploadedFile: UploadedFile = {
      name: fileName,
      size: file.size,
      progress: 100, // 暫存檔案顯示為完成狀態
      status: "completed",
    };

    setFiles(prev => [...prev, uploadedFile]);
    
    // 將檔案暫存在組件中，等待真正創建模特時再上傳
    // 這裡只返回檔案名稱，實際檔案會在創建模特時上傳
    return fileName;
  };

  const handleFiles = async (fileList: FileList) => {
    let fileArray = Array.from(fileList);
    
    // 如果是模特上傳，只取第一個檔案
    if (isModelUpload && fileArray.length > 1) {
      fileArray = [fileArray[0]];
      console.log('模特上傳限制為單檔案，只處理第一個檔案');
    }
    
    // 如果是模特上傳且已有檔案，先清空
    if (isModelUpload && files.length > 0) {
      setFiles([]);
      setActualFiles([]);
    }
    
    const stagedFileNames = fileArray.map(file => stageFile(file));
    
    // 保存實際檔案對象
    if (isModelUpload) {
      setActualFiles(fileArray);
      onActualFilesChange?.(fileArray);
    } else {
      const newActualFiles = [...actualFiles, ...fileArray];
      setActualFiles(newActualFiles);
      onActualFilesChange?.(newActualFiles);
    }
    
    // 直接使用暫存的檔案名稱，不進行實際上傳
    if (isModelUpload) {
      // 模特上傳只保留最新的檔案
      onFilesChange(stagedFileNames);
    } else {
      onFilesChange([...files.filter(f => f.status === "completed").map(f => f.name), ...stagedFileNames]);
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
            multiple={actualMultiple}
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
