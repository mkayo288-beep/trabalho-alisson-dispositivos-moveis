import { type ReactNode, type InputHTMLAttributes } from "react"
export type IconName = "home" | "search" | "box" | "message" | "user" | "plane" | "arrow" | "shield" | "star" | "calendar" | "weight" | "pin" | "chevron" | "bell" | "check" | "route" | "clock"

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-7h6v7" />
    </>
  ),

  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),

  box: (
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="M4 7v10l8 4 8-4V7M12 11v10" />
    </>
  ),

  message: (
    <>
      <path d="M21 14a4 4 0 0 1-4 4H8l-5 3 1.5-5A7 7 0 0 1 3 12V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6Z" />
    </>
  ),

  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),

  plane: (
    <>
      <path d="m2 16 20-8-2-3-8 3-4-5-2 1 3 6-5 2-2-2-1 1 1 5Z" />
      <path d="m13 15-1 5 2-1 3-6" />
    </>
  ),

  arrow: (
    <>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </>
  ),

  shield: (
    <>
      <path d="M12 22s8-3.5 8-11V5l-8-3-8 3v6c0 7.5 8 11 8 11Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),

  star: (
    <path d="m12 2 3 6.3 7 .9-5 4.8 1.3 7-6.3-3.4L5.7 21 7 14 2 9.2l7-.9L12 2Z" />
  ),

  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 2v6M17 2v6M3 10h18" />
    </>
  ),

  weight: (
    <>
      <path d="M6 8h12l3 13H3L6 8Z" />
      <circle cx="12" cy="7" r="4" />
      <path d="m12 7 2-1" />
    </>
  ),

  pin: (
    <>
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),

  chevron: <path d="m9 18 6-6-6-6" />,

  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),

  check: <path d="m5 12 4 4L19 6" />,

  route: (
    <>
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M8 16 16 8" />
    </>
  ),

  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
}
export function Icon({ name, size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function Avatar({
  name,
  large = false,
}: {
  name: string
  large?: boolean
}) {
  return (
    <div className={`avatar ${large ? "avatar-large" : ""}`}>
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()}
    </div>
  )
}
export function Button({
  children,
  onClick,
  wide = false,
  variant = "primary",
  disabled = false,
  type = "button",
}: {
  children: ReactNode
  onClick?: () => void
  wide?: boolean
  variant?: "primary" | "secondary" | "danger" | "text"
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`button ${variant} ${wide ? "wide" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: IconName
  options?: string[]
  suggestions?: string[]
  multiline?: boolean
  onValue: (value: string) => void
}
export function Field({
  label,
  icon,
  options,
  suggestions,
  multiline,
  onValue,
  ...props
}: FieldProps) {
  const listId = `list-${label.replace(/\s/g, "-")}`
  return (
    <label className="field">
      <span>{label}</span>
      <div className={`input-shell ${multiline ? "textarea-shell" : ""}`}>
        {icon && <Icon name={icon} size={18} />}
        {options ? (
          <select
            value={props.value}
            required={props.required}
            onChange={(e) => onValue(e.target.value)}
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            value={props.value}
            placeholder={props.placeholder}
            maxLength={2000}
            required={props.required}
            onChange={(e) => onValue(e.target.value)}
          />
        ) : (
          <input
            {...props}
            list={suggestions ? listId : undefined}
            onChange={(e) => onValue(e.target.value)}
          />
        )}
        {suggestions && (
          <datalist id={listId}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
    </label>
  )
}
export function Empty({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="list-empty">
      <Icon name="box" />
      <strong>{title}</strong>
      {children}
    </div>
  )
}
export function ErrorText({ error }: { error: string }) {
  return error ? (
    <p className="form-error" role="alert">
      {error}
    </p>
  ) : null
}
