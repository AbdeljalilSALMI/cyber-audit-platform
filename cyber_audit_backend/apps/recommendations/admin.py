from django.contrib import admin

from .models import Recommendation, RecommendationTemplate


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "risk",
        "priority",
        "estimated_effort",
        "is_validated",
        "updated_at",
    )
    list_filter = ("priority", "estimated_effort", "is_validated", "risk__audit__organization")
    search_fields = ("title", "description")


@admin.register(RecommendationTemplate)
class RecommendationTemplateAdmin(admin.ModelAdmin):
    list_display = ("risk_template", "title", "priority", "estimated_effort")
    list_filter = ("priority", "estimated_effort")
    search_fields = ("title", "risk_template__risk_name")
