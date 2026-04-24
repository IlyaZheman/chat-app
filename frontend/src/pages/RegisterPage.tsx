import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usersApi } from '../api/usersApi'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await usersApi.register(userName, email, password)
      navigate('/login')
    } catch {
      setError('Ошибка регистрации. Попробуйте другой email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Создать аккаунт" subtitle="Присоединитесь к чату">
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field
          label="Имя пользователя"
          type="text"
          placeholder="username"
          value={userName}
          onChange={e => setUserName(e.target.value)}
          required
          autoFocus
        />
        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Field
          label="Пароль"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? <span className={styles.spinner} /> : 'Зарегистрироваться'}
        </button>

        <p className={styles.link}>
          Уже есть аккаунт?{' '}
          <Link to="/login">Войти</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
