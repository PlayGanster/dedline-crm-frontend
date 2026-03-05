import { Upload, X, Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreview } from "./FilePreview";
import { useCallback, useState } from "react";

interface FileUploadZoneProps {
  files: File[];
  onFilesAdd: (files: File[]) => void;
  onFilesRemove: (index: number) => void;
  onFilesClear: () => void;
  disabled: boolean;
}

export const FileUploadZone = ({
  files,
  onFilesAdd,
  onFilesRemove,
  onFilesClear,
  disabled
}: FileUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.value = '';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesAdd(droppedFiles);
  }, [disabled, onFilesAdd]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      onFilesAdd(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onFilesAdd]);

  if (files.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative
          border-2
          border-dashed
          rounded-lg
          p-6
          text-center
          transition-all
          duration-200
          ${isDragOver 
            ? 'border-primary bg-primary/10 scale-[1.02]' 
            : 'border-border hover:border-muted-foreground/50'
          }
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar,.mp3,.mp4,.webm,.mov,.avi,.txt,.rtf"
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className={`w-8 h-8 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-sm text-muted-foreground">
            {isDragOver ? 'Отпустите для загрузки' : 'Перетащите файлы сюда или кликните для выбора'}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Максимальный размер файла: 10MB
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add more button - NOT the entire area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Paperclip size={16} />
          <span>Файлов выбрано: {files.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Plus size={16} className="mr-1" />
                Ещё
              </span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar,.mp3,.mp4,.webm,.mov,.avi,.txt,.rtf"
            />
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFilesClear}
            className="text-muted-foreground hover:text-destructive"
            disabled={disabled}
          >
            <X size={16} className="mr-1" />
            Очистить
          </Button>
        </div>
      </div>

      {/* File previews */}
      <div className="flex flex-wrap gap-3">
        {files.map((file, index) => (
          <FilePreview
            key={`${file.name}-${file.size}-${index}`}
            file={file}
            index={index}
            onRemove={() => onFilesRemove(index)}
          />
        ))}
      </div>
    </div>
  );
};
