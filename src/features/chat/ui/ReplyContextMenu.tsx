import { Reply, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  content: string;
  sender_id: number;
  attachments?: any[];
}

interface ReplyContextMenuProps {
  message: Message;
  currentUser: any;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onReply: (message: Message) => void;
}

export const ReplyContextMenu = ({
  message,
  currentUser,
  position,
  onClose,
  onReply
}: ReplyContextMenuProps) => {
  if (!position || !message) return null;

  const handleReply = () => {
    onReply(message);
    onClose();
  };

  const handleCopy = async () => {
    if (message.content) {
      await navigator.clipboard.writeText(message.content);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        className="fixed z-50 bg-popover border rounded-lg shadow-lg min-w-[180px] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        style={{
          left: Math.min(position.x, window.innerWidth - 200),
          top: Math.min(position.y, window.innerHeight - 150),
        }}
      >
        <div className="flex items-center justify-between p-2 border-b bg-muted/50">
          <span className="text-xs font-medium text-muted-foreground">
            Сообщение
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X size={14} />
          </Button>
        </div>
        
        {/* Message preview */}
        <div className="p-2 max-w-[250px]">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {message.content || (message.attachments?.length ? '📎 Вложение' : '')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {message.sender_id === currentUser?.id ? 'Вы' : 'Собеседник'}
          </p>
        </div>
        
        {/* Actions */}
        <div className="p-1 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-9"
            onClick={handleReply}
          >
            <Reply size={16} />
            Ответить
          </Button>
          {message.content && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-9"
              onClick={handleCopy}
            >
              <Copy size={16} />
              Копировать
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
