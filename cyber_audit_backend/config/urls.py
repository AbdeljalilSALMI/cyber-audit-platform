"""
URLs racine du projet.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.audits.dashboard import DashboardView, OverviewDashboardView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Documentation API (Swagger / OpenAPI)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    # Authentification JWT
    path("api/auth/", include("apps.accounts.urls")),

    # Ressources métier
    path("api/organizations/", include("apps.organizations.urls")),
    path("api/", include("apps.questionnaires.urls")),
    path("api/audits/", include("apps.audits.urls")),
    path("api/", include("apps.scoring.urls")),
    path("api/risks/", include("apps.risks.urls")),
    path("api/recommendations/", include("apps.recommendations.urls")),
    path("api/action-plans/", include("apps.action_plans.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/notifications/", include("apps.notifications.urls")),

    # Dashboard agrégé (section 17)
    path("api/dashboard/overview/", OverviewDashboardView.as_view(), name="dashboard-overview"),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
]

# Sert les fichiers médias (rapports PDF, preuves uploadées) en développement
# uniquement — en production, un vrai serveur web (nginx, etc.) doit s'en
# charger, jamais Django lui-même.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
