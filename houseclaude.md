# 가계부 프로젝트 (Household Budget App)

## 프로젝트 개요

개인 가계부 웹 애플리케이션. 사용자별 독립 데이터 관리, 결제 수단 분류, 소비 카테고리 분류, 시각화 차트를 제공한다.

## 핵심 기능

### 지출 관리
- 지출 입력: 날짜, 금액, 결제 수단, 소비 카테고리, 메모
- 결제 수단: 현금 / 체크카드 / 신용카드 / 전체
- 소비 카테고리: 장보기, 외식, 교통, 부의금, 의료, 문화/여가, 쇼핑, 구독, 기타 (사용자 커스텀 추가 가능)

### 통계 & 차트
- 기간별 소비 비교: 연간 / 월간 / 주간
- 결제 수단별 필터링
- 카테고리별 비중 차트
- 전월 대비 증감률

### 추가 기능
- 예산 설정 및 초과 알림 (카테고리별 월 예산)
- 반복 지출 등록 (고정비: 월세, 구독 등)
- 지출 목표 설정
- CSV 내보내기
- 즐겨찾기 (자주 쓰는 항목 빠른 입력)
- 월별 리포트 요약

### 사용자 관리
- JWT 기반 로그인/회원가입
- 사용자별 독립 데이터 격리
- Access Token + Refresh Token

---

## 기술 스택 요약

| 구분 | 기술 |
|------|------|
| Backend | Python 3.11 + FastAPI 0.115 |
| Frontend | React 18.3 + Vite 5 + Tailwind CSS 3.4 |
| DB | PostgreSQL 16 + Redis 7 |
| 인증 | JWT (python-jose) |
| 배포 | Docker + Docker Compose + Nginx |

---

## 프로젝트 구조

```
project-root/
├── backend/
│   ├── app/
│   │   ├── api/          # 라우터 (엔드포인트)
│   │   ├── core/         # 설정, 보안, 의존성
│   │   ├── models/       # SQLAlchemy 모델
│   │   ├── schemas/      # Pydantic 스키마
│   │   └── services/     # 비즈니스 로직
│   ├── alembic/
│   ├── tests/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/          # Axios 인스턴스 / API 함수
│   │   ├── components/   # 재사용 컴포넌트
│   │   ├── hooks/        # 커스텀 훅
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── store/        # Zustand 스토어
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml
├── claude.md
├── backend.md
├── frontend.md
└── README.md
```

---

## 도메인 모델 (핵심 엔티티)

```
User
├── id, email, password_hash, nickname
└── created_at, updated_at

Expense (지출)
├── id, user_id (FK)
├── amount (금액)
├── payment_method (현금/체크카드/신용카드)
├── category_id (FK)
├── date
├── memo
├── is_recurring (반복 여부)
└── created_at

Category (소비 카테고리)
├── id, user_id (FK, null이면 기본 카테고리)
├── name, icon, color
└── budget (월 예산, optional)

RecurringExpense (반복 지출)
├── id, user_id (FK)
├── amount, payment_method, category_id
├── cycle (monthly/weekly)
└── next_due_date

Budget (예산)
├── id, user_id (FK), category_id (FK)
├── amount, year, month
```

---

## API 엔드포인트 구조

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
DELETE /api/auth/logout

GET    /api/expenses          # 목록 (필터: 날짜범위, 결제수단, 카테고리)
POST   /api/expenses
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}

GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}

GET    /api/stats/summary     # 기간별 요약
GET    /api/stats/by-category # 카테고리별 집계
GET    /api/stats/by-payment  # 결제수단별 집계
GET    /api/stats/trend       # 연/월/주 트렌드

GET    /api/budgets
POST   /api/budgets
PUT    /api/budgets/{id}

GET    /api/recurring
POST   /api/recurring
PUT    /api/recurring/{id}
DELETE /api/recurring/{id}

GET    /api/export/csv        # CSV 내보내기
```

---

## 개발 규칙

### 공통
- 모든 날짜는 ISO 8601 형식 (YYYY-MM-DD)
- 금액 단위: 원(KRW), 정수 저장
- 에러 응답 형식 통일: `{ "detail": "메시지" }`
- 환경 변수는 `.env` 파일로 관리, `.env.example` 필수 유지

### 커밋 컨벤션
```
feat: 새 기능
fix: 버그 수정
refactor: 리팩터링
docs: 문서
chore: 설정/빌드
```

### 브랜치 전략
```
main         # 프로덕션
develop      # 통합 개발
feature/*    # 기능 개발
```

---

## 로컬 개발 시작

실행 방법

# 전체 (Docker)
docker-compose up -d

# Backend만
cd backend
pip3 install -r requirements.txt
cp .env.example .env   # .env 수정
uvicorn main:app --reload

# Frontend만
cd frontend
npm install
cp .env.local.example .env.local
npm run dev

DB 마이그레이션은 PostgreSQL 준비 후:
cd backend
alembic revision --autogenerate -m "initial"
alembic upgrade head

```bash
# 전체 실행
docker-compose up -d

# Backend만
cd backend && uvicorn main:app --reload

# Frontend만
cd frontend && npm run dev
```

| 서비스 | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
