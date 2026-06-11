"""household_sharing

Revision ID: 1e3ee6917e1d
Revises: e639e1625733
Create Date: 2026-06-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e3ee6917e1d'
down_revision: Union[str, None] = 'e639e1625733'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'households',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_households_id'), 'households', ['id'], unique=False)

    connection = op.get_bind()

    op.create_table(
        'household_invitations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('household_id', sa.Integer(), nullable=False),
        sa.Column('inviter_id', sa.Integer(), nullable=False),
        sa.Column('invitee_email', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['household_id'], ['households.id']),
        sa.ForeignKeyConstraint(['inviter_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_household_invitations_id'), 'household_invitations', ['id'], unique=False)
    op.create_index(op.f('ix_household_invitations_household_id'), 'household_invitations', ['household_id'], unique=False)
    op.create_index(op.f('ix_household_invitations_invitee_email'), 'household_invitations', ['invitee_email'], unique=False)

    op.add_column('users', sa.Column('household_id', sa.Integer(), nullable=True))

    # 기존 사용자별로 단독 가구를 생성하고 연결한다.
    user_ids = [row[0] for row in connection.execute(sa.text('SELECT id FROM users')).fetchall()]
    for user_id in user_ids:
        result = connection.execute(sa.text('INSERT INTO households DEFAULT VALUES RETURNING id'))
        household_id = result.scalar()
        connection.execute(
            sa.text('UPDATE users SET household_id = :household_id WHERE id = :user_id'),
            {'household_id': household_id, 'user_id': user_id},
        )

    op.alter_column('users', 'household_id', nullable=False)
    op.create_index(op.f('ix_users_household_id'), 'users', ['household_id'], unique=False)
    op.create_foreign_key(None, 'users', 'households', ['household_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_household_id'), table_name='users')
    op.drop_column('users', 'household_id')

    op.drop_index(op.f('ix_household_invitations_invitee_email'), table_name='household_invitations')
    op.drop_index(op.f('ix_household_invitations_household_id'), table_name='household_invitations')
    op.drop_index(op.f('ix_household_invitations_id'), table_name='household_invitations')
    op.drop_table('household_invitations')

    op.drop_index(op.f('ix_households_id'), table_name='households')
    op.drop_table('households')
