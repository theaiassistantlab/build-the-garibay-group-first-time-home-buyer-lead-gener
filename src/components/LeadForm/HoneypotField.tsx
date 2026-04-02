/**
 * Honeypot Field Component
 *
 * A hidden form field that legitimate users never see or fill out.
 * Bots that auto-fill forms will populate this field, exposing them.
 *
 * Implementation rules:
 * 1. Hidden via CSS, NOT via `display:none` or `type="hidden"` — bots skip those
 * 2. Field name looks legitimate to fool scrapers
 * 3. Never submitted to GHL — checked server-side and discarded
 * 4. Accessible: aria-hidden prevents screen readers from announcing it
 */

import React from 'react';

export const HoneypotField: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        // Visually hidden but NOT display:none — bots still find it
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
        tabIndex: -1,
      }}
    >
      {/*
       * Field named "website" — sounds like a normal business field.
       * Bots will fill it. Humans will not (they can't see it).
       * autoComplete="off" discourages browser autofill from populating it.
       */}
      <label htmlFor="website_url">Website</label>
      <input
        type="text"
        id="website_url"
        name="website"
        defaultValue=""
        autoComplete="off"
        tabIndex={-1}
      />
    </div>
  );
};

export default HoneypotField;