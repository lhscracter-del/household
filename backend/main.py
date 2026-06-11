from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, expenses, categories, stats, budgets, recurring, export, payment_methods, household

app = FastAPI(title="가계부 API", version="1.0.0")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://household-rhdc.onrender.com",
    *settings.ALLOWED_ORIGINS,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(ALLOWED_ORIGINS)),
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
app.include_router(payment_methods.router, prefix="/api/payment-methods", tags=["payment-methods"])
app.include_router(household.router, prefix="/api/household", tags=["household"])
