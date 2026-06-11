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
