import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usersApi } from '../api/usersApi'
import { useAuthStore } from '../store/authStore'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await usersApi.login(email, password)
      const auth = await usersApi.me()
      setAuth(auth)
      navigate('/')
    } catch {
      setError('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Добро пожаловать" subtitle="Войдите в свой аккаунт">
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Field
          label="Пароль"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? <span className={styles.spinner} /> : 'Войти'}
        </button>

        <p className={styles.link}>
          Нет аккаунта?{' '}
          <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
