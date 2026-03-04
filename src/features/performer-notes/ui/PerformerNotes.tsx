import { useState, useEffect } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, Trash2, Save, X } from "lucide-react"
import { useAuthStore } from "@/features/auth"

interface Note {
  id: number
  performerId: number
  userId: number
  content: string
  created_at: string
  updated_at: string
  user: {
    id: number
    first_name: string
    last_name: string
    avatar?: string | null
  }
}

interface PerformerNotesProps {
  performerId: number
}

const PerformerNotes: React.FC<PerformerNotesProps> = ({ performerId }) => {
  const { user: currentUser } = useAuthStore()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState("")

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await api.get<Note[]>(`/performer-notes/performer/${performerId}`)
      setNotes(response)
    } catch (err: any) {
      console.error('[PerformerNotes] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [performerId])

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      await api.post('/performer-notes', { performerId, content: newNote })
      notifySuccess('Заметка добавлена', '')
      setNewNote("")
      fetchNotes()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось добавить заметку')
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingId(note.id)
    setEditingContent(note.content)
  }

  const handleSaveEdit = async (id: number) => {
    if (!editingContent.trim()) return
    try {
      await api.put(`/performer-notes/${id}`, { content: editingContent })
      notifySuccess('Заметка обновлена', '')
      setEditingId(null)
      fetchNotes()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить заметку')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingContent("")
  }

  const handleDeleteNote = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту заметку?')) return
    try {
      await api.delete(`/performer-notes/${id}`)
      notifySuccess('Заметка удалена', '')
      fetchNotes()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось удалить заметку')
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${lastName[0]}${firstName[0]}`.toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Заметки</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Добавить заметку..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              Добавить заметку
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Загрузка заметок...</p>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Заметок пока нет</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="flex gap-3 p-3 rounded-lg border bg-card">
                <Avatar className="h-10 w-10">
                  {note.user.avatar && <AvatarImage src={note.user.avatar} alt={note.user.last_name} />}
                  <AvatarFallback>{getInitials(note.user.first_name, note.user.last_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {note.user.last_name} {note.user.first_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(note.created_at)}</span>
                    </div>
                    {note.userId === currentUser?.id && (
                      <div className="flex gap-1">
                        {editingId === note.id ? (
                          <>
                            <Button size="icon-sm" variant="ghost" onClick={() => handleSaveEdit(note.id)}>
                              <Save size={16} />
                            </Button>
                            <Button size="icon-sm" variant="ghost" onClick={handleCancelEdit}>
                              <X size={16} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="icon-sm" variant="ghost" onClick={() => handleEditNote(note)}>
                              <Pencil size={16} />
                            </Button>
                            <Button size="icon-sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteNote(note.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {editingId === note.id ? (
                    <Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} rows={3} autoFocus />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PerformerNotes
