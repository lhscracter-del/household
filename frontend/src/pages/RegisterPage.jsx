import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useRegister } from '../hooks/useAuth'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { mutate: registerUser, isPending, error } = useRegister()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">💼 가계부</h1>
          <p className="text-sm text-gray-500 mt-2">회원가입</p>
        </div>

        <form onSubmit={handleSubmit((data) => registerUser(data))} className="flex flex-col gap-4">
          <Input
            label="이메일"
            type="email"
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email', { required: '이메일을 입력하세요' })}
          />
          <Input
            label="닉네임"
            type="text"
            placeholder="닉네임"
            error={errors.nickname?.message}
            {...register('nickname', { required: '닉네임을 입력하세요' })}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="8자 이상"
            error={errors.password?.message}
            {...register('password', { required: '비밀번호를 입력하세요', minLength: { value: 8, message: '8자 이상 입력하세요' } })}
          />

          {error && (
            <p className="text-sm text-red-500 text-center">
              {error.response?.data?.detail || '회원가입에 실패했습니다.'}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? '가입 중...' : '회원가입'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-500 hover:underline font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
