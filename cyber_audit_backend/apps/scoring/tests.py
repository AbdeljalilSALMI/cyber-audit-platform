from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.audits.models import Answer, Audit
from apps.organizations.models import Organization
from apps.questionnaires.models import AnswerChoice, Category, Framework, Question
from apps.scoring.models import MaturityLevel, Score
from apps.scoring.services import compute_audit_score


class ScoringEngineTests(TestCase):
    """
    Tests détaillés du moteur de scoring (section 11 + 24).

    Scénario : une catégorie "Gouvernance" avec deux questions de poids 3
    et 2 (max théorique = 5). Une réponse "Oui" (100 %) et une réponse
    "Partiellement" (50 %) donnent : 3×1 + 2×0.5 = 4 points sur 5, soit 80 %.
    """

    def setUp(self):
        self.org = Organization.objects.create(name="TechnoPME Test")
        self.framework = Framework.objects.create(name="Référentiel Test")
        self.category = Category.objects.create(
            framework=self.framework, name="Gouvernance", weight=5, order=1
        )
        self.q1 = Question.objects.create(
            category=self.category, question_text="Q1", weight=3, order=1
        )
        self.q2 = Question.objects.create(
            category=self.category, question_text="Q2", weight=2, order=2
        )
        self.q1_oui = AnswerChoice.objects.create(question=self.q1, label="Oui", percentage=100)
        self.q2_partiel = AnswerChoice.objects.create(
            question=self.q2, label="Partiellement", percentage=50
        )

        for name, mn, mx in [
            ("Initial", 0, 20),
            ("Basique", 21, 40),
            ("Intermédiaire", 41, 60),
            ("Maîtrisé", 61, 80),
            ("Optimisé", 81, 100),
        ]:
            MaturityLevel.objects.create(name=name, min_percentage=mn, max_percentage=mx)

        self.audit = Audit.objects.create(organization=self.org, framework=self.framework)

    def test_answer_computed_score_is_weight_times_percentage(self):
        """Answer.computed_score = poids de la question × pourcentage du choix (section 11)."""
        answer = Answer.objects.create(audit=self.audit, question=self.q1, answer_choice=self.q1_oui)
        self.assertEqual(answer.computed_score, Decimal("3.00"))  # 3 × 100 %

        answer2 = Answer.objects.create(
            audit=self.audit, question=self.q2, answer_choice=self.q2_partiel
        )
        self.assertEqual(answer2.computed_score, Decimal("1.00"))  # 2 × 50 %

    def test_answer_without_choice_has_no_score(self):
        answer = Answer.objects.create(audit=self.audit, question=self.q1)
        self.assertIsNone(answer.computed_score)

    def test_compute_audit_score_category_and_global(self):
        Answer.objects.create(audit=self.audit, question=self.q1, answer_choice=self.q1_oui)
        Answer.objects.create(audit=self.audit, question=self.q2, answer_choice=self.q2_partiel)

        compute_audit_score(self.audit)

        category_score = Score.objects.get(audit=self.audit, category=self.category)
        self.assertEqual(category_score.raw_points, Decimal("4.00"))  # 3 + 1
        self.assertEqual(category_score.max_points, Decimal("5"))  # weight de la catégorie
        self.assertEqual(category_score.percentage, Decimal("80.00"))  # 4/5 × 100

        global_score = Score.objects.get(audit=self.audit, category__isnull=True)
        self.assertEqual(global_score.percentage, Decimal("80.00"))

    def test_compute_audit_score_updates_audit_cache_fields(self):
        Answer.objects.create(audit=self.audit, question=self.q1, answer_choice=self.q1_oui)
        Answer.objects.create(audit=self.audit, question=self.q2, answer_choice=self.q2_partiel)

        compute_audit_score(self.audit)
        self.audit.refresh_from_db()

        self.assertEqual(self.audit.overall_score, Decimal("80.00"))
        self.assertEqual(self.audit.maturity_level_label, "Maîtrisé")  # 61-80 %

    def test_maturity_level_for_percentage(self):
        self.assertEqual(MaturityLevel.for_percentage(10).name, "Initial")
        self.assertEqual(MaturityLevel.for_percentage(35).name, "Basique")
        self.assertEqual(MaturityLevel.for_percentage(50).name, "Intermédiaire")
        self.assertEqual(MaturityLevel.for_percentage(70).name, "Maîtrisé")
        self.assertEqual(MaturityLevel.for_percentage(95).name, "Optimisé")

    def test_compute_audit_score_with_no_answers_gives_zero(self):
        compute_audit_score(self.audit)
        self.audit.refresh_from_db()
        self.assertEqual(self.audit.overall_score, Decimal("0"))
