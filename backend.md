# Backend 개발 가이드

## 기술 스택

| 항목 | 버전 |
|------|------|
| Python | 3.11.x |
| FastAPI | 0.115.x |
| Uvicorn | 0.30.x |
| Pydantic | v2 (2.7.x) |
| SQLAlchemy | 2.0.x (비동기) |
| Alembic | 1.13.x |
| PostgreSQL | 16.x |
| asyncpg | 0.29.x |
| Redis | 7.x |
| passlib[bcrypt] | 1.7.x |
| python-jose[cryptography] | 3.3.x |
| python-dotenv | 1.0.x |
| httpx | 0.27.x |

---

## 디렉토리 구조

```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py          # 로그인, 회원가입, 토큰 갱신
│   │   ├── expenses.py      # 지출 CRUD
│   │   ├── categories.py    # 카테고리 CRUD
│   │   ├── stats.py         # 통계/차트 데이터
│   │   ├── budgets.py       # 예산 관리
│   │   ├── recurring.py     # 반복 지출
│   │   └── export.py        # CSV 내보내기
│   │
│   ├── core/
│   │   ├── config.py        # 환경 변수 Settings (Pydantic BaseSettings)
│   │   ├── database.py      # AsyncEngine, AsyncSession, get_db
│   │   ├── security.py      # JWT 생성/검증, 비밀번호 해싱
│   │   └── deps.py          # 의존성 주입 (get_current_user 등)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── expense.py
│   │   ├── category.py
│   │   ├── budget.py
│   │   └── recurring.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── expense.py
│   │   ├── category.py
│   │   ├── budget.py
│   │   ├── recurring.py
│   │   └── stats.py
│   │
│   └── services/
│       ├── expense_service.py
│       ├── stats_service.py
│       ├── budget_service.py
│       └── recurring_service.py
│
├── alembic/
│   ├── env.py
│   └── versions/
│
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_expenses.py
│   └── test_stats.py
│
├── main.py
├── requirements.txt
└── .env.example
```

---

## 환경 변수 (.env.example)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/budget_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# App
APP_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 핵심 구현 패턴

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, expenses, categories, stats, budgets, recurring, export

app = FastAPI(title="가계부 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["budgets"])
app.include_router(recurring.router, prefix="/api/recurring", tags=["recurring"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
```

### core/config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
```

### core/database.py

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

### core/deps.py

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    # DB에서 유저 조회 후 반환
    ...
```

---

## 모델 정의 규칙

- 모든 모델은 `app/models/`에 정의, `Base` 상속
- PK: `id` (UUID 또는 Integer, 프로젝트 내 통일)
- 타임스탬프: `created_at`, `updated_at` 모든 테이블 포함
- `user_id` FK로 사용자 데이터 격리 필수
- Soft delete 필요 시 `deleted_at` 컬럼 사용

### Expense 모델 예시

```python
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class PaymentMethod(str, enum.Enum):
    cash = "cash"           # 현금
    check_card = "check_card"   # 체크카드
    credit_card = "credit_card" # 신용카드

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)           # 금액 (원, 정수)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    date = Column(Date, nullable=False)
    memo = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## 통계 API 쿼리 패턴

### stats.py 엔드포인트

```
GET /api/stats/summary?period=monthly&year=2025&month=1&payment_method=all
GET /api/stats/by-category?year=2025&month=1
GET /api/stats/by-payment?year=2025&month=1
GET /api/stats/trend?type=monthly&year=2025     # 월별 트렌드 (12개월)
GET /api/stats/trend?type=weekly&year=2025&month=1  # 주별 트렌드
GET /api/stats/trend?type=yearly&start=2023&end=2025  # 연도별 비교
```

- SQLAlchemy `func.sum`, `func.date_trunc` 활용
- 집계 결과는 항상 `user_id` 조건 포함 (데이터 격리)

---

## 인증 플로우

```
1. POST /api/auth/register → User 생성, access_token + refresh_token 반환
2. POST /api/auth/login    → access_token (30분) + refresh_token (7일) 반환
3. POST /api/auth/refresh  → refresh_token으로 새 access_token 발급
4. DELETE /api/auth/logout → Redis에서 refresh_token 무효화
```

- Refresh Token은 Redis에 저장 (key: `refresh:{user_id}`)
- Access Token은 stateless (Redis 불필요)

---

## 에러 응답 형식

```python
# 모든 에러는 아래 형식 통일
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="지출 내역을 찾을 수 없습니다."
)
```

```json
{ "detail": "지출 내역을 찾을 수 없습니다." }
```

---

## 마이그레이션

```bash
# 마이그레이션 파일 생성
alembic revision --autogenerate -m "create expenses table"

# 적용
alembic upgrade head

# 롤백
alembic downgrade -1
```

---

## 테스트

```bash
# 전체 테스트
pytest

# 커버리지
pytest --cov=app tests/

# 특정 파일
pytest tests/test_expenses.py -v
```

- 테스트 DB는 별도 SQLite 또는 테스트 전용 PostgreSQL 사용
- `conftest.py`에서 테스트용 `AsyncSession` fixture 정의
- 각 테스트는 독립 트랜잭션, 테스트 후 롤백

---

## 실행

```bash
# 의존성 설치
pip install -r requirements.txt

# 개발 서버
uvicorn main:app --reload --port 8000

# Swagger UI
http://localhost:8000/docs
```

---

## 로컬 실행 가이드 (최초 세팅)

### 1. PostgreSQL / Redis 실행 (Docker)

```bash
# PostgreSQL (5433 포트, 기존 5432 충돌 방지)
docker run -d \
  --name household_postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=budget_db \
  -p 5433:5432 \
  postgres:16-alpine

# Redis (이미 실행 중이면 생략)
docker run -d --name household_redis -p 6379:6379 redis:7-alpine
```

### 2. 가상환경 생성 및 패키지 설치

```bash
cd backend

python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일에서 SECRET_KEY를 임의 문자열로 변경
```

`.env` 주요 값:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5433/budget_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_ORIGINS=["http://localhost:5173"]
```

> `ALLOWED_ORIGINS`는 반드시 JSON 배열 형식(`["..."]`)으로 작성해야 합니다.

### 4. DB 마이그레이션

```bash
# 최초 1회: 마이그레이션 파일 생성
venv/bin/alembic revision --autogenerate -m "initial"

# 테이블 생성
venv/bin/alembic upgrade head
```

### 5. 개발 서버 실행

```bash
venv/bin/uvicorn main:app --reload --port 8000
```

### 확인

| 항목 | URL |
|------|-----|
| Swagger UI | http://localhost:8000/docs |
| API 루트 | http://localhost:8000 |

### 재실행 (이후)

```bash
# PostgreSQL / Redis 컨테이너가 꺼진 경우
docker start household_postgres household_redis

# 서버 재시작
cd backend
venv/bin/uvicorn main:app --reload --port 8000
```
