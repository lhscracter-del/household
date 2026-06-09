---
name: project-household-ux
description: 가계부 앱(household) 프로젝트의 UX 패턴, 컴포넌트 구조, 합의된 디자인 결정사항
metadata:
  type: project
---

## 프로젝트 개요
가계부 웹 앱. React 18 + Tailwind CSS 3.4 + TanStack Query v5. 모바일 퍼스트 반응형.

## 디자인 시스템 규칙 (확인된)
- 카드 배경: `bg-white dark:bg-gray-800`, 테두리: `border-gray-200 dark:border-gray-600`
- 중첩 구분선: `dark:border-gray-600` (dark:border-gray-700은 너무 어두워 기피)
- 보조 텍스트: `text-gray-500 dark:text-gray-300` (dark:text-gray-500는 너무 어두워 피함)
- 날짜/메타 텍스트: `text-gray-400 dark:text-gray-300`
- 모달: Modal 컴포넌트 (`/components/common/Modal.jsx`) — ESC 키 닫기 지원, overflow lock 포함

## 합의된 컴포넌트 결정
- **ConfirmModal** (`/components/common/ConfirmModal.jsx`): 브라우저 confirm() 대체용. Props: isOpen, onConfirm, onCancel, message, confirmLabel(default: '삭제'), confirmVariant(default: 'danger'). Modal + Button 컴포넌트 조합.
- 로그아웃 confirm은 confirmVariant="secondary"로 처리 (파괴적 행위 아님)
- 삭제 confirm은 confirmVariant="danger" (빨간 버튼)

## 다크모드 수정 이력 (2026-06-09)
- SummaryCards: 다크모드 클래스 전무 → 전면 추가
- DashboardPage: blue-700/purple-700 → dark:blue-300/purple-300, 보조 텍스트 dark:text-gray-300
- Badge: PaymentBadge fallback에 dark:bg-gray-700 dark:text-gray-300 추가
- EmptyState: 메시지 텍스트 dark:text-gray-300 명시
- Sidebar: 로고 하단 구분선 dark:border-gray-600으로 통일

**Why:** 코드 리뷰에서 다크모드 대비 불량 이슈 제기됨.
**How to apply:** 새 컴포넌트 작성 시 위 색상 규칙 기본 적용.
