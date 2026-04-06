import styles from './Field.module.css'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Field({ label, ...props }: Props) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} {...props} />
    </label>
  )
}
