import { useMemo, useState } from 'react'
import domoLogo from './assets/domo-logo.png'

const WEBHOOK_URL =
  'https://domo.domo.com/api/iot/v1/webhook/data/eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3ODY2MTUxODYsInN0cmVhbSI6ImYwNDI3ODEzZTRhNDQzMDE4MmU2YTMwY2VkMmRlNDY4OmRvbW86MjA1NzkwNTk1MiJ9.gDYT2smGqn9PQPXSSJDHUaKPtu3c-WCjW_98c2oRcK0'

const LIKERT = [
  { value: 5, label: 'Strongly Agree' },
  { value: 4, label: 'Agree' },
  { value: 3, label: 'Neutral' },
  { value: 2, label: 'Disagree' },
  { value: 1, label: 'Strongly Disagree' },
]

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 3) | 8).toString(16)
  })
}

function LikertQuestion({ num, text, name, value, onChange }) {
  return (
    <div className="card">
      <div className="q-num">Question {num}</div>
      <div className="q-text">{text}</div>
      <div className="options">
        {LIKERT.map((opt) => {
          const selected = value === opt.value
          return (
            <label key={opt.value} className={`option${selected ? ' selected' : ''}`}>
              <input
                type="radio"
                name={name}
                value={String(opt.value)}
                checked={selected}
                onChange={() => onChange(opt.value)}
              />
              {opt.label}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const projectName        = params.get('project')      || ''
  const customerAccount    = params.get('account')      || ''
  const customerContact    = params.get('contact')      || ''
  const customerContactName = params.get('contact_name') || ''

  const [answers, setAnswers] = useState({
    q1_value_delivered:    null,
    q2_driving_adoption:   null,
    q3_customer_experience: null,
    q4_comments:           '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState(null)

  const isComplete =
    answers.q1_value_delivered    !== null &&
    answers.q2_driving_adoption   !== null &&
    answers.q3_customer_experience !== null

  const set = (key) => (val) => setAnswers((prev) => ({ ...prev, [key]: val }))

  async function handleSubmit() {
    if (!isComplete || submitting) return
    setSubmitting(true)
    setError(null)
    const payload = {
      response_id:           generateId(),
      submitted_at:          new Date().toISOString(),
      project_name:          projectName,
      customer_account:      customerAccount,
      customer_contact:      customerContact,
      customer_contact_name: customerContactName,
      q1_value_delivered:    answers.q1_value_delivered,
      q2_driving_adoption:   answers.q2_driving_adoption,
      q3_customer_experience: answers.q3_customer_experience,
      q4_comments:           answers.q4_comments,
      avg_score: (
        (answers.q1_value_delivered + answers.q2_driving_adoption + answers.q3_customer_experience) / 3
      ).toFixed(2),
      user_agent: navigator.userAgent,
    }
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: new Blob([JSON.stringify(payload)]),
      })
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <>
        <header className="brand-band">
          <img src={domoLogo} alt="Domo" className="brand-logo" />
        </header>
        <div className="page">
          <div className="thanks">
            <h2>Thank you</h2>
            <p>Your feedback has been recorded. We appreciate your time.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="brand-band">
        <img src={domoLogo} alt="Domo" className="brand-logo" />
      </header>
      <div className="page">
        <div className="header">
          <div className="header-bar" />
          <h1>Domo Consulting — Customer Feedback</h1>
        </div>
        {(customerAccount || projectName) && (
          <div className="context-pill">
            {customerAccount}{projectName ? ` · ${projectName}` : ''}
          </div>
        )}
        <p className="intro">
          Thank you for working with Domo Consulting. Please take a moment to share
          your experience — your feedback helps us improve.
        </p>

        <LikertQuestion
          num={1}
          text="Domo Consulting helped me realize the expected value from the engagement."
          name="q1"
          value={answers.q1_value_delivered}
          onChange={set('q1_value_delivered')}
        />
        <LikertQuestion
          num={2}
          text="Domo Consulting enabled my team to drive adoption of the solution to the intended audience."
          name="q2"
          value={answers.q2_driving_adoption}
          onChange={set('q2_driving_adoption')}
        />
        <LikertQuestion
          num={3}
          text="Overall, I had a positive Customer experience working with Domo Consulting."
          name="q3"
          value={answers.q3_customer_experience}
          onChange={set('q3_customer_experience')}
        />

        <div className="card">
          <div className="q-num">Question 4</div>
          <div className="q-text">
            Please provide any additional comments regarding your Domo Consulting experience.{' '}
            <span className="optional">(Optional)</span>
          </div>
          <textarea
            value={answers.q4_comments}
            onChange={(e) => set('q4_comments')(e.target.value)}
            placeholder="Share any thoughts, suggestions, or feedback…"
          />
        </div>

        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button
            className="btn"
            disabled={!isComplete || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>
      </div>
    </>
  )
}
