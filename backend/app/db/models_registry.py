"""Centralized model imports for Alembic autogenerate.

Every new SQLAlchemy model must be imported here so that ``Base.metadata``
sees it before Alembic compares against the live schema.
"""
# Models are imported here for their side effect (registering on Base.metadata).
# When a new domain adds a models module, append an import below with a noqa-F401
# suppression so linters don't flag the unused import.

from app.domains.budget import models as _budget_models  # noqa: F401
from app.domains.checklist import models as _checklist_models  # noqa: F401
from app.domains.expense import models as _expense_models  # noqa: F401
from app.domains.member import models as _member_models  # noqa: F401
from app.domains.org import models as _org_models  # noqa: F401
from app.domains.outreach import models as _outreach_models  # noqa: F401
from app.domains.schedule import models as _schedule_models  # noqa: F401
from app.domains.team import models as _team_models  # noqa: F401
from app.domains.user import models as _user_models  # noqa: F401
