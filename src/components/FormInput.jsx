export default function FormInput({ label, name, type = "text", value, onChange, error }) {
  return (
    <div className="input-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={error ? "input-invalid" : ""}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}