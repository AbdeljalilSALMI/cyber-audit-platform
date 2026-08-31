from django.contrib import admin

from .models import MaturityLevel, Score


@admin.register(MaturityLevel)
class MaturityLevelAdmin(admin.ModelAdmin):
    list_display = ("name", "min_percentage", "max_percentage", "order")
    ordering = ("order",)


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ("audit", "category", "raw_points", "max_points", "percentage", "computed_at")
    list_filter = ("audit__organization", "category")
    readonly_fields = ("computed_at",)
