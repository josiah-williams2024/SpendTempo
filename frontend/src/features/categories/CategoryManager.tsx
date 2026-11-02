import type { FormEventHandler } from 'react'

import type { Category, TransactionType } from '../../api'
import { Icon } from '../../components/Icon'

type CategoryManagerProps = {
  categories: Category[]
  editingCategory: Category | null
  isCreating: boolean
  categoryType: TransactionType
  error: string
  isSaving: boolean
  isConfirmingDelete: boolean
  onClose: () => void
  onBack: () => void
  onCreate: () => void
  onEdit: (category: Category) => void
  onTypeChange: (type: TransactionType) => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onDelete: () => void
}

export function CategoryManager({ categories, editingCategory, isCreating, categoryType, error, isSaving, isConfirmingDelete, onClose, onBack, onCreate, onEdit, onTypeChange, onSubmit, onDelete }: CategoryManagerProps) {
  return <div className="sheet-backdrop" onMouseDown={onClose}><section className="entry-sheet category-sheet" role="dialog" aria-modal="true" aria-labelledby="categories-title" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Budget setup</p><h2 id="categories-title">Categories</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div>{isCreating || editingCategory ? <form onSubmit={onSubmit}><div className="category-editor-heading"><button type="button" className="text-button" onClick={onBack}>← All categories</button><strong>{editingCategory ? 'Edit category' : 'New category'}</strong></div>{!editingCategory ? <div className="type-toggle"><button type="button" className={categoryType === 'expense' ? 'active' : ''} onClick={() => onTypeChange('expense')}>Expense</button><button type="button" className={categoryType === 'income' ? 'active' : ''} onClick={() => onTypeChange('income')}>Income</button></div> : <p className="category-type-label">{editingCategory.type} category</p>}<label className="field"><span>Name</span><input name="name" maxLength={100} defaultValue={editingCategory?.name ?? ''} placeholder="e.g. Entertainment" autoFocus required/></label><label className="field colour-field"><span>Colour</span><div><input name="colour" type="color" defaultValue={editingCategory?.colour ?? '#7559E8'} aria-label="Category colour"/><span>Choose the category colour</span></div></label>{error ? <p className="form-error" role="alert">{error}</p> : null}<button className="save-button" disabled={isSaving}>{isSaving ? 'Saving…' : editingCategory ? 'Save category' : 'Create category'}</button>{editingCategory ? <button type="button" className={`danger-button ${isConfirmingDelete ? 'confirming' : ''}`} disabled={isSaving} onClick={onDelete}>{isConfirmingDelete ? 'Tap again to delete' : 'Delete category'}</button> : null}</form> : <><button className="new-category-button" onClick={onCreate}><Icon name="plus" size={18}/> New category</button><div className="category-groups">{(['expense', 'income'] as TransactionType[]).map((type) => <div key={type}><p className="eyebrow">{type}</p><div className="category-list">{categories.filter((category) => category.type === type).map((category) => <button type="button" key={category.id} onClick={() => onEdit(category)}><i style={{ background: category.colour }}/><span>{category.name}</span><Icon name="chevron" size={16}/></button>)}</div></div>)}</div></>}</section></div>
}
