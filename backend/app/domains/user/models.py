from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user"
    __table_args__ = (
        UniqueConstraint("oauth_provider", "oauth_subject", name="uq_user_oauth_identity"),
    )

    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    profile_image_url: Mapped[str | None] = mapped_column(String(1024))

    oauth_provider: Mapped[str | None] = mapped_column(String(32))
    oauth_subject: Mapped[str | None] = mapped_column(String(255))

    phone: Mapped[str | None] = mapped_column(String(32))

    # 정산 송금용. bank_account_number는 BANK_INFO_ENCRYPTION_KEY로 암호화 저장.
    bank_name: Mapped[str | None] = mapped_column(String(64))
    bank_account_number: Mapped[str | None] = mapped_column(String(255))
    bank_account_holder: Mapped[str | None] = mapped_column(String(120))
