"""Idempotent seed script for local development / first-run setup.

Run with:  uv run python seed.py
"""
from __future__ import annotations

import asyncio
import sys
from datetime import UTC, datetime, date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select

from app.config import get_settings
from app.db.session import async_session_maker

# Import all models so SQLAlchemy metadata is fully populated.
from app.db.models_registry import *  # noqa: F401, F403

from app.domains.budget.models import Budget
from app.domains.checklist.models import ChecklistCategory, ChecklistItem, ChecklistStatus
from app.domains.expense.models import Expense, ExpenseCategory, ExpenseStatus
from app.domains.member.models import TeamMember, TeamPart, TeamRole
from app.domains.org.models import OrgMembership, OrgRole, Organization
from app.domains.outreach.models import Outreach
from app.domains.schedule.models import ScheduleItem, ScheduleKind
from app.domains.team.models import Destination, Team, TeamStatus
from app.domains.user.models import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def dt(year: int, month: int, day: int, hour: int, minute: int = 0) -> datetime:
    """Return a UTC-aware datetime."""
    return datetime(year, month, day, hour, minute, tzinfo=UTC)


async def get_or_create_user(db, email: str, name: str) -> tuple[User, bool]:
    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        return existing, False
    user = User(email=email, name=name)
    db.add(user)
    await db.flush()
    return user, True


async def get_or_create_org(db, name: str, slug: str) -> tuple[Organization, bool]:
    existing = (
        await db.execute(select(Organization).where(Organization.slug == slug))
    ).scalar_one_or_none()
    if existing:
        return existing, False
    org = Organization(name=name, slug=slug)
    db.add(org)
    await db.flush()
    return org, True


