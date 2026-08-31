from django.core.exceptions import ValidationError
from django.db import models


class Framework(models.Model):
    

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Référentiel"
        verbose_name_plural = "Référentiels"

    def __str__(self):
        return self.name


class Category(models.Model):
    """
    Un thème / domaine de cybersécurité au sein d'un référentiel.

    `weight` correspond au score maximal théorique de la catégorie (somme
    des poids de ses questions). Avec cette convention, la formule générale
    du score global (Σ(Category Score × Weight) / Σ Weight, section 11 du
    prompt) redonne exactement le même résultat que la méthode du Jalon 1
    (somme des points obtenus / somme des poids sur les 24 questions) —
    les deux approches sont mathématiquement équivalentes.
    """

    framework = models.ForeignKey(Framework, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    weight = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["framework", "order", "name"]
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        unique_together = ("framework", "name")

    def __str__(self):
        return f"{self.framework.name} — {self.name}"


class Question(models.Model):
    class QuestionType(models.TextChoices):
        YES_NO = "YES_NO", "Oui / Non"
        SINGLE_CHOICE = "SINGLE_CHOICE", "Choix unique"
        MULTIPLE_CHOICE = "MULTIPLE_CHOICE", "Choix multiple"
        TEXT = "TEXT", "Texte libre"
        NUMBER = "NUMBER", "Nombre"
        SCALE = "SCALE", "Échelle"

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="questions")
    question_text = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    question_type = models.CharField(
        max_length=20, choices=QuestionType.choices, default=QuestionType.YES_NO
    )
    weight = models.PositiveIntegerField(default=1)
    required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "order"]
        verbose_name = "Question"
        verbose_name_plural = "Questions"

    def __str__(self):
        return self.question_text

    @property
    def framework(self):
        """Référentiel accessible via la catégorie (voir note d'architecture)."""
        return self.category.framework


class AnswerChoice(models.Model):
    """Une réponse possible à une question, avec le pourcentage du poids qu'elle rapporte."""

    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    label = models.CharField(max_length=255)
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Pourcentage du poids de la question attribué à ce choix (ex : 100, 50, 0).",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["question", "order"]
        verbose_name = "Choix de réponse"
        verbose_name_plural = "Choix de réponse"

    def __str__(self):
        return f"{self.question.question_text} — {self.label} ({self.percentage}%)"


class QuestionCondition(models.Model):
    """Rend `question` visible seulement si `depends_on_question` = `required_choice`."""

    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="conditions")
    depends_on_question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="triggers"
    )
    required_choice = models.ForeignKey(
        AnswerChoice, on_delete=models.CASCADE, related_name="triggers_conditions"
    )

    class Meta:
        verbose_name = "Condition d'affichage"
        verbose_name_plural = "Conditions d'affichage"
        unique_together = ("question", "depends_on_question")

    def __str__(self):
        return f"{self.question} visible si {self.depends_on_question} = {self.required_choice.label}"

    def clean(self):
        if self.question_id == self.depends_on_question_id:
            raise ValidationError("Une question ne peut pas dépendre d'elle-même.")
