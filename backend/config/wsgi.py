import logging
import os
from django.core.wsgi import get_wsgi_application

logger = logging.getLogger(__name__)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_wsgi_application()

# Auto-run migrations on startup so database tables always exist
try:
    from django.core.management import call_command
    call_command("migrate", interactive=False)
    logger.info("Auto-migration succeeded on WSGI startup.")
except Exception as e:
    logger.error(f"Auto-migration on WSGI startup failed: {e}", exc_info=True)
