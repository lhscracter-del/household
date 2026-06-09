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


async def get_redis():
    client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield client
    finally:
        await client.aclose()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
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

    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, redis=Depends(get_redis)):
    payload = verify_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않은 refresh token입니다.")

    user_id = payload.get("sub")
    # Redis에서 무효화된 토큰 확인
    is_blacklisted = await redis.get(f"blacklist:{body.refresh_token}")
    if is_blacklisted:
        raise HTTPException(status_code=401, detail="만료된 refresh token입니다.")

    # 기존 refresh token 블랙리스트 등록 (로테이션)
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