async def get_or_create_outreach(
    db, org_id, name: str, year: int, starts_on: date, ends_on: date
) -> tuple[Outreach, bool]:
    existing = (
        await db.execute(
            select(Outreach).where(
                Outreach.organization_id == org_id,
                Outreach.name == name,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return existing, False
    outreach = Outreach(
        organization_id=org_id,
        name=name,
        year=year,
        starts_on=starts_on,
        ends_on=ends_on,
    )
    db.add(outreach)
    await db.flush()
    return outreach, True


async def get_or_create_team(
    db, outreach_id, name: str, slug: str, starts_on: date, ends_on: date, status: TeamStatus
) -> tuple[Team, bool]:
    existing = (
        await db.execute(
            select(Team).where(
                Team.outreach_id == outreach_id,
                Team.slug == slug,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return existing, False
    team = Team(
        outreach_id=outreach_id,
        name=name,
        slug=slug,
        starts_on=starts_on,
        ends_on=ends_on,
        status=status,
    )
    db.add(team)
    await db.flush()
    return team, True


async def get_or_create_destination(
    db, team_id, church_name: str, address: str, coordinator_name: str, coordinator_phone: str
) -> tuple[Destination, bool]:
    existing = (
        await db.execute(select(Destination).where(Destination.team_id == team_id))
    ).scalar_one_or_none()
    if existing:
        return existing, False
    dest = Destination(
        team_id=team_id,
        church_name=church_name,
        address=address,
        coordinator_name=coordinator_name,
        coordinator_phone=coordinator_phone,
    )
    db.add(dest)
    await db.flush()
    return dest, True


async def get_or_create_org_membership(
    db, org_id, user_id, role: OrgRole
) -> tuple[OrgMembership, bool]:
    existing = (
        await db.execute(
            select(OrgMembership).where(
                OrgMembership.organization_id == org_id,
                OrgMembership.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return existing, False
    membership = OrgMembership(organization_id=org_id, user_id=user_id, role=role)
    db.add(membership)
    await db.flush()
    return membership, True


async def get_or_create_team_member(
    db, team_id, user_id, role: TeamRole, part: TeamPart | None = None
) -> tuple[TeamMember, bool]:
    existing = (
        await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return existing, False
    member = TeamMember(team_id=team_id, user_id=user_id, role=role, part=part)
    db.add(member)
    await db.flush()
    return member, True


# ---------------------------------------------------------------------------
# Main seed
# ---------------------------------------------------------------------------

async def seed() -> None:
    settings = get_settings()
    print(f"🌱 Seeding database: {settings.database_url.split('@')[-1]}")

    async with async_session_maker() as db:
        # ── Organization ──────────────────────────────────────────────────
        org, created = await get_or_create_org(db, name="우리들교회", slug="uridul")
        if created:
            print("✅ 조직 생성: 우리들교회")
        else:
            print("⏭️  이미 있음: 우리들교회")

        # ── Outreach ──────────────────────────────────────────────────────
        outreach, created = await get_or_create_outreach(
            db,
            org_id=org.id,
            name="2026 여름 단기선교",
            year=2026,
            starts_on=date(2026, 7, 5),
            ends_on=date(2026, 7, 12),
        )
        if created:
            print("✅ 아웃리치 생성: 2026 여름 단기선교")
        else:
            print("⏭️  이미 있음: 2026 여름 단기선교")

        # ── Team ─────────────────────────────────────────────────────────
        team, created = await get_or_create_team(
            db,
            outreach_id=outreach.id,
            name="우도교회팀",
            slug="udo-2026",
            starts_on=date(2026, 7, 5),
            ends_on=date(2026, 7, 12),
            status=TeamStatus.PLANNING,
        )
        if created:
            print("✅ 팀 생성: 우도교회팀")
        else:
            print("⏭️  이미 있음: 우도교회팀")

        # ── Destination ───────────────────────────────────────────────────
        dest, created = await get_or_create_destination(
            db,
            team_id=team.id,
            church_name="우도교회",
            address="제주 제주시 우도면",
            coordinator_name="김철수",
            coordinator_phone="010-1234-5678",
        )
        if created:
            print("✅ 방문지 생성: 우도교회")
        else:
            print("⏭️  이미 있음: 우도교회")

        # ── Users ─────────────────────────────────────────────────────────
        user_defs = [
            ("jieun@test.com", "이지은"),
            ("minjun@test.com", "박민준"),
            ("sua@test.com", "최수아"),
            ("doyun@test.com", "정도윤"),
            ("yerin@test.com", "한예린"),
        ]
        users: dict[str, User] = {}
        for email, name in user_defs:
            user, created = await get_or_create_user(db, email=email, name=name)
            users[email] = user
            if created:
                print(f"✅ 유저 생성: {name} ({email})")
            else:
                print(f"⏭️  이미 있음: {name} ({email})")

        jieun = users["jieun@test.com"]
        minjun = users["minjun@test.com"]
        sua = users["sua@test.com"]
        doyun = users["doyun@test.com"]
        yerin = users["yerin@test.com"]

        # ── OrgMemberships ────────────────────────────────────────────────
        org_roles = {
            jieun.id: OrgRole.OWNER,
            minjun.id: OrgRole.MEMBER,
            sua.id: OrgRole.MEMBER,
            doyun.id: OrgRole.MEMBER,
            yerin.id: OrgRole.MEMBER,
        }
        for user_id, role in org_roles.items():
            _, created = await get_or_create_org_membership(db, org.id, user_id, role)
            if created:
                print(f"✅ 조직 멤버십 생성: {user_id} → {role}")
            else:
                print(f"⏭️  이미 있음: 조직 멤버십 {user_id}")

        # ── TeamMembers ───────────────────────────────────────────────────
        team_member_defs = [
            (jieun.id, TeamRole.LEADER, None),
            (minjun.id, TeamRole.MEMBER, TeamPart.MEDIA),
            (sua.id, TeamRole.MEMBER, TeamPart.WORSHIP),
            (doyun.id, TeamRole.MEMBER, TeamPart.FINANCE),
            (yerin.id, TeamRole.MEMBER, TeamPart.TEACHER),
        ]
        team_members: dict[str, TeamMember] = {}
        for user_id, role, part in team_member_defs:
            tm, created = await get_or_create_team_member(db, team.id, user_id, role, part)
            team_members[str(user_id)] = tm
            if created:
                print(f"✅ 팀 멤버 추가: {user_id} → {role} / {part}")
            else:
                print(f"⏭️  이미 있음: 팀 멤버 {user_id}")

        # ── Schedule Items ────────────────────────────────────────────────
        schedule_defs = [
            ("출발", dt(2026, 7, 5, 8), dt(2026, 7, 5, 10), ScheduleKind.TRAVEL, None),
            ("첫 예배", dt(2026, 7, 5, 15), dt(2026, 7, 5, 17), ScheduleKind.WORSHIP, "우도교회 본당"),
            ("VBS 1일차", dt(2026, 7, 6, 10), dt(2026, 7, 6, 12), ScheduleKind.VBS, None),
            ("팀 디브리핑", dt(2026, 7, 6, 21), dt(2026, 7, 6, 22), ScheduleKind.MEETING, None),
            ("VBS 2일차", dt(2026, 7, 7, 10), dt(2026, 7, 7, 12), ScheduleKind.VBS, None),
            ("현지인 저녁식사", dt(2026, 7, 8, 18), dt(2026, 7, 8, 20), ScheduleKind.MEAL, "제주 흑돼지 식당"),
            ("귀환", dt(2026, 7, 12, 10), None, ScheduleKind.TRAVEL, None),
        ]
        for title, starts_at, ends_at, kind, location in schedule_defs:
            existing = (
                await db.execute(
                    select(ScheduleItem).where(
                        ScheduleItem.team_id == team.id,
                        ScheduleItem.title == title,
                        ScheduleItem.starts_at == starts_at,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                print(f"⏭️  이미 있음: 일정 '{title}'")
            else:
                item = ScheduleItem(
                    team_id=team.id,
                    title=title,
                    starts_at=starts_at,
                    ends_at=ends_at,
                    kind=kind,
                    location=location,
                )
                db.add(item)
                print(f"✅ 일정 생성: {title}")
        await db.flush()

        # ── Checklist Items ───────────────────────────────────────────────
        checklist_defs = [
            # (category, title, quantity, status)
            (ChecklistCategory.DOCS, "여권/신분증 사본", "5부", ChecklistStatus.DONE),
            (ChecklistCategory.DOCS, "의료동의서", "5부", ChecklistStatus.DONE),
            (ChecklistCategory.TEAM_GEAR, "빔프로젝터", "1대", ChecklistStatus.IN_PROGRESS),
            (ChecklistCategory.TEAM_GEAR, "마이크 세트", "1세트", ChecklistStatus.IN_PROGRESS),
            (ChecklistCategory.TEAM_GEAR, "카메라", "1대", ChecklistStatus.IN_PROGRESS),
            (ChecklistCategory.PERSONAL, "상비약 키트", "1", ChecklistStatus.DONE),
            (ChecklistCategory.PERSONAL, "우산", "5개", ChecklistStatus.TODO),
            (ChecklistCategory.MINISTRY, "VBS 교재 인쇄", "30부", ChecklistStatus.TODO),
            (ChecklistCategory.MINISTRY, "찬양 악보", "10부", ChecklistStatus.TODO),
            (ChecklistCategory.MINISTRY, "선물 포장", "30개", ChecklistStatus.TODO),
            (ChecklistCategory.MISC, "비상연락망 출력", "5부", ChecklistStatus.TODO),
            (ChecklistCategory.MISC, "영수증 봉투", "1개", ChecklistStatus.TODO),
        ]
        for category, title, quantity, status in checklist_defs:
            existing = (
                await db.execute(
                    select(ChecklistItem).where(
                        ChecklistItem.team_id == team.id,
                        ChecklistItem.title == title,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                print(f"⏭️  이미 있음: 준비물 '{title}'")
            else:
                item = ChecklistItem(
                    team_id=team.id,
                    category=category,
                    title=title,
                    quantity=quantity,
                    status=status,
                )
                db.add(item)
                print(f"✅ 준비물 생성: {title}")
        await db.flush()

        # ── Budget ────────────────────────────────────────────────────────
        budget_defs = [
            (ExpenseCategory.TRANSPORT, 500000),
            (ExpenseCategory.LODGING, 800000),
            (ExpenseCategory.MEAL, 300000),
            (ExpenseCategory.MINISTRY, 400000),
        ]
        for category, planned_amount in budget_defs:
            existing = (
                await db.execute(
                    select(Budget).where(
                        Budget.team_id == team.id,
                        Budget.category == category,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                print(f"⏭️  이미 있음: 예산 {category}")
            else:
                budget = Budget(
                    team_id=team.id,
                    category=category,
                    planned_amount=planned_amount,
                    currency="KRW",
                )
                db.add(budget)
                print(f"✅ 예산 생성: {category} {planned_amount:,}원")
        await db.flush()

        # ── Expenses ──────────────────────────────────────────────────────
        expense_defs = [
            # (description, vendor, category, amount, status, purchaser)
            ("교통비 버스", None, ExpenseCategory.TRANSPORT, 45000, ExpenseStatus.APPROVED, jieun),
            ("편의점 간식", None, ExpenseCategory.MEAL, 23000, ExpenseStatus.APPROVED, minjun),
            ("VBS 재료", None, ExpenseCategory.MINISTRY, 87000, ExpenseStatus.PENDING, sua),
            ("숙소 1박", None, ExpenseCategory.LODGING, 150000, ExpenseStatus.APPROVED, jieun),
            ("저녁식사", None, ExpenseCategory.MEAL, 68000, ExpenseStatus.PENDING, doyun),
            ("선물 구매", None, ExpenseCategory.GIFT, 35000, ExpenseStatus.PENDING, yerin),
            ("택시", None, ExpenseCategory.TRANSPORT, 15000, ExpenseStatus.APPROVED, minjun),
            ("구급약", None, ExpenseCategory.MEDICAL, 12000, ExpenseStatus.PENDING, sua),
        ]
        for description, vendor, category, amount, exp_status, purchaser in expense_defs:
            existing = (
                await db.execute(
                    select(Expense).where(
                        Expense.team_id == team.id,
                        Expense.description == description,
                        Expense.purchaser_user_id == purchaser.id,
                        Expense.amount == amount,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                print(f"⏭️  이미 있음: 지출 '{description}'")
            else:
                expense = Expense(
                    team_id=team.id,
                    purchaser_user_id=purchaser.id,
                    amount=amount,
                    currency="KRW",
                    spent_at=dt(2026, 7, 5, 12),
                    vendor=vendor,
                    category=category,
                    description=description,
                    status=exp_status,
                )
                db.add(expense)
                print(f"✅ 지출 생성: {description} {amount:,}원 ({exp_status})")
        await db.flush()

        await db.commit()
        print("\n🎉 시드 완료!")


if __name__ == "__main__":
    asyncio.run(seed())
