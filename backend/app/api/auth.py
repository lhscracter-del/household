from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as aioredis
import time
from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, verify_refresh_token,
)
from app.models.user import User
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse

DEFAULT_PAYMENT_METHODS = [
    {"payment_type": "cash",        "name": "현금",    "is_default": True},
    {"payment_type": "check_card",  "name": "체크카드", "is_default": False},
    {"payment_type": "credit_card", "name": "신용카드", "is_default": False},
]

DEFAULT_CATEGORIES = [
    {"name": "식비",     "icon": "🍽️", "color": "#FF9800"},
    {"name": "장보기",   "icon": "🛒", "color": "#4CAF50"},
    {"name": "교통",     "icon": "🚌", "color": "#2196F3"},
    {"name": "의료",     "icon": "🏥", "color": "#F44336"},
    {"name": "쇼핑",     "icon": "🛍️", "color": "#E91E63"},
    {"name": "문화/여가","icon": "🎬", "color": "#00BCD4"},
    {"name": "구독",     "icon": "📱", "color": "#607D8B"},
    {"name": "주거/관리","icon": "🏠", "color": "#795548"},
    {"name": "교육",     "icon": "🎓", "color": "#3F51B5"},
    {"name": "기타",     "icon": "📦", "color": "#9E9E9E"},
]

router = APIRouter()

# 모듈 레벨 단일 Redis 클라이언트 — 내부 커넥션 풀을 재사용하여
# 요청마다 새 커넥션을 생성하는 오버헤드를 제거한다.
redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def get_redis():
    return redis_client


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.exc import IntegrityError
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
    )
    db.add(user)
    await db.flush()  # user.id 확보

    from datetime import datetime
    now = datetime.utcnow()
    for pm in DEFAULT_PAYMENT_METHODS:
        db.add(PaymentMethod(user_id=user.id, created_at=now, updated_at=now, **pm))
    for cat in DEFAULT_CATEGORIES:
        db.add(Category(user_id=user.id, created_at=now, updated_at=now, **cat))

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")

    await db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    from app.schemas.auth import UserResponse
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    from app.schemas.auth import UserResponse
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, redis=Depends(get_redis), db: AsyncSession = Depends(get_db)):
    payload = verify_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 refresh token입니다.")

    user_id = payload.get("sub")
    is_blacklisted = await redis.get(f"blacklist:{body.refresh_token}")
    if is_blacklisted:
        raise HTTPException(status_code=401, detail="만료된 refresh token입니다.")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=401, detail="존재하지 않는 사용자입니다.")

    exp = payload.get("exp", 0)
    ttl = max(int(exp - time.time()), 1)
    await redis.setex(f"blacklist:{body.refresh_token}", ttl, "1")

    access_token = create_access_token({"sub": user_id})
    new_refresh_token = create_refresh_token({"sub": user_id})
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.delete("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: RefreshRequest, redis=Depends(get_redis)):
    payload = verify_refresh_token(body.refresh_token)
    if payload:
        import time
        exp = payload.get("exp", 0)
        ttl = max(int(exp - time.time()), 1)
        await redis.setex(f"blacklist:{body.refresh_token}", ttl, "1")
