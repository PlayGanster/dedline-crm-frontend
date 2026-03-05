import { X, File, FileText, Image, Video, Music, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  index: number;
}

export const FilePreview = ({ file, onRemove, index }: FilePreviewProps) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return Archive;
    if (mimeType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const Icon = getFileIcon(file.type);
  const isImage = file.type.startsWith('image/');

  return (
    <div className="relative group animate-in fade-in zoom-in duration-200" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="
        relative
        w-32 h-32
        rounded-lg
        overflow-hidden
        bg-muted
        border
        border-border
        flex
        items-center
        justify-center
      ">
        {isImage ? (
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4">
            <Icon className="w-10 h-10 text-muted-foreground" />
            <span className="text-xs text-muted-foreground text-center truncate w-full">
              {file.name.split('.').pop()?.toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="
          absolute
          inset-0
          bg-black/60
          opacity-0
          group-hover:opacity-100
          transition-opacity
          flex
          items-center
          justify-center
        ">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
            onClick={onRemove}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      
      {/* File info below */}
      <div className="mt-1.5 px-1">
        <p className="text-xs font-medium truncate max-w-[128px]">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      
      {/* Remove button for mobile */}
      <Button
        size="icon"
        variant="destructive"
        className="absolute -top-2 -right-2 h-5 w-5 md:hidden"
        onClick={onRemove}
      >
        <X size={12} />
      </Button>
    </div>
  );
};
