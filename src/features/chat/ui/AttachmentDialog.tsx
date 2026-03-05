import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, ChevronLeft, ChevronRight, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Setup PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Attachment {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  file_path: string;
}

interface AttachmentDialogProps {
  attachments: Attachment[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}

export const AttachmentDialog = ({
  attachments,
  currentIndex,
  open,
  onOpenChange,
  onIndexChange
}: AttachmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [textContent, setTextContent] = useState<string | null>(null);

  const currentAttachment = attachments[currentIndex];

  const handleDownload = async () => {
    if (!currentAttachment) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000${currentAttachment.file_path}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentAttachment.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
      setCurrentPage(1);
      setTextContent(null);
    } else {
      onIndexChange(attachments.length - 1);
      setCurrentPage(1);
      setTextContent(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < attachments.length - 1) {
      onIndexChange(currentIndex + 1);
      setCurrentPage(1);
      setTextContent(null);
    } else {
      onIndexChange(0);
      setCurrentPage(1);
      setTextContent(null);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const isVideo = (mimeType: string) => mimeType.startsWith('video/');
  const isAudio = (mimeType: string) => mimeType.startsWith('audio/');
  const isPDF = (mimeType: string) => mimeType === 'application/pdf';
  const isText = (mimeType: string) => mimeType.startsWith('text/') || 
    mimeType.includes('plain') || 
    mimeType.includes('xml') ||
    mimeType.includes('json');
  const isWord = (mimeType: string) => 
    mimeType.includes('word') || 
    mimeType.includes('document') ||
    mimeType.includes('msword') ||
    mimeType.includes('openxmlformats-officedocument.wordprocessingml');
  const isExcel = (mimeType: string) =>
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('ms-excel') ||
    mimeType.includes('openxmlformats-officedocument.spreadsheetml');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  // Load text content for text files
  useEffect(() => {
    if (currentAttachment && isText(currentAttachment.mime_type)) {
      setLoading(true);
      fetch(`http://localhost:3000${currentAttachment.file_path}`)
        .then(res => res.text())
        .then(text => {
          setTextContent(text);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setTextContent(null);
    }
  }, [currentAttachment]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[75vh] p-0 gap-0 flex flex-col bg-background">
        {/* Header with single close button */}
        <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-sm font-medium whitespace-nowrap">
              {currentIndex + 1} / {attachments.length}
            </span>
            {currentAttachment && (
              <span className="text-sm text-muted-foreground truncate">
                {currentAttachment.original_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleDownload}
              disabled={loading}
              title="Скачать"
            >
              <Download size={18} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
              title="Закрыть"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex items-center justify-center relative bg-muted/30 overflow-auto p-4">
          {/* Navigation buttons */}
          {attachments.length > 1 && (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="absolute left-2 h-8 w-8 z-10"
                onClick={handlePrevious}
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-2 h-8 w-8 z-10"
                onClick={handleNext}
              >
                <ChevronRight size={20} />
              </Button>
            </>
          )}

          {/* Media content */}
          <div className="w-full h-full flex items-center justify-center">
            {currentAttachment && (
              <>
                {isImage(currentAttachment.mime_type) ? (
                  <img
                    src={`http://localhost:3000${currentAttachment.file_path}`}
                    alt={currentAttachment.original_name}
                    className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-lg"
                  />
                ) : isVideo(currentAttachment.mime_type) ? (
                  <video
                    src={`http://localhost:3000${currentAttachment.file_path}`}
                    controls
                    className="max-w-full max-h-[55vh] rounded-lg shadow-lg"
                  />
                ) : isAudio(currentAttachment.mime_type) ? (
                  <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-lg shadow-lg min-w-[300px]">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                    <audio
                      src={`http://localhost:3000${currentAttachment.file_path}`}
                      controls
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground text-center">
                      {currentAttachment.original_name}
                    </span>
                  </div>
                ) : isPDF(currentAttachment.mime_type) ? (
                  <div className="bg-card rounded-lg shadow-lg overflow-auto max-h-[55vh]">
                    <Document
                      file={`http://localhost:3000${currentAttachment.file_path}`}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="w-[300px] h-[400px] flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      }
                      error={
                        <div className="w-[300px] h-[400px] flex items-center justify-center text-destructive text-center p-4">
                          Не удалось загрузить PDF
                        </div>
                      }
                    >
                      <Page 
                        pageNumber={currentPage} 
                        width={300}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>
                  </div>
                ) : isText(currentAttachment.mime_type) ? (
                  loading ? (
                    <div className="w-[300px] h-[300px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="bg-card rounded-lg shadow-lg p-4 max-w-[500px] max-h-[55vh] overflow-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono text-foreground">
                        {textContent || 'Пустой файл'}
                      </pre>
                    </div>
                  )
                ) : isWord(currentAttachment.mime_type) || isExcel(currentAttachment.mime_type) ? (
                  <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg shadow-lg">
                    <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium mb-1">{currentAttachment.original_name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(currentAttachment.size)}</p>
                    </div>
                    <Button onClick={handleDownload} disabled={loading}>
                      Скачать файл
                    </Button>
                    <p className="text-xs text-muted-foreground text-center max-w-[300px]">
                      Предпросмотр недоступен. Скачайте файл для просмотра.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-lg shadow-lg">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {currentAttachment.original_name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-medium mb-1">{currentAttachment.original_name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(currentAttachment.size)}</p>
                    </div>
                    <Button onClick={handleDownload} disabled={loading}>
                      Скачать файл
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {attachments.length > 1 && (
          <div className="flex gap-2 p-3 border-t overflow-x-auto flex-shrink-0">
            {attachments.map((attachment, index) => (
              <button
                key={attachment.id}
                onClick={() => {
                  onIndexChange(index);
                  setCurrentPage(1);
                  setTextContent(null);
                }}
                className={`
                  relative
                  w-12 h-12
                  rounded-lg
                  overflow-hidden
                  flex-shrink-0
                  border-2
                  transition-all
                  ${index === currentIndex 
                    ? 'border-primary scale-105' 
                    : 'border-border hover:border-muted-foreground'
                  }
                `}
              >
                {isImage(attachment.mime_type) ? (
                  <img
                    src={`http://localhost:3000${attachment.file_path}`}
                    alt={attachment.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : isPDF(attachment.mime_type) ? (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-[9px] text-muted-foreground font-medium text-center px-1">
                      {attachment.original_name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* PDF pagination */}
        {isPDF(currentAttachment?.mime_type || '') && numPages && numPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-3 border-t flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Пред.
            </Button>
            <span className="text-sm">
              Страница {currentPage} из {numPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              След.
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
