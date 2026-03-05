import { Reply } from "lucide-react";

interface ReplyPreviewProps {
  replyTo: {
    id: number;
    content: string;
    sender_name: string;
    attachments?: any[];
  };
  onClear: () => void;
}

export const ReplyPreview = ({ replyTo, onClear }: ReplyPreviewProps) => {
  return (
    <div className="flex items-start gap-2 p-2 bg-muted/50 border-b">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <Reply size={12} />
          <span className="font-medium">
            {replyTo.sender_name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {replyTo.content || (replyTo.attachments?.length ? '📎 Вложение' : '')}
        </p>
      </div>
      <button
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
