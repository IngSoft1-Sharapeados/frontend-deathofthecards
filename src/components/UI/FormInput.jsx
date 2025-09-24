// Reusable input component with a label and error handling.
// Its purpose is to centralize the rendering logic of a form field:
// - Avoids repeating <label>, <input>, and <error> in each form.
// - Accepts generic props (label, name, type, value, onChange, error).
// - Automatically applies error styles if a message exists.
// This allows for visual consistency and simplifies the creation of long forms.
export default function FormInput({ label, name, type = "text", value, onChange, error }) {
  return (
    <div className="form-group">
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`form-input${error ? " input-error" : ""}`}
        placeholder=" "
        autoComplete="off"
      />
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}