import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useLogin } from '../hooks/useAuth'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

function getLoginErrorMessage(error) {
  const status = error?.response?.status
  const detail = error?.response?.data?.detail
  if (status === 401 || status === 400) {
    return '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.'
  }
  if (detail) return detail
  return '로그인 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.'
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { mutate: login, isPending, error } = useLogin()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">💼 가계부</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">로그인하여 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit((data) => login(data))} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{getLoginErrorMessage(error)}</p>
            </div>
          )}

          <Input
            label="이메일"
            type="email"
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email', { required: '이메일 주소를 입력해주세요.' })}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            error={errors.password?.message}
            {...register('password', { required: '비밀번호를 입력해주세요.' })}
          />

          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-blue-500 hover:underline font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
