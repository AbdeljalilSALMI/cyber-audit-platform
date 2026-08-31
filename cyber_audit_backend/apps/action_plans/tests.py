from django.test import TestCase

from apps.action_plans.models import Action
from apps.action_plans.services import generate_action_plan_for_audit
from apps.audits.models import Answer, Audit
from apps.organizations.models import Organization
from apps.questionnaires.models import AnswerChoice, Category, Framework, Question
from apps.recommendations.models import RecommendationTemplate
from apps.risks.models import RiskTemplate
from apps.risks.services import generate_risks_for_audit
from apps.recommendations.services import generate_recommendations_for_audit


class ActionPlanTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="TechnoPME Test")
        self.framework = Framework.objects.create(name="Référentiel Test")
        self.category = Category.objects.create(framework=self.framework, name="Accès", weight=2)
        self.question = Question.objects.create(category=self.category, question_text="MFA ?", weight=2)
        self.choice_non = AnswerChoice.objects.create(question=self.question, label="Non", percentage=0)
        self.audit = Audit.objects.create(organization=self.org, framework=self.framework)

        risk_template = RiskTemplate.objects.create(
            question=self.question, trigger_choice=self.choice_non,
            risk_name="Absence de MFA", default_probability=3, default_impact=4,
        )
        RecommendationTemplate.objects.create(
            risk_template=risk_template, title="Activer MFA", priority="HIGH", estimated_effort="LOW",
        )
        Answer.objects.create(audit=self.audit, question=self.question, answer_choice=self.choice_non)
        generate_risks_for_audit(self.audit)
        generate_recommendations_for_audit(self.audit)

    def test_generate_action_plan_creates_one_action_per_recommendation(self):
        created = generate_action_plan_for_audit(self.audit)
        self.assertEqual(len(created), 1)

        action = Action.objects.get()
        self.assertEqual(action.title, "Activer MFA")
        self.assertEqual(action.status, Action.Status.TODO)
        self.assertEqual(action.priority, "HIGH")

    def test_generate_action_plan_is_idempotent(self):
        generate_action_plan_for_audit(self.audit)
        generate_action_plan_for_audit(self.audit)
        self.assertEqual(Action.objects.count(), 1)

    def test_completed_at_set_when_status_becomes_completed(self):
        action = Action.objects.create(
            recommendation=self.audit.risks.first().recommendations.first(),
            title="Test", status=Action.Status.TODO,
        )
        self.assertIsNone(action.completed_at)

        action.status = Action.Status.COMPLETED
        action.save()
        action.refresh_from_db()
        self.assertIsNotNone(action.completed_at)

    def test_completed_at_cleared_if_status_reverted(self):
        action = Action.objects.create(
            recommendation=self.audit.risks.first().recommendations.first(),
            title="Test", status=Action.Status.COMPLETED,
        )
        action.refresh_from_db()
        self.assertIsNotNone(action.completed_at)

        action.status = Action.Status.IN_PROGRESS
        action.save()
        action.refresh_from_db()
        self.assertIsNone(action.completed_at)
