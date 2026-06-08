# Frontend 개발 가이드

## 기술 스택

| 항목 | 버전 |
|------|------|
| Node.js | 20.x LTS |
| React | 18.3.x |
| Vite | 5.x |
| JavaScript | ES2022+ |
| React Router | v6 (6.24.x) |
| Axios | 1.7.x |
| Zustand | 4.x |
| TanStack Query | v5 (5.x) |
| React Hook Form | 7.x |
| Tailwind CSS | 3.4.x |
| Vitest | 1.x |
| React Testing Library | 16.x |

---

## 디렉토리 구조

```
frontend/
├── public/
│
├── src/
│   ├── api/
│   │   ├── axios.js         # Axios 인스턴스 (baseURL, 인터셉터)
│   │   ├── auth.js          # 인증 API 함수
│   │   ├── expenses.js      # 지출 API 함수
│   │   ├── categories.js    # 카테고리 API 함수
│   │   ├── stats.js         # 통계 API 함수
│   │   ├── budgets.js       # 예산 API 함수
│   │   └── recurring.js     # 반복 지출 API 함수
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx       # 결제수단/카테고리 뱃지
│   │   │   ├── Spinner.jsx
│   │   │   └── EmptyState.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx   # 사이드바 + 메인 레이아웃
│   │   │   ├── Sidebar.jsx
│   │   │   └── Header.jsx
│   │   │
│   │   ├── expense/
│   │   │   ├── ExpenseForm.jsx    # 지출 입력/수정 폼
│   │   │   ├── ExpenseList.jsx    # 지출 목록
│   │   │   ├── ExpenseItem.jsx    # 개별 지출 행
│   │   │   └── ExpenseFilter.jsx  # 결제수단/카테고리/날짜 필터
│   │   │
│   │   ├── stats/
│   │   │   ├── TrendChart.jsx     # 연/월/주 소비 트렌드 (막대/선 차트)
│   │   │   ├── CategoryChart.jsx  # 카테고리별 비중 (도넛 차트)
│   │   │   ├── PaymentChart.jsx   # 결제수단별 비중 (파이 차트)
│   │   │   └── SummaryCards.jsx   # 이번달 총액, 전달 대비 등
│   │   │
│   │   └── budget/
│   │       ├── BudgetForm.jsx
│   │       └── BudgetProgress.jsx # 예산 대비 사용량 프로그레스 바
│   │
│   ├── hooks/
│   │   ├── useExpenses.js      # TanStack Query: 지출 목록/CRUD
│   │   ├── useCategories.js    # TanStack Query: 카테고리
│   │   ├── useStats.js         # TanStack Query: 통계
│   │   ├── useBudgets.js       # TanStack Query: 예산
│   │   └── useAuth.js          # 로그인/로그아웃 로직
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx   # 메인 대시보드 (요약 + 차트)
│   │   ├── ExpensePage.jsx     # 지출 목록 + 입력
│   │   ├── StatsPage.jsx       # 통계 상세
│   │   ├── BudgetPage.jsx      # 예산 관리
│   │   ├── RecurringPage.jsx   # 반복 지출 관리
│   │   └── SettingsPage.jsx    # 카테고리 관리, 프로필
│   │
│   ├── store/
│   │   ├── authStore.js        # 로그인 상태, user 정보
│   │   └── filterStore.js      # 전역 필터 상태 (기간, 결제수단)
│   │
│   ├── utils/
│   │   ├── format.js           # 금액 포맷 (toLocaleString), 날짜 포맷
│   │   ├── constants.js        # PAYMENT_METHODS, DEFAULT_CATEGORIES
│   │   └── queryKeys.js        # TanStack Query 키 상수
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 환경 변수

```env
# .env.local
VITE_API_BASE_URL=http://localhost:8000
```

---

## 핵심 구현 패턴

### api/axios.js — Axios 인스턴스

```js
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// 요청 인터셉터: Access Token 자동 첨부
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 응답 인터셉터: 401 시 Refresh Token으로 재발급
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // refresh 로직
    }
    return Promise.reject(error)
  }
)

