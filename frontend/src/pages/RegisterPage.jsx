import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useRegister } from '../hooks/useAuth'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

function getRegisterErrorMessage(error) {
  const status = error?.response?.status
  const detail = error?.response?.data?.detail
  if (status === 409 || (detail && detail.toLowerCase().includes('already'))) {
    return '이미 사용 중인 이메일입니다. 다른 이메일로 시도해보세요.'
  }
  if (detail) return detail
  return '회원가입 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.'
}

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { mutate: registerUser, isPending, error } = useRegister()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 w-full max-w-sm mx-4 sm:mx-0">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-blue-600">💼 가계부</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">회원가입</p>
        </div>

        <form onSubmit={handleSubmit((data) => registerUser(data))} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{getRegisterErrorMessage(error)}</p>
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
            label="이름"
            type="text"
            placeholder="사용하실 이름을 입력하세요"
            error={errors.name?.message}
            {...register('name', { required: '이름을 입력해주세요.' })}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="8자 이상 입력하세요"
            error={errors.password?.message}
            {...register('password', {
              required: '비밀번호를 입력해주세요.',
              minLength: { value: 8, message: '비밀번호는 8자 이상이어야 해요.' },
            })}
          />

          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? '가입 중...' : '회원가입'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-500 hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
