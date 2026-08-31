import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { fetchFrameworkDetail, submitAnswer, ApiError } from "../lib/api.js";

export default function QuestionnaireForm({ accessToken, audit, disabled, onAnswerSaved }) {
  const [framework, setFramework] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> answerChoiceId
  const [comments, setComments] = useState({}); // questionId -> comment text
  const [evidenceNames, setEvidenceNames] = useState({}); // questionId -> filename
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchFrameworkDetail(accessToken, audit.framework);
        if (cancelled) return;
        setFramework(data);

        const existingChoices = {};
        const existingComments = {};
        const existingEvidence = {};
        for (const answer of audit.answers || []) {
          if (answer.answer_choice) existingChoices[answer.question] = answer.answer_choice;
          if (answer.comment) existingComments[answer.question] = answer.comment;
          if (answer.evidence) {
            existingEvidence[answer.question] = answer.evidence.split("/").pop();
          }
        }
        setAnswers(existingChoices);
        setComments(existingComments);
        setEvidenceNames(existingEvidence);
      } catch {
        if (!cancelled) setError("Impossible de charger le questionnaire.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, audit.framework, audit.answers]);

  async function saveAnswer(questionId, { choiceId, comment, evidenceFile } = {}) {
    setSavingQuestionId(questionId);
    setError(null);
    try {
      const resolvedChoice = choiceId !== undefined ? choiceId : answers[questionId];
      const resolvedComment = comment !== undefined ? comment : comments[questionId];

      let payload;
      if (evidenceFile) {
        payload = new FormData();
        payload.append("question", questionId);
        if (resolvedChoice) payload.append("answer_choice", resolvedChoice);
        if (resolvedComment) payload.append("comment", resolvedComment);
        payload.append("evidence", evidenceFile);
      } else {
        payload = {
          question: questionId,
          ...(resolvedChoice ? { answer_choice: resolvedChoice } : {}),
          ...(resolvedComment ? { comment: resolvedComment } : {}),
        };
      }

      await submitAnswer(accessToken, audit.id, payload);
      onAnswerSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer la réponse.");
    } finally {
      setSavingQuestionId(null);
    }
  }

  function handleSelect(questionId, choiceId) {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
    saveAnswer(questionId, { choiceId });
  }

  function handleCommentBlur(questionId) {
    saveAnswer(questionId, { comment: comments[questionId] });
  }

  function handleFileChange(questionId, file) {
    if (!file) return;
    setEvidenceNames((prev) => ({ ...prev, [questionId]: file.name }));
    saveAnswer(questionId, { evidenceFile: file });
  }

  if (loading) {
    return <p className="text-[13px] text-ink-muted">Chargement du questionnaire…</p>;
  }

  if (!framework) {
    return <p className="text-[13px] text-danger">Questionnaire introuvable.</p>;
  }

  return (
    <div className="space-y-7">
      {error && (
        <div className="rounded-sm border border-danger-border bg-danger-bg px-3.5 py-2.5">
          <p className="text-[13px] text-danger">{error}</p>
        </div>
      )}

      {framework.categories.map((category) => (
        <section key={category.id}>
          <h3 className="text-[13.5px] font-semibold text-ink-primary">
            {category.name}
          </h3>
          <div className="mt-3 divide-y divide-border rounded border border-border bg-surface">
            {category.questions.map((question) => (
              <div key={question.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[13.5px] text-ink-primary">
                    {question.question_text}
                  </p>
                  {savingQuestionId === question.id && (
                    <span className="flex-shrink-0 font-mono text-[11px] text-ink-muted">
                      Enregistrement…
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {question.choices.map((choice) => {
                    const isSelected = answers[question.id] === choice.id;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelect(question.id, choice.id)}
                        className={`rounded-sm border px-3.5 py-1.5 text-[13px] transition-colors ${
                          isSelected
                            ? "border-brand-700 bg-brand-700 text-white"
                            : "border-border text-ink-secondary hover:border-border-strong hover:text-ink-primary"
                        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <textarea
                    value={comments[question.id] || ""}
                    onChange={(e) =>
                      setComments((prev) => ({ ...prev, [question.id]: e.target.value }))
                    }
                    onBlur={() => handleCommentBlur(question.id)}
                    disabled={disabled}
                    rows={1}
                    placeholder="Commentaire (optionnel)"
                    className="block w-full flex-1 resize-none rounded-sm border border-border bg-white px-3 py-2 text-[13px] text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-bg"
                  />

                  <label
                    className={`flex h-9 flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-sm border border-border px-3 text-[12.5px] text-ink-secondary hover:border-border-strong hover:text-ink-primary ${
                      disabled ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {evidenceNames[question.id] ? "Preuve jointe" : "Joindre"}
                    <input
                      type="file"
                      className="hidden"
                      disabled={disabled}
                      accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                      onChange={(e) => handleFileChange(question.id, e.target.files?.[0])}
                    />
                  </label>
                </div>
                {evidenceNames[question.id] && (
                  <p className="mt-1 text-[11.5px] text-ink-muted">
                    {evidenceNames[question.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
