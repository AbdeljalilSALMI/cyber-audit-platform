from django.contrib import admin

from apps.action_plans.services import generate_action_plan_for_audit
from apps.notifications.services import notify_audit_completed
from apps.recommendations.services import generate_recommendations_for_audit
from apps.reports.services import generate_report_for_audit
from apps.risks.services import generate_risks_for_audit
from apps.scoring.services import compute_audit_score

from .models import Answer, Audit


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    fields = ("question", "answer_choice", "computed_score", "comment", "evidence")
    readonly_fields = ("computed_score",)


@admin.register(Audit)
class AuditAdmin(admin.ModelAdmin):
    list_display = (
        "organization",
        "framework",
        "auditor",
        "status",
        "overall_score",
        "maturity_level_label",
        "start_date",
        "end_date",
    )
    list_filter = ("status", "framework", "organization")
    search_fields = ("organization__name",)
    readonly_fields = ("overall_score", "maturity_level_label", "created_at", "updated_at")
    inlines = [AnswerInline]
    actions = [
        "recalculate_score",
        "generate_risks",
        "generate_recommendations",
        "generate_action_plan",
        "generate_pdf_report",
        "notify_completed",
    ]

    @admin.action(description="Recalculer le score (par catégorie + global)")
    def recalculate_score(self, request, queryset):
        for audit in queryset:
            compute_audit_score(audit)
        self.message_user(request, f"Score recalculé pour {queryset.count()} audit(s).")

    @admin.action(description="Générer les risques (à partir des réponses)")
    def generate_risks(self, request, queryset):
        total = 0
        for audit in queryset:
            total += len(generate_risks_for_audit(audit))
        self.message_user(request, f"{total} risque(s) généré(s)/mis à jour.")

    @admin.action(description="Générer les recommandations (à partir des risques)")
    def generate_recommendations(self, request, queryset):
        total = 0
        for audit in queryset:
            total += len(generate_recommendations_for_audit(audit))
        self.message_user(request, f"{total} recommandation(s) générée(s)/mise(s) à jour.")

    @admin.action(description="Générer le plan d'action (à partir des recommandations)")
    def generate_action_plan(self, request, queryset):
        total = 0
        for audit in queryset:
            total += len(generate_action_plan_for_audit(audit))
        self.message_user(request, f"{total} action(s) créée(s).")

    @admin.action(description="Générer le rapport PDF")
    def generate_pdf_report(self, request, queryset):
        for audit in queryset:
            generate_report_for_audit(audit, generated_by=request.user)
        self.message_user(request, f"Rapport PDF généré pour {queryset.count()} audit(s).")

    @admin.action(description="Notifier (audit terminé)")
    def notify_completed(self, request, queryset):
        for audit in queryset:
            notify_audit_completed(audit)
        self.message_user(request, f"Notifications envoyées pour {queryset.count()} audit(s).")


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ("audit", "question", "answer_choice", "computed_score", "updated_at")
    list_filter = ("audit__organization", "question__category")
    search_fields = ("question__question_text",)
    readonly_fields = ("computed_score",)
