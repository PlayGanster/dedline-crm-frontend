import { useState, useEffect, useRef } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Trash2, CheckCircle2, Circle } from "lucide-react"
import { useAuthStore } from "@/features/auth"

interface Document {
  id: number
  performerId: number
  userId: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  encryptedPath: string
  description?: string
  is_verified: boolean
  verified_by?: number | null
  verified_at?: string | null
  verifiedBy?: { id: number; first_name: string; last_name: string } | null
  created_at: string
  updated_at: string
  user: { id: number; first_name: string; last_name: string; avatar?: string | null }
}

interface PerformerDocumentsProps {
  performerId: number
}

const PerformerDocuments: React.FC<PerformerDocumentsProps> = ({ performerId }) => {
  const { user: currentUser } = useAuthStore()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await api.get<Document[]>(`/performer-documents/performer/${performerId}`)
      setDocuments(response)
    } catch (err: any) {
      console.error('[PerformerDocuments] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [performerId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.size > 10 * 1024 * 1024) {
      notifyError('Ошибка', 'Размер файла не должен превышать 10MB')
      return
    }
    setSelectedFile(file || null)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      notifyError('Ошибка', 'Выберите файл')
      return
    }
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('performerId', performerId.toString())
      if (description) formData.append('description', description)
      await api.post('/performer-documents', formData)
      notifySuccess('Документ загружен', '')
      setSelectedFile(null)
      setDescription("")
      setShowUploadForm(false)
      fetchDocuments()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось загрузить документ')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (id: number, originalName: string) => {
    try {
      const response = await fetch(`http://localhost:3000/performer-documents/${id}/download`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      })
      if (!response.ok) throw new Error('Ошибка загрузки')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      notifySuccess('Документ скачан', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось скачать документ')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) return
    try {
      await api.delete(`/performer-documents/${id}`)
      notifySuccess('Документ удалён', '')
      fetchDocuments()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось удалить документ')
    }
  }

  const handleVerify = async (id: number) => {
    try {
      await api.post(`/performer-documents/${id}/verify`)
      notifySuccess('Документ проверен', '')
      fetchDocuments()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось проверить документ')
    }
  }

  const handleUnverify = async (id: number) => {
    try {
      await api.post(`/performer-documents/${id}/unverify`)
      notifySuccess('Проверка снята', '')
      fetchDocuments()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось снять проверку')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('word')) return '📝'
    return '📁'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Документы</CardTitle>
          <Button size="sm" onClick={() => setShowUploadForm(!showUploadForm)}>
            <Upload size={16} className="mr-2" />
            {showUploadForm ? 'Отмена' : 'Загрузить'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showUploadForm && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>Файл</Label>
              <Input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx" />
              {selectedFile && <p className="text-xs text-muted-foreground">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
            </div>
            <div className="space-y-2">
              <Label>Описание (необязательно)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Дополнительная информация..." rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowUploadForm(false); setSelectedFile(null); setDescription("") }}>Отмена</Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile}>{uploading ? 'Загрузка...' : 'Загрузить'}</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Загрузка документов...</p>
          ) : documents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Документов пока нет</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="text-2xl">{getFileIcon(doc.mimeType)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{doc.originalName}</span>
                    <Badge className={doc.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {doc.is_verified ? (<span className="flex items-center gap-1"><CheckCircle2 size={12} /> Проверен</span>) : (<span className="flex items-center gap-1"><Circle size={12} /> Не проверен</span>)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>{formatDateTime(doc.created_at)}</span>
                    <span>{doc.user.last_name} {doc.user.first_name}</span>
                  </div>
                  {doc.description && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.description}</p>}
                  {doc.is_verified && doc.verifiedBy && (
                    <p className="text-xs text-green-600 mt-1">Проверил: {doc.verifiedBy.last_name} {doc.verifiedBy.first_name}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => handleVerify(doc.id)} title="Проверить" className={doc.is_verified ? 'text-green-600' : 'text-muted-foreground'}><CheckCircle2 size={16} /></Button>
                  {doc.is_verified && <Button size="icon-sm" variant="ghost" onClick={() => handleUnverify(doc.id)} title="Снять проверку"><Circle size={16} /></Button>}
                  <Button size="icon-sm" variant="ghost" onClick={() => handleDownload(doc.id, doc.originalName)} title="Скачать"><Download size={16} /></Button>
                  <Button size="icon-sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(doc.id)} title="Удалить"><Trash2 size={16} /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PerformerDocuments
