from django.contrib import admin

from apps.recommendations.models import RecommendationTemplate

from .models import Risk, RiskTemplate


@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "audit",
        "category",
        "probability",
        "impact",
        "risk_score",
        "severity",
        "status",
    )
    list_filter = ("severity", "status", "category", "audit__organization")
    search_fields = ("name", "description")
    readonly_fields = ("risk_score", "severity", "identified_at", "updated_at")
    ordering = ("-risk_score",)


class RecommendationTemplateInline(admin.TabularInline):
    model = RecommendationTemplate
    extra = 1


@admin.register(RiskTemplate)
class RiskTemplateAdmin(admin.ModelAdmin):
    list_display = (
        "question",
        "trigger_choice",
        "risk_name",
        "default_probability",
        "default_impact",
    )
    list_filter = ("question__category",)
    search_fields = ("risk_name", "question__question_text")
    inlines = [RecommendationTemplateInline]
