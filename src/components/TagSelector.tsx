import { useMemo, useState } from 'react'
import type { Tag } from '../services/tags'

type TagSelectorProps = {
  tags: Tag[]
  value: string
  onChange: (value: string) => void
  onCreate: (name: string) => Promise<Tag>
  loading?: boolean
  error?: string
}

function TagSelector({ tags, value, onChange, onCreate, loading = false, error }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')
  const [showInlineInput, setShowInlineInput] = useState(false)

  const inlineMode = tags.length <= 8
  const selectedTag = useMemo(() => tags.find((t) => String(t.id) === value), [tags, value])

  const handleSelect = (tagId: number) => {
    onChange(String(tagId))
    setIsOpen(false)
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      setLocalError('Informe um nome')
      return
    }
    setSaving(true)
    setLocalError('')
    try {
      const created = await onCreate(newName.trim())
      onChange(String(created.id))
      setNewName('')
      setIsOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar tag'
      setLocalError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleInlineCreate = async () => {
    if (!newName.trim()) {
      setLocalError('Informe um nome')
      return
    }
    setSaving(true)
    setLocalError('')
    try {
      const created = await onCreate(newName.trim())
      onChange(String(created.id))
      setNewName('')
      setShowInlineInput(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar tag'
      setLocalError(message)
    } finally {
      setSaving(false)
    }
  }

  if (inlineMode) {
    return (
      <div className="tag-selector inline-mode">
        <div className="tag-inline-grid">
          {!loading &&
            tags.map((tag) => (
              <button
                type="button"
                key={tag.id}
                className={`tag-chip ${value === String(tag.id) ? 'selected' : ''}`}
                onClick={() => handleSelect(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          {tags.length === 0 && !loading && <span className="muted">Nenhuma tag. Crie uma nova.</span>}
          <button
            type="button"
            className="tag-chip add"
            onClick={() => setShowInlineInput((prev) => !prev)}
            aria-label="Adicionar tag"
          >
            +
          </button>
        </div>
        {showInlineInput && (
          <div className="tag-inline-add">
            <input
              type="text"
              placeholder="Nova tag"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleInlineCreate()
                }
              }}
            />
            <button type="button" onClick={handleInlineCreate} disabled={saving}>
              {saving ? 'Criando...' : 'Salvar'}
            </button>
          </div>
        )}
        {localError && <p className="error">{localError}</p>}
      </div>
    )
  }

  return (
    <div className="tag-selector">
      <button
        type="button"
        className="tag-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedTag ? <span className="pill">{selectedTag.name}</span> : 'Selecione ou crie uma tag'}
      </button>

      {isOpen && (
        <div className="tag-popover">
          <div className="tag-list" role="listbox">
            {loading && <p className="muted">Carregando tags...</p>}
            {error && <p className="error">{error}</p>}
            {!loading &&
              tags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  className={`pill tag-item ${value === String(tag.id) ? 'selected' : ''}`}
                  onClick={() => handleSelect(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            {!loading && tags.length === 0 && <p className="muted">Nenhuma tag cadastrada.</p>}
          </div>
          <div className="tag-create">
            <input
              type="text"
              placeholder="Nova tag"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleCreate()
                }
              }}
            />
            <button type="button" onClick={handleCreate} disabled={saving}>
              {saving ? 'Criando...' : 'Adicionar'}
            </button>
          </div>
          {localError && <p className="error">{localError}</p>}
        </div>
      )}
    </div>
  )
}

export default TagSelector
