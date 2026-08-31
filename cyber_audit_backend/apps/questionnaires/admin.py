from django.contrib import admin

from .models import AnswerChoice, Category, Framework, Question, QuestionCondition


class CategoryInline(admin.TabularInline):
    model = Category
    extra = 1


@admin.register(Framework)
class FrameworkAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
    inlines = [CategoryInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "framework", "weight", "order")
    list_filter = ("framework",)
    search_fields = ("name",)
    ordering = ("framework", "order")


class AnswerChoiceInline(admin.TabularInline):
    model = AnswerChoice
    extra = 3


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "question_text",
        "category",
        "question_type",
        "weight",
        "required",
        "active",
        "order",
    )
    list_filter = ("category__framework", "category", "question_type", "active", "required")
    search_fields = ("question_text",)
    ordering = ("category", "order")
    inlines = [AnswerChoiceInline]


@admin.register(QuestionCondition)
class QuestionConditionAdmin(admin.ModelAdmin):
    list_display = ("question", "depends_on_question", "required_choice")
    search_fields = ("question__question_text", "depends_on_question__question_text")
