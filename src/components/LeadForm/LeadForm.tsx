'use client';

import React, { useState, useCallback, useRef } from 'react';
import { HoneypotField } from './HoneypotField';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Honeypot — should always be empty
  website: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  form?: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// ─── Client-Side Validation Helpers ───────────────────────────────────────────
// NOTE: These validate UX only. The API route re-validates with Zod.
// Never trust client-side validation as your security boundary.

const validateEmail = (email: string): boolean => {
  // RFC 5322 simplified — good enough for UX validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
};

const validatePhone = (phone: string): boolean => {
  // Accept US formats: 5039987760, (503) 998-7760, 503-998-7760, +15039987760
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 1 && name.trim().length <= 100;
};

// ─── Rate Limit Guard (Client-Side) ───────────────────────────────────────────
// This is a UX guard only. Real rate limiting is enforced server-side.
// Prevents accidental double-submission and discourages casual abuse.

const SUBMISSION_COOLDOWN_MS = 30_000; // 30 seconds between submissions

// ─── Component ────────────────────────────────────────────────────────────────

export const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '', // honeypot — always empty for real users
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const lastSubmitTime = useRef<number>(0);

  // ── Input Handler ──────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear field error on change
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  // ── Client-Side Validation ─────────────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!validateName(formData.firstName)) {
      newErrors.firstName = 'Please enter your first name.';
    }
    if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Please enter your last name.';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ── Submit Handler ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // ── 1. Client-side rate limit guard ────────────────────────────────────
      const now = Date.now();
      if (now - lastSubmitTime.current < SUBMISSION_COOLDOWN_MS) {
        setErrors({
          form: 'Please wait a moment before submitting again.',
        });
        return;
      }

      // ── 2. Honeypot check ──────────────────────────────────────────────────
      // If the honeypot field has a value, silently "succeed" without
      // actually submitting. Bots should not know they were caught.
      if (formData.website.trim() !== '') {
        // Silent fake success — bot thinks it worked
        setSubmitState('success');
        return;
      }

      // ── 3. Validate ────────────────────────────────────────────────────────
      if (!validateForm()) return;

      // ── 4. Submit ──────────────────────────────────────────────────────────
      setSubmitState('submitting');
      lastSubmitTime.current = now;

      try {
        const response = await fetch('/api/submit-lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            // SECURITY: honeypot field is sent to API route for server-side
            // validation as well. NOT sent to GHL.
            _hp: formData.website,
          }),
        });

        if (!response.ok) {
          // Parse error but never log sensitive data
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Submission failed');
        }

        setSubmitState('success');

        // Clear form data after success
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          website: '',
        });
      } catch (error) {
        // SECURITY: Log error type only — never log form data containing PII
        // console.error('Form submission error:', error) -- NOT logging PII
        console.error('Form submission failed. Type:', typeof error);

        setSubmitState('error');
        setErrors({
          form: 'Something went wrong. Please try again or call us at 503-998-7760.',
        });
      }
    },
    [formData, validateForm]
  );

  // ── Success State ──────────────────────────────────────────────────────────

  if (submitState === 'success') {
    return (
      <div
        className="form-success"
        role="alert"
        aria-live="polite"
      >
        <div className="success-icon" aria-hidden="true">✓</div>
        <h3>You&apos;re All Set!</h3>
        <p>
          We&apos;ll be in touch within 24 hours to schedule your free
          consultation. Can&apos;t wait? Call us now at{' '}
          <a href="tel:+15039987760">503-998-7760</a>.
        </p>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Request your free first time buyer consultation"
    >
      {/* ── Honeypot (invisible to real users) ────────────────────────── */}
      <HoneypotField />

      {/* ── First Name ────────────────────────────────────────────────── */}
      <div className="field-group">
        <label htmlFor="firstName">First Name *</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          autoComplete="given-name"
          maxLength={100}
          aria-required="true"
          aria-invalid={!!errors.firstName}
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          disabled={submitState === 'submitting'}
        />
        {errors.firstName && (
          <span
            id="firstName-error"
            className="field-error"
            role="alert"
          >
            {errors.firstName}
          </span>
        )}
      </div>

      {/* ── Last Name ─────────────────────────────────────────────────── */}
      <div className="field-group">
        <label htmlFor="lastName">Last Name *</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          autoComplete="family-name"
          maxLength={100}
          aria-required="true"
          aria-invalid={!!errors.lastName}
          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          disabled={submitState === 'submitting'}
        />
        {errors.lastName && (
          <span
            id="lastName-error"
            className="field-error"
            role="alert"
          >
            {errors.lastName}
          </span>
        )}
      </div>

      {/* ── Email ─────────────────────────────────────────────────────── */}
      <div className="field-group">
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          maxLength={254}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          disabled={submitState === 'submitting'}
        />
        {errors.email && (
          <span
            id="email-error"
            className="field-error"
            role="alert"
          >
            {errors.email}
          </span>
        )}
      </div>

      {/* ── Phone ─────────