export default function Input({ label, error, hint, id, className = '', ...rest }) {
  const inputId = id || rest.name
  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span className="field-label">{label}</span> : null}
      <input id={inputId} className={`field-input ${error ? 'field-input-error' : ''} ${className}`} {...rest} />
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}
