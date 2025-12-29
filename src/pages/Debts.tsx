import { useMemo, useState } from 'react'
import { useDebts } from '../hooks/useDebts'
import { useTags } from '../hooks/useTags'
import { createDebt } from '../services/debts'
import TagSelector from '../components/TagSelector'
import type { DebtFilters } from '../services/debts'

const moneyFormat = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function DebtsPage() {
  const { items, loading, error, filters, reload, page, pageCount } = useDebts({ limit: 10 })
  const tags = useTags()
  const [showFilters, setShowFilters] = useState(false)
  const [descriptionFilter, setDescriptionFilter] = useState(filters.description ?? '')
  const [tagFilter, setTagFilter] = useState(filters.tagId ? String(filters.tagId) : '')
  const [monthFilter, setMonthFilter] = useState(filters.dueMonth ?? '')
  const [createStatus, setCreateStatus] = useState<{
    state: 'idle' | 'loading' | 'error' | 'success'
    message: string
  }>({ state: 'idle', message: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    dueDate: '',
    tagId: '',
    type: 'PAYABLE',
  })

  const handlePage = (delta: number) => {
    const nextPage = Math.min(Math.max(page + delta, 1), pageCount)
    void reload({ page: nextPage })
  }

  const emptyState = useMemo(
    () => !loading && items.length === 0,
    [items.length, loading],
  )

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreateStatus({ state: 'idle', message: '' })

    const amountNumber = Math.round(Number(form.amount) * 100)

    if (!form.description || !form.dueDate || !form.tagId || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setCreateStatus({ state: 'error', message: 'Preencha descrição, valor, vencimento e tag.' })
      return
    }

    setCreateStatus({ state: 'loading', message: 'Criando débito...' })

    try {
      const payload = {
        description: form.description,
        amountCents: amountNumber,
        dueDate: `${form.dueDate}T00:00:00.000Z`,
        tagId: Number(form.tagId),
        type: form.type as 'PAYABLE' | 'RECEIVABLE',
      }

      await createDebt(payload)
      setCreateStatus({ state: 'success', message: 'Débito criado com sucesso.' })
      setForm({
        description: '',
        amount: '',
        dueDate: '',
        tagId: '',
        type: form.type,
      })
      setShowCreate(false)
      void reload({ page: 1 })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar débito.'
      setCreateStatus({ state: 'error', message })
    }
  }

  const handleCreateTag = async (name: string) => {
    const newTag = await tags.addTag(name)
    setForm((prev) => ({ ...prev, tagId: String(newTag.id) }))
    return newTag
  }

  const handleSort = (field: NonNullable<DebtFilters['orderBy']>) => {
    const isSameField = filters.orderBy === field
    const currentOrder = isSameField ? filters.order : undefined

    const nextOrder =
      !currentOrder ? 'asc' : currentOrder === 'asc' ? 'desc' : undefined

    const nextFilters: Partial<DebtFilters> = {
      order: nextOrder,
      orderBy: nextOrder ? field : undefined,
      page: 1,
    }

    void reload(nextFilters)
  }

  const getSortIcon = (field: NonNullable<DebtFilters['orderBy']>) => {
    if (filters.orderBy !== field || !filters.order) return '↕'
    return filters.order === 'asc' ? '↑' : '↓'
  }

  const isSortedBy = (field: NonNullable<DebtFilters['orderBy']>) =>
    filters.orderBy === field && Boolean(filters.order)

  const handleDescriptionFilter = (value: string) => {
    setDescriptionFilter(value)
    void reload({ description: value || undefined, page: 1 })
  }

  const handleTagFilter = (value: string) => {
    setTagFilter(value)
    const tagId = value ? Number(value) : undefined
    void reload({ tagId, page: 1 })
  }

  const handleMonthFilter = (value: string) => {
    setMonthFilter(value)
    void reload({ dueMonth: value || undefined, page: 1 })
  }

  return (
    <main className="page debts-page">
      <header className="debts-header compact">
        <div className="toolbar">
          <div className="toolbar-left">
            <p className="eyebrow">Débitos</p>
            <h1>Listagem de débitos</h1>
          </div>
          <div className="toolbar-actions">
            <button type="button" className="ghost" onClick={() => setShowFilters((prev) => !prev)}>
              Filtros
            </button>
            <button type="button" className="primary" onClick={() => setShowCreate(true)}>
              Novo débito
            </button>
          </div>
      </div>

      </header>

      {showFilters && (
        <section className="filters">
          <label>
            <span>Descrição</span>
            <input
              type="text"
              placeholder="Buscar por descrição"
              value={descriptionFilter}
              onChange={(e) => handleDescriptionFilter(e.target.value)}
            />
          </label>
          <label>
            <span>Tag</span>
            <select value={tagFilter} onChange={(e) => handleTagFilter(e.target.value)}>
              <option value="">Todas</option>
              {tags.items.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Mês de vencimento</span>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => handleMonthFilter(e.target.value)}
            />
          </label>
        </section>
      )}

      {showCreate && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowCreate(false)}
        >
          <section
            className="debts-card create-debt modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header header-inline">
              <p className="eyebrow">Novo lançamento</p>
              <div className="type-toggle full inline">
                <div className="pill-toggle" data-variant={form.type === 'PAYABLE' ? 'pay' : 'receive'}>
                  <button
                    type="button"
                    className={form.type === 'PAYABLE' ? 'selected' : ''}
                    onClick={() => setForm((prev) => ({ ...prev, type: 'PAYABLE' }))}
                  >
                    Pagar
                  </button>
                  <button
                    type="button"
                    className={form.type === 'RECEIVABLE' ? 'selected' : ''}
                    onClick={() => setForm((prev) => ({ ...prev, type: 'RECEIVABLE' }))}
                  >
                    Receber
                  </button>
                </div>
              </div>
            </div>
            <form className="create-form" onSubmit={handleCreate}>
              <div className="form-row stretch">
                <label>
                  <span>Descrição</span>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Ex: Conta de energia"
                    required
                  />
                </label>
              </div>
              <div className="form-row two-col">
                <label>
                  <span>Valor</span>
                  <div className="currency-input">
                    <span className="prefix">R$</span>
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={handleFormChange}
                      placeholder="0,00"
                      required
                    />
                  </div>
                </label>
                <label>
                  <span>Vencimento</span>
                  <input
                    name="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={handleFormChange}
                    required
                  />
                </label>
              </div>
              <div className="form-row single-line">
                <label>
                  <span>Tag</span>
                  <TagSelector
                    tags={tags.items}
                    value={form.tagId}
                    onChange={(tagId) => setForm((prev) => ({ ...prev, tagId }))}
                    onCreate={handleCreateTag}
                    loading={tags.loading}
                    error={tags.error}
                  />
                </label>
              </div>
              <div className="create-actions right">
                {createStatus.state === 'error' && <p className="error">{createStatus.message}</p>}
                {createStatus.state === 'success' && <p className="success">{createStatus.message}</p>}
                <div className="actions-row">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setShowCreate(false)
                      setCreateStatus({ state: 'idle', message: '' })
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={createStatus.state === 'loading'}>
                    {createStatus.state === 'loading' ? 'Salvando...' : 'Criar débito'}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="debts-card">
        {loading && <p className="muted">Carregando débitos...</p>}
        {error && <p className="error">{error}</p>}
        {emptyState && <p className="muted">Nenhum débito encontrado com esses filtros.</p>}

        {!loading && items.length > 0 && (
          <table className="debts-table">
            <thead>
              <tr>
                <th className="align-right">
                  <button
                    type="button"
                    className={`sort-button ${isSortedBy('amountCents') ? 'active' : ''}`}
                    onClick={() => handleSort('amountCents')}
                  >
                    Valor <span className="sort-icon">{getSortIcon('amountCents')}</span>
                  </button>
                </th>
                <th>Tag</th>
                <th>Descrição</th>
                <th className="align-right">
                  <button
                    type="button"
                    className={`sort-button ${isSortedBy('dueDate') ? 'active' : ''}`}
                    onClick={() => handleSort('dueDate')}
                  >
                    Vencimento <span className="sort-icon">{getSortIcon('dueDate')}</span>
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className={`sort-button ${isSortedBy('paid') ? 'active' : ''}`}
                    onClick={() => handleSort('paid')}
                  >
                    Status <span className="sort-icon">{getSortIcon('paid')}</span>
                  </button>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((debt) => (
                <tr key={debt.id}>
                  <td className="align-right">{moneyFormat(debt.amountCents)}</td>
                  <td>{debt.tag?.name ?? debt.tagId ?? '-'}</td>
                  <td>
                    <div className="desc-cell">
                      <span className="desc-text">{debt.description}</span>
                      <span className={`pill subtle ${debt.type === 'PAYABLE' ? 'pay' : 'receive'}`}>
                        {debt.type === 'PAYABLE' ? 'Pagar' : 'Receber'}
                      </span>
                    </div>
                  </td>
                  <td className="align-right">{new Date(debt.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span className={`status-dot ${debt.paid ? 'success' : 'pending'}`}>
                      {debt.paid ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button type="button" className="icon-button" aria-label="Mais ações">
                      ⋯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="pagination">
          <button type="button" onClick={() => handlePage(-1)} disabled={page <= 1}>
            Anterior
          </button>
          <span>
            Página {page} de {pageCount}
          </span>
          <button type="button" onClick={() => handlePage(1)} disabled={page >= pageCount}>
            Próxima
          </button>
        </div>
      </section>
    </main>
  )
}

export default DebtsPage
