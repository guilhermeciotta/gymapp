import type { ButtonHTMLAttributes } from 'react'
import { CheckIcon, PencilIcon, TrashIcon, XIcon } from './icons'

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  label: string
  icon: React.ReactNode
  variant?: 'default' | 'danger' | 'neutral'
}

// Botão padrão do projeto para ações compactas (editar/excluir/salvar/cancelar) em itens de lista.
// `label` vira tooltip + aria-label, já que o ícone sozinho não é autoexplicativo.
export function IconButton({ label, icon, variant = 'default', className = '', ...props }: IconButtonProps) {
  const colorClass =
    variant === 'danger'
      ? 'text-gray-400 hover:text-red-400'
      : variant === 'neutral'
        ? 'text-gray-400 hover:text-gray-200'
        : 'text-gray-400 hover:text-green-400'

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${colorClass} ${className}`}
      {...props}
    >
      {icon}
    </button>
  )
}

type ActionButtonProps = Omit<IconButtonProps, 'label' | 'icon' | 'variant'> & { label?: string }

export function EditButton({ label = 'Editar', ...props }: ActionButtonProps) {
  return <IconButton label={label} icon={<PencilIcon className="w-4 h-4" />} {...props} />
}

export function DeleteButton({ label = 'Excluir', ...props }: ActionButtonProps) {
  return <IconButton label={label} icon={<TrashIcon className="w-4 h-4" />} variant="danger" {...props} />
}

export function SaveButton({ label = 'Salvar', ...props }: ActionButtonProps) {
  return <IconButton label={label} icon={<CheckIcon className="w-4 h-4" />} {...props} />
}

export function CancelButton({ label = 'Cancelar', ...props }: ActionButtonProps) {
  return <IconButton label={label} icon={<XIcon className="w-4 h-4" />} variant="neutral" {...props} />
}