export default api
```

### store/authStore.js — Zustand

```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (token, user) => set({ accessToken: token, user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

### hooks/useExpenses.js — TanStack Query

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../utils/queryKeys'
import * as expensesApi from '../api/expenses'

export function useExpenses(filters) {
  return useQuery({
    queryKey: [QUERY_KEYS.EXPENSES, filters],
    queryFn: () => expensesApi.getExpenses(filters),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATS] })
    },
  })
}
```

### utils/constants.js

```js
export const PAYMENT_METHODS = [
  { value: 'all',         label: '전체' },
  { value: 'cash',        label: '현금' },
  { value: 'check_card',  label: '체크카드' },
  { value: 'credit_card', label: '신용카드' },
]

export const DEFAULT_CATEGORIES = [
  { name: '장보기',   icon: '🛒', color: '#4CAF50' },
  { name: '외식',     icon: '🍽️', color: '#FF9800' },
  { name: '교통',     icon: '🚌', color: '#2196F3' },
  { name: '부의금',   icon: '🙏', color: '#9C27B0' },
  { name: '의료',     icon: '🏥', color: '#F44336' },
  { name: '문화/여가',icon: '🎬', color: '#00BCD4' },
  { name: '쇼핑',     icon: '🛍️', color: '#E91E63' },
  { name: '구독',     icon: '📱', color: '#607D8B' },
  { name: '기타',     icon: '📦', color: '#795548' },
]
```

### utils/format.js

```js
// 금액 포맷: 1500000 → "1,500,000원"
export const formatAmount = (amount) =>
  `${amount.toLocaleString('ko-KR')}원`

// 날짜 포맷: "2025-01-15" → "2025.01.15"
export const formatDate = (dateStr) =>
  dateStr.replace(/-/g, '.')

// 전월 대비 증감률
export const formatDiff = (current, prev) => {
  if (!prev) return null
  const diff = ((current - prev) / prev * 100).toFixed(1)
  return diff > 0 ? `+${diff}%` : `${diff}%`
}
```

---

## 라우팅 구조 (App.jsx)

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

function PrivateRoute({ children }) {
  const { accessToken } = useAuthStore()
  return accessToken ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index         element={<DashboardPage />} />
          <Route path="expenses"  element={<ExpensePage />} />
          <Route path="stats"     element={<StatsPage />} />
          <Route path="budget"    element={<BudgetPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

---

## TanStack Query 설정 (main.jsx)

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5분
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

---

## 차트 라이브러리

Recharts 사용 (React 친화적, Tailwind와 호환).

```bash
npm install recharts
```

| 차트 | 컴포넌트 | 용도 |
|------|----------|------|
| 트렌드 | `BarChart` + `LineChart` | 연/월/주 소비 비교 |
| 카테고리 비중 | `PieChart` (도넛형) | 카테고리별 지출 비율 |
| 결제수단 비중 | `PieChart` | 결제 수단별 비율 |
| 예산 대비 | `progress bar` | 카테고리별 예산 소진율 |

---

## Tailwind 컨벤션

- 컴포넌트 단위로 className 묶음 정리
- 반복 클래스는 `clsx` 또는 `cn()` 유틸로 관리
- 커스텀 색상은 `tailwind.config.js`에 등록

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
      },
    },
  },
}
```

---

## 폼 처리 (React Hook Form)

```jsx
import { useForm } from 'react-hook-form'

export function ExpenseForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm()

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        type="number"
        {...register('amount', { required: '금액을 입력하세요', min: 1 })}
      />
      {errors.amount && <span>{errors.amount.message}</span>}
      {/* ... */}
    </form>
  )
}
```

---

## 쿼리 키 상수 (utils/queryKeys.js)

```js
export const QUERY_KEYS = {
  EXPENSES:   'expenses',
  CATEGORIES: 'categories',
  STATS:      'stats',
  BUDGETS:    'budgets',
  RECURRING:  'recurring',
  USER:       'user',
}
```

---

## 개발 서버 실행

```bash
npm install
npm run dev        # http://localhost:5173

npm run build      # 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
npm run test       # Vitest 실행
```

---

## 코드 컨벤션

- 컴포넌트: PascalCase (`ExpenseForm.jsx`)
- 훅: camelCase, `use` 접두사 (`useExpenses.js`)
- 유틸/상수: camelCase (`format.js`, `constants.js`)
- API 함수: 동사 + 명사 (`getExpenses`, `createExpense`, `updateExpense`, `deleteExpense`)
- Props는 구조 분해 할당으로 받기
- 비동기 처리는 TanStack Query 우선, 직접 `useEffect`로 fetch 지양
