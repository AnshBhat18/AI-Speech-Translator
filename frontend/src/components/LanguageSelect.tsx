interface LanguageSelectProps {
  languages: { name: string; code: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
  id?: string
}

export default function LanguageSelect({
  languages,
  value,
  onChange,
  label = 'Target language',
  id = 'target-language',
}: LanguageSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        aria-label={label}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.name}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
