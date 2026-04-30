"""Centralized model imports for Alembic autogenerate.

Every new SQLAlchemy model must be imported here so that ``Base.metadata``
sees it before Alembic compares against the live schema.
"""
# Models are imported here for their side effect (registering on Base.metadata).
# When a new domain adds a models module, append an import below with a noqa-F401
# suppression so linters don't flag the unused import.

from app.domains.org import models as _org_models  # noqa: F401
from app.domains.outreach import models as _outreach_models  # noqa: F401
from app.domains.team import models as _team_models  # noqa: F401
from app.domains.user import models as _user_models  # noqa: F401
